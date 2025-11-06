import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Check if forecasts already exist
    const { data: existingForecasts, error: checkError } = await supabaseAdmin
      .from('sales_forecasts')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1)

    if (checkError) {
      console.error('Error checking forecasts:', checkError)
    }

    // If forecasts already exist, don't create duplicates
    if (existingForecasts && existingForecasts.length > 0) {
      return NextResponse.json({
        message: 'Forecasts already exist',
        forecasts: existingForecasts
      })
    }

    // Create default forecasts for the current year
    const currentYear = new Date().getFullYear()
    const defaultForecasts = []

    // Monthly forecasts for the current year
    for (let month = 0; month < 12; month++) {
      const periodStart = new Date(currentYear, month, 1)
      const periodEnd = new Date(currentYear, month + 1, 0)

      defaultForecasts.push({
        user_id: session.user.id,
        period: 'monthly',
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        forecast_amount: Math.floor(Math.random() * 50000) + 25000, // Random between $25k-$75k
        confidence_percentage: Math.floor(Math.random() * 30) + 70, // 70-100% confidence
        actual_amount: 0
      })
    }

    // Quarterly forecasts
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    quarters.forEach((quarter, index) => {
      const startMonth = index * 3
      const periodStart = new Date(currentYear, startMonth, 1)
      const periodEnd = new Date(currentYear, startMonth + 3, 0)

      defaultForecasts.push({
        user_id: session.user.id,
        period: 'quarterly',
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        forecast_amount: Math.floor(Math.random() * 150000) + 75000, // Random between $75k-$225k
        confidence_percentage: Math.floor(Math.random() * 20) + 75, // 75-95% confidence
        actual_amount: 0
      })
    })

    // Yearly forecast
    defaultForecasts.push({
      user_id: session.user.id,
      period: 'yearly',
      period_start: `${currentYear}-01-01`,
      period_end: `${currentYear}-12-31`,
      forecast_amount: Math.floor(Math.random() * 500000) + 500000, // Random between $500k-$1M
      confidence_percentage: Math.floor(Math.random() * 15) + 80, // 80-95% confidence
      actual_amount: 0
    })

    const { data: forecasts, error } = await supabaseAdmin
      .from('sales_forecasts')
      .insert(defaultForecasts)
      .select()

    if (error) throw error

    return NextResponse.json({
      message: 'Default forecasts created successfully',
      forecasts
    })

  } catch (error) {
    console.error('Setup forecasts error:', error)
    return NextResponse.json({ error: 'Failed to setup forecasts' }, { status: 500 })
  }
}
