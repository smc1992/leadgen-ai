import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    let session: any = null
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError) {
      console.warn('Session decode error, returning 401:', sessionError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate user ID is a UUID to avoid Postgres 22P02 when filtering
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(String(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const region = searchParams.get('region')
    const status = searchParams.get('status')
    const scoreMin = searchParams.get('scoreMin')
    const scoreMax = searchParams.get('scoreMax')
    const outreachReady = searchParams.get('outreachReady')
    const listId = searchParams.get('listId')

    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (region) {
      query = query.eq('region', region)
    }

    if (status) {
      query = query.eq('email_status', status)
    }

    if (scoreMin) {
      query = query.gte('score', parseInt(scoreMin))
    }

    if (scoreMax) {
      query = query.lte('score', parseInt(scoreMax))
    }

    if (outreachReady !== null) {
      query = query.eq('is_outreach_ready', outreachReady === 'true')
    }

    // Filter by lead list if provided (and valid UUID)
    if (listId) {
      if (!uuidRegex.test(String(listId))) {
        // Invalid UUID provided; return empty result instead of causing DB errors
        return NextResponse.json({ leads: [], pagination: { page, limit, total: 0, pages: 0 } })
      }
      try {
        const { data: listItems, error: listError } = await supabaseAdmin
          .from('lead_list_items')
          .select('lead_id')
          .eq('list_id', listId)

        // If the auxiliary table is missing or errors, treat as empty list filter
        if (listError) {
          return NextResponse.json({ leads: [], pagination: { page, limit, total: 0, pages: 0 } })
        }
        const leadIds = (listItems || []).map(item => item.lead_id)
        if (leadIds.length === 0) {
          return NextResponse.json({ leads: [], pagination: { page, limit, total: 0, pages: 0 } })
        }
        query = query.in('id', leadIds)
      } catch (e) {
        // On unexpected errors accessing list filter, return empty result
        return NextResponse.json({ leads: [], pagination: { page, limit, total: 0, pages: 0 } })
      }
    }

    const { data: leads, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // If the main table is missing or errors, return empty result instead of 500
    if (error) {
      console.warn('leads query failed, returning empty list:', error)
      return NextResponse.json({
        leads: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      })
    }

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let session: any = null
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError) {
      console.warn('Session decode error, returning 401:', sessionError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate user ID is a UUID to avoid Postgres 22P02 when filtering
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(String(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { leads, listName, attachToListId } = body

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'Invalid leads data' }, { status: 400 })
    }

    // Normalize website helper
    const normalizeWebsite = (url?: string) => {
      if (!url) return ''
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`)
        return (u.hostname + u.pathname).replace(/\/$/, '').toLowerCase()
      } catch {
        return url.replace(/\/$/, '').toLowerCase()
      }
    }

    const websites = Array.from(new Set((leads || [])
      .map((l: any) => normalizeWebsite(l.website_url || l.websiteUrl || l.source_url))
      .filter((w: string) => !!w)))

    const companies = Array.from(new Set((leads || [])
      .map((l: any) => (l.company || '').trim())
      .filter((c: string) => !!c)))

    // Fetch existing leads for deduplication
    let existingByWebsite: any[] = []
    if (websites.length > 0) {
      const { data: existingWeb, error: exWebErr } = await supabaseAdmin
        .from('leads')
        .select('id, website_url, company, city')
        .eq('user_id', session.user.id)
        .in('website_url', websites)
      if (exWebErr) throw exWebErr
      existingByWebsite = existingWeb || []
    }

    let existingByCompany: any[] = []
    if (companies.length > 0) {
      const { data: existingComp, error: exCompErr } = await supabaseAdmin
        .from('leads')
        .select('id, website_url, company, city')
        .eq('user_id', session.user.id)
        .in('company', companies)
      if (exCompErr) throw exCompErr
      existingByCompany = existingComp || []
    }

    const isDuplicate = (l: any) => {
      const w = normalizeWebsite(l.website_url || l.websiteUrl || l.source_url)
      if (w && existingByWebsite.some(e => normalizeWebsite(e.website_url) === w)) return true
      const comp = (l.company || '').trim().toLowerCase()
      const city = (l.city || '').trim().toLowerCase()
      if (!comp || !city) return false
      return existingByCompany.some(e => (e.company || '').trim().toLowerCase() === comp && (e.city || '').trim().toLowerCase() === city)
    }

    const uniqueLeads = (leads || []).filter(l => !isDuplicate(l))

    // Process and score leads (including enriched fields)
    const nowIso = new Date().toISOString()
    const processedLeads = uniqueLeads.map((lead: any) => ({
      full_name: lead.full_name || lead.fullName || '',
      job_title: lead.job_title || lead.jobTitle || '',
      company: lead.company || '',
      email: lead.email || '',
      email_status: lead.email_status || 'unknown',
      region: lead.region || lead.country || '',
      channel: lead.channel || 'maps',
      source_url: lead.source_url || lead.sourceUrl || '',
      phone: lead.phone || '',
      website_url: lead.website_url || lead.websiteUrl || '',
      address: lead.address || '',
      city: lead.city || '',
      country: lead.country || '',
      postal_code: lead.postal_code || lead.postalCode || '',
      lat: lead.lat ?? null,
      lng: lead.lng ?? null,
      rating_avg: lead.rating_avg ?? lead.ratingAvg ?? null,
      rating_count: lead.rating_count ?? lead.ratingCount ?? null,
      categories: lead.categories ?? null,
      user_id: session.user.id,
      score: calculateLeadScore(lead),
      is_outreach_ready: false,
      created_at: nowIso,
      updated_at: nowIso,
    }))

    // Update outreach ready status based on score
    processedLeads.forEach(lead => {
      lead.is_outreach_ready = isOutreachReady(lead.score)
    })

    const { data: insertedLeads, error } = await supabaseAdmin
      .from('leads')
      .insert(processedLeads)
      .select()

    if (error) throw error

    // Create or attach to lead list
    let listIdCreated: string | null = null
    if (listName && typeof listName === 'string' && listName.trim().length > 0) {
      const { data: listRows, error: listErr } = await supabaseAdmin
        .from('lead_lists')
        .insert({ user_id: session.user.id, name: listName.trim() })
        .select()
        .limit(1)
      if (listErr) throw listErr
      listIdCreated = listRows?.[0]?.id || null
    }

    let targetListId: string | null = listIdCreated || null

    // If no new list was created but a list ID was provided, validate it and ensure it belongs to the user.
    if (!targetListId && attachToListId) {
      const candidate = String(attachToListId)
      // Simple UUID v4 pattern; avoids passing non-UUID values like "1" to Postgres.
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(candidate)) {
        const { data: listRows, error: listCheckErr } = await supabaseAdmin
          .from('lead_lists')
          .select('id')
          .eq('id', candidate)
          .eq('user_id', session.user.id)
          .limit(1)
        if (!listCheckErr && Array.isArray(listRows) && listRows.length > 0 && listRows[0]?.id) {
          targetListId = listRows[0].id
        } else {
          targetListId = null
        }
      } else {
        // Provided attachToListId is not a UUID; skip attaching to avoid DB errors.
        targetListId = null
      }
    }
    if (targetListId && insertedLeads && insertedLeads.length > 0) {
      const items = insertedLeads.map((l: any) => ({ list_id: targetListId, lead_id: l.id }))
      const { error: itemsErr } = await supabaseAdmin.from('lead_list_items').insert(items)
      if (itemsErr) throw itemsErr
    }

    return NextResponse.json({ leads: insertedLeads, listId: targetListId }, { status: 201 })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateLeadScore(lead: any): number {
  let score = 0
  
  // Job title scoring
  const jobTitles = ['CEO', 'CTO', 'CFO', 'Founder', 'Director', 'Manager', 'VP']
  if (lead.job_title) {
    const titleScore = jobTitles.find(title => 
      lead.job_title.toLowerCase().includes(title.toLowerCase())
    )
    score += titleScore ? 20 : 10
  }
  
  // Email presence
  if (lead.email) score += 15
  
  // Company presence
  if (lead.company) score += 10
  
  // Region scoring
  const highValueRegions = ['US', 'UK', 'DE', 'CA', 'AU']
  if (lead.region && highValueRegions.includes(lead.region.toUpperCase())) {
    score += 15
  }
  
  return Math.min(score, 100)
}

function isOutreachReady(score: number): boolean {
  return score >= 50
}
