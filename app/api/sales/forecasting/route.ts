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

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get user's team role
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const isAdminOrManager = teamMember && ['admin', 'manager'].includes(teamMember.role)

    let forecastsQuery = supabaseAdmin
      .from('sales_forecasts')
      .select('*')

    if (!isAdminOrManager) {
      forecastsQuery = forecastsQuery.eq('user_id', session.user.id)
    }

    const { data: forecasts, error } = await forecastsQuery
      .eq('period', period)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)
      .order('period_start')

    if (error) throw error

    // Calculate pipeline metrics
    const pipelineMetrics = await calculatePipelineMetrics(session.user.id, isAdminOrManager)

    return NextResponse.json({
      forecasts: forecasts || [],
      pipeline_metrics: pipelineMetrics,
      period,
      year
    })
  } catch (error) {
    console.error('Forecasting GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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

    const body = await request.json()
    const { period, period_start, period_end, forecast_amount, confidence_percentage, notes } = body

    if (!period || !period_start || !period_end || forecast_amount === undefined) {
      return NextResponse.json({ error: 'Period, dates, and forecast amount are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sales_forecasts')
      .insert({
        user_id: session.user.id,
        period,
        period_start,
        period_end,
        forecast_amount,
        confidence_percentage: confidence_percentage || 0,
        notes
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ forecast: data }, { status: 201 })
  } catch (error) {
    console.error('Forecasting POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { id, forecast_amount, actual_amount, confidence_percentage, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Forecast ID is required' }, { status: 400 })
    }

    // Check permissions
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const isAdminOrManager = teamMember && ['admin', 'manager'].includes(teamMember.role)

    let query = supabaseAdmin
      .from('sales_forecasts')
      .update({
        forecast_amount,
        actual_amount,
        confidence_percentage,
        notes
      })
      .eq('id', id)

    if (!isAdminOrManager) {
      query = query.eq('user_id', session.user.id)
    }

    const { data, error } = await query.select().single()

    if (error) throw error

    return NextResponse.json({ forecast: data })
  } catch (error) {
    console.error('Forecasting PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function calculatePipelineMetrics(userId: string, isAdminOrManager: boolean) {
  let dealsQuery = supabaseAdmin
    .from('deals')
    .select(`
      deal_value,
      deal_stages!inner(probability),
      expected_close_date,
      status
    `)

  if (!isAdminOrManager) {
    dealsQuery = dealsQuery.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
  }

  const { data: deals } = await dealsQuery

  if (!deals) return { total_pipeline: 0, weighted_pipeline: 0, forecast_accuracy: 0 }

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Calculate metrics
  let totalPipeline = 0
  let weightedPipeline = 0
  let upcomingDeals = 0

  for (const deal of deals) {
    if (deal.status === 'active' && deal.deal_value) {
      totalPipeline += deal.deal_value

      // Weighted pipeline (deal value * win probability)
      const probability = deal.deal_stages?.probability || 0
      weightedPipeline += (deal.deal_value * probability) / 100

      // Count upcoming deals (closing within 30 days)
      if (deal.expected_close_date && new Date(deal.expected_close_date) <= thirtyDaysFromNow) {
        upcomingDeals++
      }
    }
  }

  return {
    total_pipeline: totalPipeline,
    weighted_pipeline: weightedPipeline,
    upcoming_deals_count: upcomingDeals,
    average_deal_size: deals.length > 0 ? totalPipeline / deals.length : 0
  }
}
