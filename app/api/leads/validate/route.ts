import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { validateEmails } from '@/lib/apify'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const leadIds: string[] = Array.isArray(body?.leadIds) ? body.leadIds : []
    if (leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds required' }, { status: 400 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }

    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('id,email')
      .in('id', leadIds)

    const emails = (leads || []).map(l => l.email).filter(Boolean) as string[]
    if (emails.length === 0) {
      return NextResponse.json({ validated: 0, updates: [] })
    }

    const run = await validateEmails(emails)
    const datasetId = run?.defaultDatasetId || run?.data?.defaultDatasetId
    let results: any[] = []
    if (datasetId) {
      const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}`)
      results = (await res.json()) || []
    }

    const statusByEmail: Record<string, 'valid'|'invalid'|'unknown'> = {}
    for (const r of results) {
      const e = (r.email || r.address || '').toLowerCase()
      const ok = Boolean(r.isValid ?? r.valid ?? r.status === 'valid')
      statusByEmail[e] = ok ? 'valid' : 'invalid'
    }

    const updates: any[] = []
    for (const l of leads || []) {
      const e = (l.email || '').toLowerCase()
      const s = statusByEmail[e] || 'unknown'
      updates.push({ id: l.id, email_status: s })
    }

    if (updates.length > 0) {
      for (const u of updates) {
        await supabaseAdmin
          .from('leads')
          .update({ email_status: u.email_status })
          .eq('id', u.id)
      }
    }

    return NextResponse.json({ validated: updates.length, updates })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

