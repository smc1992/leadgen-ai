import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceGuards } from '@/lib/security'
import { executeWorkflowSteps } from '@/lib/workflows'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `workflow-trigger:${ip}`, 20, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trigger_type, context } = body
    if (!trigger_type) {
      return NextResponse.json({ error: 'trigger_type required' }, { status: 400 })
    }

    const { data: workflows } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', trigger_type)
      .eq('user_id', session.user.id)

    const executed: string[] = []
    for (const wf of workflows || []) {
      await executeWorkflowSteps(wf, context)
      executed.push(wf.id)
      await supabaseAdmin
        .from('workflow_executions')
        .insert({
          workflow_id: wf.id,
          trigger_entity_id: context?.deal_id || context?.lead?.id || null,
          trigger_entity_type: context?.deal_id ? 'deal' : (context?.lead ? 'lead' : null),
          status: 'completed',
          current_step: 0,
          execution_data: { trigger_type, context },
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
    }

    return NextResponse.json({ success: true, executedCount: executed.length, executed })

  } catch (error) {
    return NextResponse.json({ error: 'Trigger failed' }, { status: 500 })
  }
}

