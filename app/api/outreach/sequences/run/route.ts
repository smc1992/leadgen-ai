import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, replaceTemplateVariables } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nowIso = new Date().toISOString()

    // Find due enrollments for this user
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('sequence_enrollments')
      .select('id, lead_id, sequence_id, current_step')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .lte('next_send_at', nowIso)

    if (enrollError) {
      return NextResponse.json(
        { error: 'Fehler beim Laden der Enrollments', details: enrollError.message },
        { status: 500 }
      )
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, processed: 0, results: [] })
    }

    const results: any[] = []

    for (const enrollment of enrollments) {
      try {
        // Load sequence with steps
        const { data: sequence, error: seqError } = await supabaseAdmin
          .from('email_sequences')
          .select('id, steps, user_id')
          .eq('id', enrollment.sequence_id)
          .eq('user_id', session.user.id)
          .single()

        if (seqError || !sequence) {
          results.push({ enrollmentId: enrollment.id, status: 'skipped', reason: 'sequence_not_found' })
          continue
        }

        const steps = Array.isArray(sequence.steps) ? sequence.steps : []
        const step = steps[enrollment.current_step]
        if (!step) {
          // No more steps; complete enrollment
          await supabaseAdmin
            .from('sequence_enrollments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', enrollment.id)
          results.push({ enrollmentId: enrollment.id, status: 'completed' })
          continue
        }

        // Load lead
        const { data: lead, error: leadError } = await supabaseAdmin
          .from('leads')
          .select('*')
          .eq('id', enrollment.lead_id)
          .eq('user_id', session.user.id)
          .single()

        if (leadError || !lead) {
          results.push({ enrollmentId: enrollment.id, status: 'failed', error: 'lead_not_found' })
          continue
        }

        const variables = {
          firstName: lead.full_name?.split(' ')[0] || 'there',
          lastName: lead.full_name?.split(' ').slice(1).join(' ') || '',
          fullName: lead.full_name || 'there',
          company: lead.company || '',
          jobTitle: lead.job_title || '',
          email: lead.email || '',
        }

        const subject = replaceTemplateVariables(step.subject || 'Follow-up', variables)
        let html = replaceTemplateVariables(step.content || '', variables)
        html = html.replace(/\n/g, '<br>')

        // Send email (no campaign tracking here; sequences are tracked by sequence_id)
        const sendRes = await sendEmail({
          to: lead.email,
          subject,
          html,
          from: process.env.EMAIL_FROM,
        })

        if (!sendRes.success) {
          results.push({ enrollmentId: enrollment.id, status: 'failed', error: sendRes.error })
          continue
        }

        const sentAt = new Date()

        // Log email with sequence_id
        await supabaseAdmin.from('outreach_emails').insert({
          user_id: session.user.id,
          sequence_id: enrollment.sequence_id,
          lead_id: lead.id,
          lead_email: lead.email,
          lead_name: lead.full_name,
          subject,
          content: html,
          status: 'sent',
          sent_at: sentAt.toISOString(),
          resend_api_id: sendRes.messageId,
        })

        // Compute next step scheduling
        const nextIndex = enrollment.current_step + 1
        const nextStep = steps[nextIndex]
        let nextSendAt: string | null = null
        let newStatus = 'active'

        if (nextStep) {
          const nextDate = new Date(sentAt)
          const delayDays = nextStep.delayDays ?? 0
          nextDate.setDate(nextDate.getDate() + delayDays)
          nextSendAt = nextDate.toISOString()
        } else {
          newStatus = 'completed'
        }

        await supabaseAdmin
          .from('sequence_enrollments')
          .update({
            current_step: nextIndex,
            last_sent_at: sentAt.toISOString(),
            next_send_at: nextSendAt,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id)

        results.push({ enrollmentId: enrollment.id, status: 'sent', stepIndex: enrollment.current_step, nextStepIndex: nextIndex })
      } catch (err) {
        results.push({ enrollmentId: enrollment.id, status: 'failed', error: err instanceof Error ? err.message : 'unknown_error' })
      }
    }

    return NextResponse.json({ success: true, processed: enrollments.length, results })
  } catch (error) {
    console.error('Run sequence error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}