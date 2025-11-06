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

    const body = await request.json()
    const { sequenceId, leadIds, startImmediately = true } = body

    if (!sequenceId || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'sequenceId und leadIds sind erforderlich' },
        { status: 400 }
      )
    }

    // Load sequence to validate ownership and get steps
    const { data: sequence, error: seqError } = await supabaseAdmin
      .from('email_sequences')
      .select('id, user_id, steps')
      .eq('id', sequenceId)
      .eq('user_id', session.user.id)
      .single()

    if (seqError || !sequence) {
      return NextResponse.json({ error: 'Sequence nicht gefunden' }, { status: 404 })
    }

    const steps = Array.isArray(sequence.steps) ? sequence.steps : []
    const firstDelayDays = steps[0]?.delayDays ?? 0

    const now = new Date()
    const nextSendAt = new Date(now)
    if (!startImmediately && firstDelayDays > 0) {
      nextSendAt.setDate(now.getDate() + firstDelayDays)
    }

    const enrollments = leadIds.map((leadId: string) => ({
      user_id: session.user.id,
      sequence_id: sequenceId,
      lead_id: leadId,
      current_step: 0,
      status: 'active',
      next_send_at: startImmediately || firstDelayDays === 0 ? now.toISOString() : nextSendAt.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }))

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('sequence_enrollments')
      .insert(enrollments)
      .select('id, lead_id, next_send_at')

    if (insertError) {
      return NextResponse.json(
        { error: 'Fehler beim Enrollen', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, count: inserted?.length || 0, enrollments: inserted })
  } catch (error) {
    console.error('Enroll sequence error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}