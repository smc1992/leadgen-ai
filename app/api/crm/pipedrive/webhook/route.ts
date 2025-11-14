import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceGuards } from '@/lib/security'
import crypto from 'crypto'

// Handle Pipedrive webhooks for real-time synchronization
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `pipedrive-webhook:${ip}`, 60, 60_000)
    if (guard) return guard
    const raw = await request.text()
    const signature = request.headers.get('x-pipedrive-signature') || ''
    const webhookSecret = process.env.PIPEDRIVE_WEBHOOK_SECRET || ''
    if (webhookSecret) {
      const h = crypto.createHmac('sha256', webhookSecret)
      h.update(raw)
      const digest = h.digest('hex')
      if (!signature || signature !== digest) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }
    const body = JSON.parse(raw || '{}')
    const { event, data } = body

    console.log('Pipedrive webhook received:', { event, data: data?.id })

    if (!event || !data) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    switch (event) {
      case 'deal.updated':
      case 'deal.added':
        await handleDealUpdate(data)
        break

      case 'deal.deleted':
        await handleDealDeletion(data)
        break

      case 'person.updated':
      case 'person.added':
        await handlePersonUpdate(data)
        break

      case 'organization.updated':
      case 'organization.added':
        await handleOrganizationUpdate(data)
        break

      default:
        console.log('Unhandled webhook event:', event)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Pipedrive webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleDealUpdate(pipedriveDeal: any) {
  try {
    // Find our deal by Pipedrive ID
    const { data: existingDeal } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('custom_fields->>pipedrive_id', pipedriveDeal.id.toString())
      .single()

    if (existingDeal) {
      // Update existing deal
      const updateData: any = {
        title: pipedriveDeal.title,
        deal_value: pipedriveDeal.value || 0,
        currency: pipedriveDeal.currency || 'EUR',
        expected_close_date: pipedriveDeal.expected_close_date,
        custom_fields: {
          ...existingDeal.custom_fields,
          pipedrive_updated_at: new Date().toISOString()
        }
      }

      // Map status
      if (pipedriveDeal.status === 'won') {
        updateData.status = 'won'
        updateData.actual_close_date = new Date().toISOString()
      } else if (pipedriveDeal.status === 'lost') {
        updateData.status = 'lost'
      }

      // Update deal stage based on Pipedrive stage
      if (pipedriveDeal.stage_id) {
        const { data: stage } = await supabaseAdmin
          .from('deal_stages')
          .select('id')
          .eq('custom_fields->>pipedrive_stage_id', pipedriveDeal.stage_id.toString())
          .single()

        if (stage) {
          updateData.stage_id = stage.id
        }
      }

      await supabaseAdmin
        .from('deals')
        .update(updateData)
        .eq('id', existingDeal.id)

      // Log activity
      await supabaseAdmin.from('deal_activities').insert({
        deal_id: existingDeal.id,
        user_id: null, // System activity
        activity_type: 'crm_sync',
        description: `Deal updated from Pipedrive webhook`,
        metadata: {
          pipedrive_event: 'deal.updated',
          changes: updateData
        }
      })

    } else {
      // Create new deal from Pipedrive (if configured to do so)
      // This would be optional based on user preferences
      console.log('New deal from Pipedrive:', pipedriveDeal.id)
    }

  } catch (error) {
    console.error('Handle deal update error:', error)
  }
}

async function handleDealDeletion(pipedriveDeal: any) {
  try {
    // Mark our deal as deleted or archived
    const { data: deal } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('custom_fields->>pipedrive_id', pipedriveDeal.id.toString())
      .single()

    if (deal) {
      await supabaseAdmin
        .from('deals')
        .update({
          status: 'lost',
          notes: (deal.notes || '') + '\n[Deleted in Pipedrive]',
          custom_fields: {
            ...deal.custom_fields,
            pipedrive_deleted: true
          }
        })
        .eq('id', deal.id)

      // Log activity
      await supabaseAdmin.from('deal_activities').insert({
        deal_id: deal.id,
        user_id: null,
        activity_type: 'crm_sync',
        description: `Deal marked as lost (deleted in Pipedrive)`,
        metadata: {
          pipedrive_event: 'deal.deleted'
        }
      })
    }

  } catch (error) {
    console.error('Handle deal deletion error:', error)
  }
}

async function handlePersonUpdate(pipedrivePerson: any) {
  try {
    // Update contact information in deals
    const { data: deals } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('contact_email', pipedrivePerson.primary_email)

    for (const deal of deals || []) {
      await supabaseAdmin
        .from('deals')
        .update({
          contact_name: pipedrivePerson.name,
          contact_phone: pipedrivePerson.phone?.[0]?.value,
          custom_fields: {
            ...deal.custom_fields,
            pipedrive_person_updated: new Date().toISOString()
          }
        })
        .eq('id', deal.id)
    }

  } catch (error) {
    console.error('Handle person update error:', error)
  }
}

async function handleOrganizationUpdate(pipedriveOrg: any) {
  try {
    // Update company information in deals
    const { data: deals } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('company_name', pipedriveOrg.name)

    for (const deal of deals || []) {
      await supabaseAdmin
        .from('deals')
        .update({
          company_website: pipedriveOrg.website,
          custom_fields: {
            ...deal.custom_fields,
            pipedrive_org_updated: new Date().toISOString()
          }
        })
        .eq('id', deal.id)
    }

  } catch (error) {
    console.error('Handle organization update error:', error)
  }
}
