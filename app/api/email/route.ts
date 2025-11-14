import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceGuards } from '@/lib/security'
import crypto from 'crypto'

const EMAIL_CAMPAIGNS_TABLE = 'email_campaigns'

interface InstantlyCampaign {
  name: string
  subject: string
  template: string
  fromEmail: string
  replyTo: string
  schedule?: {
    timezone: string
    startDate: string
    endDate: string
    daysOfWeek: number[]
    timeSlots: Array<{
      start: string
      end: string
    }>
  }
}

interface InstantlyLead {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  customVariables?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `email-post:${ip}`, 20, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'campaign':
        return await createCampaign(data, session.user.id)
      case 'launch':
        return await launchCampaign(data, session.user.id)
      case 'add-leads':
        return await addLeadsToCampaign(data, session.user.id)
      case 'analytics':
        return await getCampaignAnalytics(data, session.user.id)
      case 'update-status':
        return await updateCampaignStatus(data, session.user.id)
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Instantly API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `email-get:${ip}`, 60, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

    if (campaignId) {
      return await getCampaignDetails(campaignId, session.user.id)
    } else {
      return await listCampaigns(session.user.id, { limit, offset })
    }

  } catch (error) {
    console.error('Instantly GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createCampaign(campaignData: InstantlyCampaign, userId: string) {
  try {
    const { data: dbCampaign, error } = await supabaseAdmin
      .from(EMAIL_CAMPAIGNS_TABLE)
      .insert({
        user_id: userId,
        name: campaignData.name,
        subject: campaignData.subject,
        template: campaignData.template,
        status: 'draft',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      campaign: dbCampaign
    }, { status: 201 })

  } catch (error) {
    console.error('Create campaign error:', error)
    throw error
  }
}

async function launchCampaign(campaignId: string, userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from(EMAIL_CAMPAIGNS_TABLE)
      .update({ status: 'active' })
      .eq('id', campaignId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Launch campaign error:', error)
    throw error
  }
}

async function addLeadsToCampaign(data: { campaignId: string; leads: InstantlyLead[] }, userId: string) {
  try {
    // Filter Duplikate
    const emails = Array.from(new Set((data.leads || []).map(l => l.email.toLowerCase())))
    const { data: existingLeads } = await supabaseAdmin
      .from('leads')
      .select('email')
      .eq('user_id', userId)
      .eq('campaign_id', data.campaignId)
    const existingSet = new Set((existingLeads || []).map(l => (l.email || '').toLowerCase()))
    const filtered = data.leads.filter(l => !existingSet.has(l.email.toLowerCase()))
    const reqHash = crypto.createHash('sha256').update(JSON.stringify({ campaignId: data.campaignId, emails: filtered.map(l => l.email) })).digest('hex')
    const { data: prior } = await supabaseAdmin
      .from('deal_activities')
      .select('id')
      .eq('metadata->>request_hash', reqHash)
      .limit(1)
    if (prior && prior.length > 0) {
      return NextResponse.json({ success: true, addedCount: 0 })
    }

    // Store leads in our database
    const leadsToInsert = filtered.map(lead => ({
      user_id: userId,
      full_name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
      email: lead.email,
      company: lead.company,
      campaign_id: data.campaignId,
      created_at: new Date().toISOString()
    }))

    await supabaseAdmin
      .from('leads')
      .insert(leadsToInsert)

    await supabaseAdmin.from('deal_activities').insert({
      deal_id: null,
      user_id: userId,
      activity_type: 'outreach',
      description: 'Leads added to campaign',
      metadata: { request_hash: reqHash, addedCount: filtered.length },
      created_at: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true,
      addedCount: filtered.length 
    })

  } catch (error) {
    console.error('Add leads error:', error)
    throw error
  }
}

async function getCampaignAnalytics(campaignId: string, userId: string) {
  try {
    const { data: emailsAgg } = await supabaseAdmin
      .from('outreach_emails')
      .select('status')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)

    const sent = (emailsAgg || []).filter(e => e.status === 'sent').length
    const opened = (emailsAgg || []).filter(e => e.status === 'opened').length
    const clicked = (emailsAgg || []).filter(e => e.status === 'clicked').length
    const replied = (emailsAgg || []).filter(e => e.status === 'replied').length

    await supabaseAdmin
      .from(EMAIL_CAMPAIGNS_TABLE)
      .update({
        sent_count: sent,
        opened_count: opened,
        clicked_count: clicked,
        replied_count: replied,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', userId)

    return NextResponse.json({ analytics: { sent, opened, clicked, replied } })

  } catch (error) {
    console.error('Get analytics error:', error)
    throw error
  }
}

async function updateCampaignStatus(data: { instantlyId: string; status: string }, userId: string) {
  try {
    const { instantlyId, status } = data
    const { error } = await supabaseAdmin
      .from(EMAIL_CAMPAIGNS_TABLE)
      .update({ status })
      .eq('id', instantlyId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update campaign status error:', error)
    throw error
  }
}

async function listCampaigns(userId: string, opts?: { limit?: number; offset?: number }) {
  try {
    const { data: dbCampaigns, error } = await supabaseAdmin
      .from(EMAIL_CAMPAIGNS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(opts?.offset || 0, (opts?.offset || 0) + (opts?.limit || 20) - 1)

    if (error) throw error

    return NextResponse.json({ campaigns: dbCampaigns })

  } catch (error) {
    console.error('List campaigns error:', error)
    throw error
  }
}

async function getCampaignDetails(campaignId: string, userId: string) {
  try {
    const { data: dbCampaign, error } = await supabaseAdmin
      .from(EMAIL_CAMPAIGNS_TABLE)
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return NextResponse.json({ campaign: dbCampaign })

  } catch (error) {
    console.error('Get campaign details error:', error)
    throw error
  }
}
