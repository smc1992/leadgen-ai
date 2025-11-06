import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Instantly API configuration
const INSTANTLY_API_URL = 'https://api.instantly.ai/api/v1'
const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY

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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    if (!INSTANTLY_API_KEY) {
      console.error('Instantly API key missing. Set INSTANTLY_API_KEY in environment.')
      return NextResponse.json({ error: 'Service unavailable: Instantly not configured' }, { status: 503 })
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!INSTANTLY_API_KEY) {
      console.error('Instantly API key missing. Set INSTANTLY_API_KEY in environment.')
      return NextResponse.json({ error: 'Service unavailable: Instantly not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (campaignId) {
      return await getCampaignDetails(campaignId, session.user.id)
    } else {
      return await listCampaigns(session.user.id)
    }

  } catch (error) {
    console.error('Instantly GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createCampaign(campaignData: InstantlyCampaign, userId: string) {
  try {
    if (!INSTANTLY_API_KEY) {
      throw new Error('Instantly not configured')
    }
    const response = await fetch(`${INSTANTLY_API_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaignData)
    })

    if (!response.ok) {
      throw new Error('Failed to create campaign')
    }

    const instantlyCampaign = await response.json()

    // Store campaign in our database
    const { data: dbCampaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        user_id: userId,
        name: campaignData.name,
        instantly_id: instantlyCampaign.id,
        subject: campaignData.subject,
        template: campaignData.template,
        status: 'draft',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      campaign: dbCampaign,
      instantlyCampaign 
    }, { status: 201 })

  } catch (error) {
    console.error('Create campaign error:', error)
    throw error
  }
}

async function launchCampaign(campaignId: string, userId: string) {
  try {
    if (!INSTANTLY_API_KEY) {
      throw new Error('Instantly not configured')
    }
    const response = await fetch(`${INSTANTLY_API_URL}/campaigns/${campaignId}/launch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to launch campaign')
    }

    // Update campaign status in database
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status: 'active' })
      .eq('instantly_id', campaignId)
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
    const response = await fetch(`${INSTANTLY_API_URL}/campaigns/${data.campaignId}/leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leads: data.leads })
    })

    if (!response.ok) {
      throw new Error('Failed to add leads to campaign')
    }

    const result = await response.json()

    // Store leads in our database
    const leadsToInsert = data.leads.map(lead => ({
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

    return NextResponse.json({ 
      success: true,
      addedCount: result.addedCount || data.leads.length 
    })

  } catch (error) {
    console.error('Add leads error:', error)
    throw error
  }
}

async function getCampaignAnalytics(campaignId: string, userId: string) {
  try {
    const response = await fetch(`${INSTANTLY_API_URL}/campaigns/${campaignId}/analytics`, {
      headers: {
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get campaign analytics')
    }

    const analytics = await response.json()

    // Update analytics in our database
    await supabaseAdmin
      .from('campaigns')
      .update({
        sent_count: analytics.sent || 0,
        opened_count: analytics.opened || 0,
        clicked_count: analytics.clicked || 0,
        replied_count: analytics.replied || 0,
        updated_at: new Date().toISOString()
      })
      .eq('instantly_id', campaignId)
      .eq('user_id', userId)

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error('Get analytics error:', error)
    throw error
  }
}

async function updateCampaignStatus(data: { instantlyId: string; status: string }, userId: string) {
  try {
    const { instantlyId, status } = data
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status })
      .eq('instantly_id', instantlyId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update campaign status error:', error)
    throw error
  }
}

async function listCampaigns(userId: string) {
  try {
    const response = await fetch(`${INSTANTLY_API_URL}/campaigns`, {
      headers: {
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to list campaigns')
    }

    const instantlyCampaigns = await response.json()

    // Get our stored campaigns
    const { data: dbCampaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Merge data
    const mergedCampaigns = dbCampaigns.map(dbCampaign => {
      const instantlyData = instantlyCampaigns.find((ic: any) => ic.id === dbCampaign.instantly_id)
      return {
        ...dbCampaign,
        instantlyData
      }
    })

    return NextResponse.json({ campaigns: mergedCampaigns })

  } catch (error) {
    console.error('List campaigns error:', error)
    throw error
  }
}

async function getCampaignDetails(campaignId: string, userId: string) {
  try {
    const response = await fetch(`${INSTANTLY_API_URL}/campaigns/${campaignId}`, {
      headers: {
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get campaign details')
    }

    const instantlyCampaign = await response.json()

    // Get our stored campaign data
    const { data: dbCampaign, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('instantly_id', campaignId)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return NextResponse.json({ 
      campaign: {
        ...dbCampaign,
        instantlyData: instantlyCampaign
      }
    })

  } catch (error) {
    console.error('Get campaign details error:', error)
    throw error
  }
}
