import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Pipedrive API Base URL
const PIPEDRIVE_API_BASE = 'https://api.pipedrive.com/v1'

interface PipedriveConfig {
  api_token: string
  company_domain?: string
}

interface PipedriveDeal {
  id?: number
  title: string
  value?: number
  currency?: string
  status?: 'open' | 'won' | 'lost'
  stage_id?: number
  person_id?: number
  org_id?: number
  expected_close_date?: string
  probability?: number
  user_id?: number
}

// Get Pipedrive config for user
async function getPipedriveConfig(userId: string): Promise<PipedriveConfig | null> {
  // In a real app, this would be stored securely in the database
  // For now, we'll use environment variables
  const apiToken = process.env.PIPEDRIVE_API_TOKEN
  const companyDomain = process.env.PIPEDRIVE_COMPANY_DOMAIN

  if (!apiToken) return null

  return {
    api_token: apiToken,
    company_domain: companyDomain
  }
}

// Make authenticated request to Pipedrive API
async function pipedriveRequest(endpoint: string, config: PipedriveConfig, options: RequestInit = {}) {
  const url = `${PIPEDRIVE_API_BASE}${endpoint}?api_token=${config.api_token}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    throw new Error(`Pipedrive API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Sync deal to Pipedrive
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dealId, syncDirection = 'to_pipedrive' } = body

    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })
    }

    // Get Pipedrive config
    const pipedriveConfig = await getPipedriveConfig(session.user.id)
    if (!pipedriveConfig) {
      return NextResponse.json({
        error: 'Pipedrive not configured',
        message: 'Please set PIPEDRIVE_API_TOKEN in environment variables'
      }, { status: 400 })
    }

    // Get deal from our database
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select(`
        *,
        deal_stages (*),
        assigned_user:assigned_to (email)
      `)
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Check permissions
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const isAdminOrManager = teamMember && ['admin', 'manager'].includes(teamMember.role)

    if (!isAdminOrManager && deal.assigned_to !== session.user.id && deal.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let result

    if (syncDirection === 'to_pipedrive') {
      // Sync from our platform to Pipedrive
      result = await syncDealToPipedrive(deal, pipedriveConfig)
    } else {
      // Sync from Pipedrive to our platform
      result = await syncDealFromPipedrive(dealId, pipedriveConfig)
    }

    // Log the sync activity
    await supabaseAdmin.from('deal_activities').insert({
      deal_id: dealId,
      user_id: session.user.id,
      activity_type: 'crm_sync',
      description: `Deal synced ${syncDirection === 'to_pipedrive' ? 'to' : 'from'} Pipedrive`,
      metadata: {
        sync_direction: syncDirection,
        pipedrive_result: result
      }
    })

    return NextResponse.json({
      success: true,
      sync_direction: syncDirection,
      result
    })

  } catch (error) {
    console.error('Pipedrive sync error:', error)
    return NextResponse.json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Sync deal from our platform to Pipedrive
async function syncDealToPipedrive(deal: any, config: PipedriveConfig) {
  try {
    // First, create or find person in Pipedrive
    let personId = null
    if (deal.contact_email) {
      // Check if person exists
      const searchResult = await pipedriveRequest('/persons/search', config, {
        method: 'GET'
      })

      const existingPerson = searchResult.data?.items?.find(
        (item: any) => item.item.email?.[0]?.value === deal.contact_email
      )

      if (existingPerson) {
        personId = existingPerson.item.id
      } else {
        // Create new person
        const personData = {
          name: deal.contact_name || deal.contact_email,
          email: deal.contact_email,
          phone: deal.contact_phone ? [deal.contact_phone] : undefined
        }

        const personResult = await pipedriveRequest('/persons', config, {
          method: 'POST',
          body: JSON.stringify(personData)
        })
        personId = personResult.data.id
      }
    }

    // Create or find organization
    let orgId = null
    if (deal.company_name) {
      // Search for existing organization
      const searchResult = await pipedriveRequest('/organizations/search', config, {
        method: 'GET'
      })

      const existingOrg = searchResult.data?.items?.find(
        (item: any) => item.item.name === deal.company_name
      )

      if (existingOrg) {
        orgId = existingOrg.item.id
      } else {
        // Create new organization
        const orgData = {
          name: deal.company_name,
          address: deal.company_website
        }

        const orgResult = await pipedriveRequest('/organizations', config, {
          method: 'POST',
          body: JSON.stringify(orgData)
        })
        orgId = orgResult.data.id
      }
    }

    // Get Pipedrive pipeline stages
    const pipelineResult = await pipedriveRequest('/stages', config)
    const stages = pipelineResult.data || []

    // Map our stage to Pipedrive stage
    const mappedStage = stages.find((stage: any) =>
      stage.name.toLowerCase().includes(deal.deal_stages?.name?.toLowerCase() || 'lead')
    )
    const stageId = mappedStage?.id || stages[0]?.id

    // Prepare deal data for Pipedrive
    const dealData: PipedriveDeal = {
      title: deal.title,
      value: deal.deal_value || 0,
      currency: deal.currency || 'EUR',
      status: deal.status === 'won' ? 'won' : deal.status === 'lost' ? 'lost' : 'open',
      stage_id: stageId,
      person_id: personId,
      org_id: orgId,
      expected_close_date: deal.expected_close_date,
      probability: deal.deal_stages?.probability || 0
    }

    // Check if deal already exists in Pipedrive (by title or custom field)
    const searchResult = await pipedriveRequest('/deals/search', config, {
      method: 'GET'
    })

    const existingDeal = searchResult.data?.items?.find(
      (item: any) => item.item.title === deal.title
    )

    let pipedriveDeal
    if (existingDeal) {
      // Update existing deal
      pipedriveDeal = await pipedriveRequest(`/deals/${existingDeal.item.id}`, config, {
        method: 'PUT',
        body: JSON.stringify(dealData)
      })
    } else {
      // Create new deal
      pipedriveDeal = await pipedriveRequest('/deals', config, {
        method: 'POST',
        body: JSON.stringify(dealData)
      })
    }

    // Store Pipedrive ID in our database
    await supabaseAdmin
      .from('deals')
      .update({
        custom_fields: {
          ...deal.custom_fields,
          pipedrive_id: pipedriveDeal.data.id
        }
      })
      .eq('id', deal.id)

    return {
      pipedrive_deal_id: pipedriveDeal.data.id,
      action: existingDeal ? 'updated' : 'created',
      deal_url: `https://app.pipedrive.com/deal/${pipedriveDeal.data.id}`
    }

  } catch (error) {
    console.error('Sync to Pipedrive error:', error)
    throw error
  }
}

// Sync deal from Pipedrive to our platform
async function syncDealFromPipedrive(dealId: string, config: PipedriveConfig) {
  try {
    // Get deal from Pipedrive
    const pipedriveDeal = await pipedriveRequest(`/deals/${dealId}`, config)

    if (!pipedriveDeal.data) {
      throw new Error('Deal not found in Pipedrive')
    }

    const pd = pipedriveDeal.data

    // Get person details if available
    let personData = null
    if (pd.person_id) {
      personData = await pipedriveRequest(`/persons/${pd.person_id}`, config)
    }

    // Get organization details if available
    let orgData = null
    if (pd.org_id) {
      orgData = await pipedriveRequest(`/organizations/${pd.org_id}`, config)
    }

    // Get stage details
    let stageData = null
    if (pd.stage_id) {
      stageData = await pipedriveRequest(`/stages/${pd.stage_id}`, config)
    }

    // Map Pipedrive data to our format
    const ourDealData = {
      title: pd.title,
      deal_value: pd.value || 0,
      currency: pd.currency || 'EUR',
      contact_name: personData?.data?.name,
      contact_email: personData?.data?.primary_email,
      contact_phone: personData?.data?.phone?.[0]?.value,
      company_name: orgData?.data?.name,
      company_website: orgData?.data?.website,
      expected_close_date: pd.expected_close_date,
      status: pd.status === 'won' ? 'won' : pd.status === 'lost' ? 'lost' : 'active',
      custom_fields: {
        pipedrive_id: pd.id,
        pipedrive_url: `https://app.pipedrive.com/deal/${pd.id}`
      }
    }

    return {
      pipedrive_deal: pd,
      mapped_data: ourDealData,
      message: 'Data retrieved from Pipedrive. Update your deal with this information.'
    }

  } catch (error) {
    console.error('Sync from Pipedrive error:', error)
    throw error
  }
}

// Get sync status and available actions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')

    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })
    }

    // Check Pipedrive configuration
    const pipedriveConfig = await getPipedriveConfig(session.user.id)

    // Get deal sync status
    const { data: deal } = await supabaseAdmin
      .from('deals')
      .select('custom_fields')
      .eq('id', dealId)
      .single()

    const pipedriveId = deal?.custom_fields?.pipedrive_id

    return NextResponse.json({
      configured: !!pipedriveConfig,
      deal_synced: !!pipedriveId,
      pipedrive_id: pipedriveId,
      pipedrive_url: pipedriveId ? `https://app.pipedrive.com/deal/${pipedriveId}` : null
    })

  } catch (error) {
    console.error('Pipedrive status error:', error)
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 })
  }
}
