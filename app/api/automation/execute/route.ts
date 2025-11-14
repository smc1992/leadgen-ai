import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceGuards } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `workflow-execute:${ip}`, 10, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const isAdminOrManager = teamMember && ['admin', 'manager'].includes(teamMember.role)
    if (!isAdminOrManager) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { data: workflows } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'time_based')

    const executed: string[] = []
    for (const wf of workflows || []) {
      const delayDays = Number((wf.trigger_config || {}).delay_days) || 7
      const since = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000).toISOString()
      const { data: recent } = await supabaseAdmin
        .from('workflow_executions')
        .select('id, started_at')
        .eq('workflow_id', wf.id)
        .gte('started_at', since)
        .limit(1)
      if (recent && recent.length > 0) continue
      await supabaseAdmin
        .from('workflow_executions')
        .insert({
          workflow_id: wf.id,
          trigger_entity_id: null,
          trigger_entity_type: null,
          status: 'completed',
          current_step: 0,
          execution_data: {},
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
      executed.push(wf.id)
    }

    return NextResponse.json({ success: true, executedCount: executed.length, executed })

  } catch (error) {
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 })
  }
}

