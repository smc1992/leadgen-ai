import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { config } from '@/lib/config'
import { sendEmail, addTrackingToLinks } from '@/lib/email'
const APIFY_API_URL = 'https://api.apify.com/v2'
const APIFY_TOKEN = process.env.APIFY_TOKEN

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-cron-secret') || ''
    if (!config.cronSecret || secret !== config.cronSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')))

    const { data: timeWorkflows } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'time_based')

    const executed: string[] = []
    for (const wf of timeWorkflows || []) {
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

    const { data: queued } = await supabaseAdmin
      .from('outreach_emails')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .range(0, limit - 1)

    let sent = 0
    let failed = 0
    for (const item of queued || []) {
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
        } else {
          failed++
          await supabaseAdmin
            .from('outreach_emails')
            .update({ status: 'bounced', bounce_reason: result.error || 'unknown' })
            .eq('id', item.id)
        }
      } catch (e: any) {
        failed++
        await supabaseAdmin
          .from('outreach_emails')
          .update({ status: 'bounced', bounce_reason: e?.message || 'unknown' })
          .eq('id', item.id)
      }
    }

    // Simple scrape scheduler execution
    if (APIFY_TOKEN) {
      const { data: scrapeSchedules } = await supabaseAdmin
        .from('schedules')
        .select('*')
        .eq('type', 'scrape')
        .eq('active', true)
      for (const sch of scrapeSchedules || []) {
        const intervalMinutes = Number(sch.interval_minutes) || 60
        const lastRun = sch.last_run_at ? new Date(sch.last_run_at).getTime() : 0
        const due = Date.now() - lastRun > intervalMinutes * 60_000
        const meta = sch.metadata || {}
        if (!due) continue
        try {
          const { type, params } = meta
          let actorId = ''
          let input: any = {}
          if (type === 'maps') {
            actorId = (process.env.APIFY_ACTOR_ID_GMAPS || 'compass/crawler-google-places').replace('/', '~')
            input = {
              searchStringsArray: [params?.searchQuery],
              locationQuery: params?.location,
              maxCrawledPlacesPerSearch: params?.limit || 100,
              ...(params?.withWebsiteOnly ? { websiteEnum: 'withWebsite' } : {}),
              proxyConfiguration: { useApifyProxy: true }
            }
          } else if (type === 'linkedin') {
            const cookie = process.env.APIFY_LINKEDIN_COOKIE
            if (params?.searchUrl) {
              actorId = (process.env.APIFY_ACTOR_ID_LINKEDIN_SEARCH || 'curious_coder/linkedin-people-search-scraper').replace('/', '~')
              input = { searchUrl: params.searchUrl, startPage: params.startPage || 1, endPage: params.endPage || 1, ...(cookie ? { linkedinCookies: cookie } : {}), proxyConfiguration: { useApifyProxy: true } }
            } else {
              actorId = (process.env.APIFY_ACTOR_ID_LINKEDIN || 'apimaestro/linkedin-profile-batch-scraper-no-cookies-required').replace('/', '~')
              input = { profileUrls: [params?.profileUrl], ...(cookie ? { linkedinCookies: cookie } : {}), proxyConfiguration: { useApifyProxy: true } }
            }
          } else if (type === 'validator') {
            actorId = (process.env.APIFY_ACTOR_ID_VALIDATOR || 'anchor/email-check-verify-validate').replace('/', '~')
            input = { emails: params?.emails || [], proxyConfiguration: { useApifyProxy: true } }
          } else {
            continue
          }
          const res = await fetch(`${APIFY_API_URL}/acts/${actorId}/runs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${APIFY_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
          })
          if (res.ok) {
            const data = await res.json()
            await supabaseAdmin
              .from('scrape_runs')
              .insert({ id: data.data.id, type, status: data.data.status.toLowerCase(), result_count: 0, triggered_by: sch.user_id, created_at: new Date().toISOString() })
            await supabaseAdmin
              .from('schedules')
              .update({ last_run_at: new Date().toISOString() })
              .eq('id', sch.id)
          } else {
            const txt = await res.text().catch(()=> '')
            await supabaseAdmin
              .from('scrape_runs')
              .insert({ id: `err_${Date.now()}`, type, status: 'failed', result_count: 0, triggered_by: sch.user_id, created_at: new Date().toISOString(), error_message: txt?.slice(0,500) || 'run failed' })
          }
        } catch (e: any) {
          await supabaseAdmin
            .from('scrape_runs')
            .insert({ id: `err_${Date.now()}`, type: (sch.metadata||{}).type || 'unknown', status: 'failed', result_count: 0, triggered_by: sch.user_id, created_at: new Date().toISOString(), error_message: e?.message || 'unknown' })
        }
      }
    }

    return NextResponse.json({ success: true, workflowsExecuted: executed.length, sent, failed })

  } catch (error) {
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
