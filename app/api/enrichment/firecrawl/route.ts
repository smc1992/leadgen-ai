import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { firecrawlScrape } from '@/lib/firecrawl'
import { validateEmails } from '@/lib/apify'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const leadIds: string[] = Array.isArray(body?.leadIds) ? body.leadIds : []
    const directUrl: string | undefined = body?.url
    const formats = body?.formats || ['markdown','links','branding']

    const items: Array<{ lead_id?: string; url: string }> = []
    if (directUrl) items.push({ url: directUrl })
    if (leadIds.length > 0) {
      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('id,website_url')
        .in('id', leadIds)
      for (const l of leads || []) {
        if (l.website_url) items.push({ lead_id: l.id, url: l.website_url })
      }
    }
    if (items.length === 0) return NextResponse.json({ enriched: 0, details: [] })

    const results: any[] = []
    for (const it of items) {
      try {
        const data = await firecrawlScrape(it.url, formats)
        await supabaseAdmin
          .from('lead_enrichments')
          .insert({
            user_id: session.user.id,
            lead_id: it.lead_id || null,
            url: it.url,
            markdown: data.markdown || null,
            summary: data.summary || null,
            branding: data.branding || null,
            links: data.links || null,
            raw: data || null
          })
        if (it.lead_id) {
          const linkArr = Array.isArray(data.links) ? data.links : []
          const mailto = linkArr.filter((l: any) => typeof l === 'string' && l.toLowerCase().startsWith('mailto:')).map((l: string) => l.replace(/^mailto:/i, ''))
          const text = [data.markdown || '', data.rawHtml || ''].join('\n')
          const emailMatches = Array.from(text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)).map(m => m[0].toLowerCase())
          const allEmails = Array.from(new Set([...(mailto || []), ...(emailMatches || [])]))
          const phoneMatches = Array.from(text.matchAll(/\+?[0-9][0-9\s().-]{6,}/g)).map(m => m[0])
          const phoneCandidate = phoneMatches.find(p => p.replace(/\D/g, '').length >= 7) || null
          const metaUrl = data.metadata?.sourceURL || it.url
          const u = new URL(metaUrl)
          const websiteCanonical = `${u.protocol}//${u.hostname}`
          const genericPrefixes = ['info@','kontakt@','contact@','support@','sales@']
          const pickEmail = () => {
            const nonGeneric = allEmails.find(e => !genericPrefixes.some(g => e.startsWith(g)))
            return nonGeneric || allEmails[0] || null
          }
          const newEmail = pickEmail()
          const updateFields: any = {}
          const { data: leadRow } = await supabaseAdmin.from('leads').select('email,phone,website_url').eq('id', it.lead_id).single()
          if (websiteCanonical && (!leadRow?.website_url || leadRow.website_url.length === 0)) updateFields.website_url = websiteCanonical
          if (phoneCandidate && (!leadRow?.phone || leadRow.phone.length === 0)) updateFields.phone = phoneCandidate
          if (newEmail) {
            const current = (leadRow?.email || '').toLowerCase()
            const currentGeneric = current && genericPrefixes.some(g => current.startsWith(g))
            const newGeneric = genericPrefixes.some(g => newEmail.startsWith(g))
            if (!current || (currentGeneric && !newGeneric)) updateFields.email = newEmail
          }
          if (Object.keys(updateFields).length > 0) {
            await supabaseAdmin.from('leads').update(updateFields).eq('id', it.lead_id)
          }
          const emailToValidate = (updateFields.email || leadRow?.email || '').toLowerCase()
          if (emailToValidate) {
            try {
              const run = await validateEmails([emailToValidate])
              const datasetId = run?.defaultDatasetId || run?.data?.defaultDatasetId
              if (datasetId) {
                const r = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}`)
                const arr = await r.json()
                const entry = Array.isArray(arr) ? arr.find((x: any) => (x.email || x.address || '').toLowerCase() === emailToValidate) : null
                const ok = entry ? Boolean(entry.isValid ?? entry.valid ?? entry.status === 'valid') : false
                await supabaseAdmin.from('leads').update({ email_status: ok ? 'valid' : 'invalid' }).eq('id', it.lead_id)
              }
            } catch {}
          }
        }
        results.push({ lead_id: it.lead_id, url: it.url, ok: true })
      } catch (e: any) {
        results.push({ lead_id: it.lead_id, url: it.url, ok: false, error: e?.message || 'error' })
      }
    }

    return NextResponse.json({ enriched: results.filter(r => r.ok).length, details: results })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

