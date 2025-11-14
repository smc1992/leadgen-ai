import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email: string | undefined = body?.email
    const campaignId: string | undefined = body?.campaignId
    const leadId: string | undefined = body?.leadId
    const reason: string | undefined = body?.reason

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }

    let userId: string | null = null
    if (campaignId) {
      const { data: campaign } = await supabaseAdmin
        .from('email_campaigns')
        .select('user_id')
        .eq('id', campaignId)
        .single()
      userId = campaign?.user_id || null
    }

    const payload: any = {
      lead_email: email,
      campaign_id: campaignId || null,
      reason: reason || 'link'
    }
    if (leadId) payload.lead_id = leadId
    if (userId) payload.user_id = userId

    const { error } = await supabaseAdmin
      .from('email_unsubscribes')
      .insert(payload)

    if (error) {
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

