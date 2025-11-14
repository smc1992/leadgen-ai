import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { classifyReply } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { campaignId, leadId, leadEmail, message } = body
    if (!campaignId || !message || (!leadId && !leadEmail)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const cls = await classifyReply(String(message))

    if (cls.status === 'unsubscribe' && leadEmail) {
      await supabaseAdmin
        .from('email_unsubscribes')
        .insert({ user_id: session.user.id, lead_id: leadId || null, lead_email: leadEmail, campaign_id: campaignId || null, reason: 'reply' })
    }

    const update = await supabaseAdmin
      .from('outreach_emails')
      .update({ status: cls.status === 'replied' ? 'replied' : cls.status === 'bounced' ? 'bounced' : 'sent' })
      .eq('campaign_id', campaignId)
      .eq(leadId ? 'lead_id' : 'lead_email', leadId ? leadId : leadEmail)

    return NextResponse.json({ success: true, classification: cls })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

