import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Pipedrive API Base URL
const PIPEDRIVE_API_BASE = 'https://api.pipedrive.com/v1'

// Get Pipedrive configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!teamMember || teamMember.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get Pipedrive config (from environment variables for now)
    const config = {
      api_token: process.env.PIPEDRIVE_API_TOKEN ? 'configured' : null,
      company_domain: process.env.PIPEDRIVE_COMPANY_DOMAIN || null,
      webhooks_enabled: process.env.PIPEDRIVE_WEBHOOK_SECRET ? true : false
    }

    // Test connection if configured
    let connection_status = 'not_configured'
    if (config.api_token) {
      try {
        const testResponse = await fetch(`${PIPEDRIVE_API_BASE}/users/me?api_token=${process.env.PIPEDRIVE_API_TOKEN}`)
        if (testResponse.ok) {
          connection_status = 'connected'
        } else {
          connection_status = 'error'
        }
      } catch (error) {
        connection_status = 'error'
      }
    }

    return NextResponse.json({
      config,
      connection_status,
      setup_instructions: {
        api_token: 'Get from Pipedrive Settings > Personal Preferences > API',
        webhooks: 'Configure webhook URL in Pipedrive for real-time sync'
      }
    })

  } catch (error) {
    console.error('Pipedrive config error:', error)
    return NextResponse.json({ error: 'Configuration check failed' }, { status: 500 })
  }
}

// Update Pipedrive configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!teamMember || teamMember.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { api_token, company_domain, setup_webhooks } = body

    if (!api_token) {
      return NextResponse.json({ error: 'API token is required' }, { status: 400 })
    }

    // Test the API token
    try {
      const testResponse = await fetch(`${PIPEDRIVE_API_BASE}/users/me?api_token=${api_token}`)
      if (!testResponse.ok) {
        return NextResponse.json({
          error: 'Invalid API token',
          message: 'Please check your Pipedrive API token'
        }, { status: 400 })
      }

      const userData = await testResponse.json()

      return NextResponse.json({
        success: true,
        message: 'Pipedrive connected successfully',
        user: userData.data,
        instructions: setup_webhooks ? {
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/pipedrive/webhook`,
          events: ['deal.updated', 'deal.added', 'deal.deleted'],
          setup_guide: 'Configure this webhook URL in Pipedrive Settings > Webhooks'
        } : null
      })

    } catch (error) {
      return NextResponse.json({
        error: 'Connection failed',
        message: 'Unable to connect to Pipedrive API'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Pipedrive setup error:', error)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}
