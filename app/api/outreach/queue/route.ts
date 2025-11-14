import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceGuards } from '@/lib/security'
import { sendEmail, addTrackingToLinks } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `outreach-queue:${ip}`, 10, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '25')))

    // Optional: Only admins/managers can send for the whole org; otherwise only own user queue
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()
    const isAdminOrManager = teamMember && ['admin', 'manager'].includes(teamMember.role)

    const { data: queued } = await supabaseAdmin
      .from('outreach_emails')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .range(0, limit - 1)
    const batch = (queued || []).filter(e => isAdminOrManager || e.user_id === session.user.id)

    const results: any[] = []
    let sent = 0
    let failed = 0

    for (const item of batch) {
      try {
        const htmlWithTracking = addTrackingToLinks(item.content, item.campaign_id, item.lead_id)
        const result = await sendEmail({
          to: item.lead_email,
          subject: item.subject,
          html: htmlWithTracking,
          from: process.env.EMAIL_FROM,
        }, {
          campaignId: item.campaign_id,
          leadId: item.lead_id,
          templateId: item.template_id,
          userId: item.user_id,
        })

        if (result.success) {
          sent++
          await supabaseAdmin
            .from('outreach_emails')
            .update({ status: 'sent', sent_at: new Date().toISOString(), resend_api_id: result.messageId })
            .eq('id', item.id)
          results.push({ id: item.id, status: 'sent', messageId: result.messageId })
        } else {
          failed++
          await supabaseAdmin
            .from('outreach_emails')
            .update({ status: 'bounced', bounce_reason: result.error || 'unknown' })
            .eq('id', item.id)
          results.push({ id: item.id, status: 'failed', error: result.error })
        }
      } catch (e: any) {
        failed++
        await supabaseAdmin
          .from('outreach_emails')
          .update({ status: 'bounced', bounce_reason: e?.message || 'unknown' })
          .eq('id', item.id)
        results.push({ id: item.id, status: 'failed', error: e?.message })
      }
    }

    return NextResponse.json({ success: true, processed: batch.length, sent, failed, results })

  } catch (error) {
    return NextResponse.json({ error: 'Queue processing failed' }, { status: 500 })
  }
}

