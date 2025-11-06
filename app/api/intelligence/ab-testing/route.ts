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

    const { searchParams } = new URL(request.url)
    const campaign_id = searchParams.get('campaign_id')

    if (campaign_id) {
      // Get results for specific campaign
      const { data: results, error } = await supabaseAdmin
        .from('ab_test_results')
        .select('*')
        .eq('test_id', campaign_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ results: results || [] })
    } else {
      // Get all A/B test campaigns
      const { data: campaigns, error } = await supabaseAdmin
        .from('ab_test_campaigns')
        .select(`
          *,
          ab_test_results (*)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ campaigns: campaigns || [] })
    }
  } catch (error) {
    console.error('A/B testing GET error:', error)
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
    const {
      name,
      description,
      campaign_type,
      original_template_id,
      test_variants,
      sample_size,
      confidence_level,
      test_metric
    } = body

    if (!name || !campaign_type || !test_variants || test_variants.length < 2) {
      return NextResponse.json({
        error: 'Name, campaign type, and at least 2 test variants are required'
      }, { status: 400 })
    }

    // Create A/B test campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('ab_test_campaigns')
      .insert({
        user_id: session.user.id,
        name,
        description,
        campaign_type,
        original_template_id,
        test_variants,
        sample_size: sample_size || 1000,
        confidence_level: confidence_level || 0.95,
        test_metric: test_metric || 'open_rate'
      })
      .select()
      .single()

    if (campaignError) throw campaignError

    // Initialize test results for each variant
    const resultsData = test_variants.map((variant: any) => ({
      test_id: campaign.id,
      variant_id: variant.id,
      variant_name: variant.name,
      sample_size: 0
    }))

    const { error: resultsError } = await supabaseAdmin
      .from('ab_test_results')
      .insert(resultsData)

    if (resultsError) throw resultsError

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('A/B testing POST error:', error)
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
    const { id, status, winner_variant_id, start_date, end_date } = body

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const updateData: any = { status }
    if (winner_variant_id) updateData.winner_variant_id = winner_variant_id
    if (start_date) updateData.start_date = start_date
    if (end_date) updateData.end_date = end_date

    const { data, error } = await supabaseAdmin
      .from('ab_test_campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    // If test is completed and we have a winner, mark winner in results
    if (status === 'completed' && winner_variant_id) {
      await supabaseAdmin
        .from('ab_test_results')
        .update({ is_winner: false })
        .eq('test_id', id)

      await supabaseAdmin
        .from('ab_test_results')
        .update({ is_winner: true })
        .eq('test_id', id)
        .eq('variant_id', winner_variant_id)
    }

    return NextResponse.json({ campaign: data })
  } catch (error) {
    console.error('A/B testing PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update test results with actual performance data
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { test_id, variant_id, opens, clicks, replies, conversions } = body

    if (!test_id || !variant_id) {
      return NextResponse.json({ error: 'Test ID and variant ID are required' }, { status: 400 })
    }

    // Verify test belongs to user
    const { data: test } = await supabaseAdmin
      .from('ab_test_campaigns')
      .select('id')
      .eq('id', test_id)
      .eq('user_id', session.user.id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Update test results
    const { data, error } = await supabaseAdmin
      .from('ab_test_results')
      .update({
        opens: opens || 0,
        clicks: clicks || 0,
        replies: replies || 0,
        conversions: conversions || 0,
        open_rate: opens ? ((opens / (opens + clicks + replies + conversions)) * 100) : 0,
        click_rate: clicks ? ((clicks / opens) * 100) : 0,
        reply_rate: replies ? ((replies / opens) * 100) : 0,
        conversion_rate: conversions ? ((conversions / opens) * 100) : 0
      })
      .eq('test_id', test_id)
      .eq('variant_id', variant_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ result: data })
  } catch (error) {
    console.error('A/B testing PATCH error:', error)
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
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('ab_test_campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('A/B testing DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
