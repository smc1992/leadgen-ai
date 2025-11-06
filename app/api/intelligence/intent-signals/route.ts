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
    const lead_id = searchParams.get('lead_id')

    if (lead_id) {
      // Get intent signals for specific lead
      const { data: signals, error } = await supabaseAdmin
        .from('intent_signals')
        .select(`
          *,
          intent_data_providers (
            provider_name,
            is_active
          )
        `)
        .eq('lead_id', lead_id)
        .order('detected_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ signals: signals || [] })
    } else {
      // Get all intent signals for user
      const { data: signals, error } = await supabaseAdmin
        .from('intent_signals')
        .select(`
          *,
          leads (
            full_name,
            email,
            company
          ),
          intent_data_providers (
            provider_name
          )
        `)
        .eq('user_id', session.user.id)
        .order('detected_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return NextResponse.json({ signals: signals || [] })
    }
  } catch (error) {
    console.error('Intent signals GET error:', error)
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
    const { lead_id, provider_name, signal_type, signal_data, signal_strength } = body

    if (!lead_id || !provider_name || !signal_type) {
      return NextResponse.json({
        error: 'Lead ID, provider name, and signal type are required'
      }, { status: 400 })
    }

    // Get or create intent data provider
    let { data: provider } = await supabaseAdmin
      .from('intent_data_providers')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('provider_name', provider_name)
      .single()

    if (!provider) {
      const { data: newProvider, error: providerError } = await supabaseAdmin
        .from('intent_data_providers')
        .insert({
          user_id: session.user.id,
          provider_name: provider_name as any
        })
        .select('id')
        .single()

      if (providerError) throw providerError
      provider = newProvider
    }

    // Create intent signal
    const { data, error } = await supabaseAdmin
      .from('intent_signals')
      .insert({
        lead_id,
        provider_id: provider.id,
        signal_type,
        signal_data: signal_data || {},
        signal_strength: signal_strength || 0.5,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single()

    if (error) throw error

    // Update lead score if this is a strong signal
    if (signal_strength && signal_strength > 0.7) {
      await updateLeadScoreForIntent(lead_id, signal_strength)
    }

    return NextResponse.json({ signal: data }, { status: 201 })
  } catch (error) {
    console.error('Intent signals POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateLeadScoreForIntent(leadId: string, signalStrength: number) {
  try {
    // Get current lead score
    const { data: currentScore } = await supabaseAdmin
      .from('lead_scores')
      .select('total_score, score_breakdown')
      .eq('lead_id', leadId)
      .single()

    if (currentScore) {
      const intentBonus = Math.round(signalStrength * 20) // Up to 20 points for strong intent
      const newScore = currentScore.total_score + intentBonus

      await supabaseAdmin
        .from('lead_scores')
        .update({
          total_score: Math.min(newScore, 100), // Cap at 100
          score_breakdown: {
            ...currentScore.score_breakdown,
            intent_signals: intentBonus
          },
          last_scored_at: new Date().toISOString()
        })
        .eq('lead_id', leadId)
    }
  } catch (error) {
    console.error('Error updating lead score for intent:', error)
  }
}
