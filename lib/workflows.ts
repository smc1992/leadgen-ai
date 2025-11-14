import { supabaseAdmin } from '@/lib/supabase'

export async function executeWorkflowSteps(workflow: any, context: any) {
  const { data: steps } = await supabaseAdmin
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflow.id)
    .eq('is_active', true)
    .order('step_order', { ascending: true })

  for (const step of steps || []) {
    const type = (step.step_type || '').toLowerCase()
    const cfg = step.step_config || {}
    if (type === 'update_deal' && context?.deal_id) {
      await supabaseAdmin
        .from('deals')
        .update(cfg.update || {})
        .eq('id', context.deal_id)
      await logActivity(context.deal_id, 'workflow', `Deal updated via workflow`, { step_id: step.id, update: cfg.update })
    } else if (type === 'create_task' && context?.deal_id) {
      await logActivity(context.deal_id, 'task', cfg.description || 'Task created by workflow', { step_id: step.id })
    } else if (type === 'send_email' && context?.lead) {
      await supabaseAdmin
        .from('outreach_emails')
        .insert({
          user_id: workflow.user_id,
          campaign_id: cfg.campaign_id || null,
          lead_id: context.lead.id || null,
          lead_email: context.lead.email,
          lead_name: context.lead.full_name,
          template_id: cfg.template_id || null,
          subject: cfg.subject || 'Follow up',
          content: cfg.content || 'Hello {{firstName}}, ...',
          status: 'queued',
          created_at: new Date().toISOString(),
        })
    } else if (type === 'webhook' && cfg.url) {
      try { await fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workflow_id: workflow.id, context }) }) } catch {}
    } else if (type === 'wait') {
      // No-op in API execution; real scheduler would delay
    }
  }
}

async function logActivity(dealId: string, kind: string, description: string, metadata: any) {
  await supabaseAdmin
    .from('deal_activities')
    .insert({
      deal_id: dealId,
      user_id: null,
      activity_type: kind,
      description,
      metadata,
      created_at: new Date().toISOString(),
    })
}

