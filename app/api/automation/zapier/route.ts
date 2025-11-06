import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: integrations, error } = await supabaseAdmin
      .from('zapier_integrations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ integrations: integrations || [] })
  } catch (error) {
    console.error('Zapier integrations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { zap_id, name, description, trigger_url, event_types } = body

    if (!zap_id || !name || !trigger_url) {
      return NextResponse.json({
        error: 'Zap ID, name, and trigger URL are required'
      }, { status: 400 })
    }

    // Check if zap_id already exists
    const { data: existing } = await supabaseAdmin
      .from('zapier_integrations')
      .select('id')
      .eq('zap_id', zap_id)
      .single()

    if (existing) {
      return NextResponse.json({
        error: 'A Zap with this ID already exists'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('zapier_integrations')
      .insert({
        user_id: session.user.id,
        zap_id,
        name,
        description,
        trigger_url,
        event_types: event_types || []
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ integration: data }, { status: 201 })
  } catch (error) {
    console.error('Zapier integrations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, trigger_url, event_types, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('zapier_integrations')
      .update({
        name,
        description,
        trigger_url,
        event_types,
        is_active
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ integration: data })
  } catch (error) {
    console.error('Zapier integrations PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('zapier_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Zapier integrations DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Webhook endpoint for Zapier triggers
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { zap_id, event_type, event_data } = body

    if (!zap_id || !event_type) {
      return NextResponse.json({ error: 'Zap ID and event type are required' }, { status: 400 })
    }

    // Find the integration
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('zapier_integrations')
      .select('*')
      .eq('zap_id', zap_id)
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Integration not found or inactive' }, { status: 404 })
    }

    // Check if this event type is enabled for this integration
    if (integration.event_types && !integration.event_types.includes(event_type)) {
      return NextResponse.json({ error: 'Event type not enabled for this integration' }, { status: 400 })
    }

    // Update trigger count and last triggered timestamp
    await supabaseAdmin
      .from('zapier_integrations')
      .update({
        trigger_count: (integration.trigger_count || 0) + 1,
        last_triggered_at: new Date().toISOString()
      })
      .eq('id', integration.id)

    // Process the event based on type
    await processZapierEvent(integration.user_id, event_type, event_data)

    return NextResponse.json({
      success: true,
      message: `Event ${event_type} processed for integration ${integration.name}`
    })

  } catch (error) {
    console.error('Zapier webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function processZapierEvent(userId: string, eventType: string, eventData: any) {
  try {
    switch (eventType) {
      case 'new_lead':
        // Create a new lead
        await supabaseAdmin.from('leads').insert({
          full_name: eventData.name,
          email: eventData.email,
          company: eventData.company,
          job_title: eventData.job_title,
          source: 'zapier',
          channel: 'api'
        })
        break

      case 'new_deal':
        // Create a new deal
        const { data: deal } = await supabaseAdmin
          .from('deals')
          .insert({
            title: eventData.title,
            deal_value: eventData.value,
            contact_name: eventData.contact_name,
            contact_email: eventData.contact_email,
            company_name: eventData.company_name,
            created_by: userId
          })
          .select()
          .single()

        if (deal) {
          await supabaseAdmin.from('deal_activities').insert({
            deal_id: deal.id,
            user_id: userId,
            activity_type: 'created',
            description: 'Deal created via Zapier integration',
            metadata: eventData
          })
        }
        break

      case 'email_opened':
        // Log email open activity
        if (eventData.deal_id) {
          await supabaseAdmin.from('deal_activities').insert({
            deal_id: eventData.deal_id,
            user_id: userId,
            activity_type: 'email_opened',
            description: `Email opened: ${eventData.subject}`,
            metadata: eventData
          })
        }
        break

      default:
        console.log('Unhandled Zapier event type:', eventType)
    }
  } catch (error) {
    console.error('Error processing Zapier event:', error)
  }
}
