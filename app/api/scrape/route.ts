import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceGuards } from '@/lib/security'
import { ScrapeSchema } from '@/lib/validation'

// Apify API configuration
const APIFY_API_URL = 'https://api.apify.com/v2'
const APIFY_TOKEN = process.env.APIFY_TOKEN

interface ApifyRunResponse {
  data: {
    id: string
    status: string
    actId: string
  }
}

interface ScrapedLead {
  fullName: string
  jobTitle: string
  company: string
  email?: string
  region?: string
  channel: string
  sourceUrl: string
  // Enriched (Google Maps specific)
  phone?: string
  websiteUrl?: string
  address?: string
  city?: string
  country?: string
  postalCode?: string
  lat?: number
  lng?: number
  ratingAvg?: number
  ratingCount?: number
  categories?: string[]
  // Contacts enrichment
  contactEmails?: string[]
  contactPhones?: string[]
  socialProfiles?: { type: string; url: string }[]
  // Leads enrichment
  leadsCount?: number
  leads?: Array<{ fullName?: string; jobTitle?: string; workEmail?: string; phone?: string; linkedin?: string }>
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `scrape-post:${ip}`, 10, 60_000)
    if (guard) return guard

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!APIFY_TOKEN) {
      console.error('Apify token missing. Set APIFY_TOKEN in environment.')
      return NextResponse.json({ error: 'Service unavailable: Apify not configured' }, { status: 503 })
    }

    const body = await request.json()
    const parsed = ScrapeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const { type, params } = parsed.data

    if (!type || !params) {
      return NextResponse.json({ 
        error: 'Type and params are required' 
      }, { status: 400 })
    }

    let actorId: string
    let runInput: any

    switch (type) {
      case 'linkedin':
        {
          const cookie = process.env.APIFY_LINKEDIN_COOKIE
          if (params.searchUrl) {
            actorId = process.env.APIFY_ACTOR_ID_LINKEDIN_SEARCH || 'curious_coder/linkedin-people-search-scraper'
            runInput = {
              searchUrl: params.searchUrl,
              startPage: params.startPage || 1,
              endPage: params.endPage || 1,
              ...(cookie ? { linkedinCookies: cookie } : {}),
              proxyConfiguration: { useApifyProxy: true }
            }
          } else {
            actorId = process.env.APIFY_ACTOR_ID_LINKEDIN || 'apimaestro/linkedin-profile-batch-scraper-no-cookies-required'
            runInput = {
              profileUrls: [params.profileUrl],
              ...(cookie ? { linkedinCookies: cookie } : {}),
              proxyConfiguration: { useApifyProxy: true }
            }
          }
        }
        break

      case 'maps':
        actorId = process.env.APIFY_ACTOR_ID_GMAPS || 'compass/crawler-google-places'
        runInput = {
          // Apify expects separate search strings and a locationQuery
          searchStringsArray: [params.searchQuery],
          locationQuery: params.location,
          maxCrawledPlacesPerSearch: params.limit || 100,
          // If enrichment is requested, focus on places with website to optimize cost
          ...(params.withWebsiteOnly ? { websiteEnum: 'withWebsite' } : {}),
          // Business leads enrichment (paid add-on): set max leads per place
          ...(typeof params.maxLeads === 'number' && params.maxLeads > 0
            ? { maximumLeadsEnrichmentRecords: params.maxLeads }
            : { maximumLeadsEnrichmentRecords: 0 }),
          proxyConfiguration: { useApifyProxy: true }
        }
        break

      case 'validator':
        actorId = process.env.APIFY_ACTOR_ID_VALIDATOR || 'anchor/email-check-verify-validate'
        runInput = {
          emails: params.emails,
          proxyConfiguration: { useApifyProxy: true }
        }
        break

      default:
        return NextResponse.json({ 
          error: 'Invalid scraper type' 
        }, { status: 400 })
    }

    // Normalize actor id for HTTP API (username~actor-name)
    const normalizedActorId = actorId.includes('/') ? actorId.replace('/', '~') : actorId

    // Helper to start run
    const startRun = async (input: any) => {
      return fetch(`${APIFY_API_URL}/acts/${normalizedActorId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      })
    }

    // Start the scraper run
    let runResponse = await startRun(runInput)

    // Retry without website filter if actor rejects unknown params
    if (!runResponse.ok && type === 'maps' && params?.withWebsiteOnly) {
      const upstreamText = await runResponse.text().catch(() => '')
      const looksLikeParamError = runResponse.status === 400 && /websiteEnum|unknown parameter|validation/i.test(upstreamText || '')
      if (looksLikeParamError) {
        try {
          const retryInput = { ...runInput }
          // Remove websiteEnum for compatibility
          if (retryInput.websiteEnum) delete retryInput.websiteEnum
          // If input validation is strict, also remove optional enrichment count
          if (retryInput.maximumLeadsEnrichmentRecords !== undefined) delete retryInput.maximumLeadsEnrichmentRecords
          runResponse = await startRun(retryInput)
        } catch (e) {
          // Fall through to error handling below
        }
      }
    }

    if (!runResponse.ok) {
      const upstreamStatus = runResponse.status
      const upstreamText = await runResponse.text().catch(() => '')
      // Map upstream failures to client-friendly status codes
      const mappedStatus = (upstreamStatus === 401 || upstreamStatus === 403)
        ? 502 // Upstream auth failure
        : (upstreamStatus >= 500 ? 502 : 400)
      console.error('Apify run start failed:', upstreamStatus, upstreamText)
      try {
        await supabaseAdmin
          .from('scrape_runs')
          .insert({
            id: `err_${Date.now()}`,
            type,
            status: 'failed',
            result_count: 0,
            triggered_by: session.user.id,
            created_at: new Date().toISOString(),
            error_message: upstreamText?.slice(0, 500) || `status ${upstreamStatus}`
          })
      } catch {}
      return NextResponse.json({
        error: 'Apify run start failed',
        apifyStatus: upstreamStatus,
        apifyMessage: upstreamText?.slice(0, 500) || undefined
      }, { status: mappedStatus })
    }

    const runData: ApifyRunResponse = await runResponse.json()

    // Persist run in Supabase
    try {
      await supabaseAdmin
        .from('scrape_runs')
        .insert({
          id: runData.data.id,
          type,
          status: runData.data.status.toLowerCase(),
          result_count: 0,
          triggered_by: session.user.id,
          created_at: new Date().toISOString()
        })
    } catch (e) {
      console.error('Failed to insert scrape_runs:', e)
    }

    return NextResponse.json({ 
      success: true,
      runId: runData.data.id,
      status: runData.data.status
    }, { status: 201 })

  } catch (error) {
    console.error('Apify scrape error:', error)
    return NextResponse.json({ 
      error: 'Failed to start scraper' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `scrape-get:${ip}`, 30, 60_000)
    if (guard) return guard

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!APIFY_TOKEN) {
      console.error('Apify token missing. Set APIFY_TOKEN in environment.')
      return NextResponse.json({ error: 'Service unavailable: Apify not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')
    const enrichContacts = searchParams.get('enrichContacts') === 'true'

    if (!runId) {
      return NextResponse.json({ 
        error: 'Run ID is required' 
      }, { status: 400 })
    }

    // Check run status
    const statusResponse = await fetch(`${APIFY_API_URL}/actor-runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`
      }
    })

    if (!statusResponse.ok) {
      const upstreamStatus = statusResponse.status
      const upstreamText = await statusResponse.text().catch(() => '')
      const mappedStatus = (upstreamStatus === 401 || upstreamStatus === 403)
        ? 502
        : (upstreamStatus >= 500 ? 502 : 400)
      console.error('Apify run status failed:', upstreamStatus, upstreamText)
      return NextResponse.json({
        error: 'Apify run status failed',
        apifyStatus: upstreamStatus,
        apifyMessage: upstreamText?.slice(0, 500) || undefined
      }, { status: mappedStatus })
    }

    const runStatus = await statusResponse.json()

    // Get results if finished
    let results: any[] = []
    let debug: any = undefined
    if (runStatus.data.status === 'SUCCEEDED') {
      const resultsResponse = await fetch(`${APIFY_API_URL}/actor-runs/${runId}/dataset/items?format=json&clean=1`, {
        headers: {
          'Authorization': `Bearer ${APIFY_TOKEN}`
        }
      })

      if (resultsResponse.ok) {
        const rawResults = await resultsResponse.json()
        // Collect minimal debug info in development to inspect structure
        if (Array.isArray(rawResults) && rawResults.length > 0 && process.env.NODE_ENV !== 'production') {
          debug = {
            actId: runStatus.data.actId,
            sampleKeys: Object.keys(rawResults[0]).slice(0, 20)
          }
        }
        results = rawResults.map((item: any) => transformScrapedData(item, runStatus.data.actId))
        // Lightweight contact enrichment from website (maps only) – runs only when explicitly enabled via query flag
        if (enrichContacts) {
          // To keep latency low, enrich top 20 items maximum and skip items without website
          const toEnrich = results
            .filter(r => r.channel === 'maps' && (!Array.isArray(r.contactEmails) || r.contactEmails.length === 0))
            .slice(0, 20)
          if (toEnrich.length > 0) {
            try {
              const enriched = await Promise.all(toEnrich.map(async (r) => {
                const contacts = await extractContactsFromWebsite(r.websiteUrl || r.sourceUrl)
                return { r, contacts }
              }))
              enriched.forEach(({ r, contacts }) => {
                if (contacts) {
                  if (Array.isArray(contacts.emails) && contacts.emails.length > 0) {
                    r.contactEmails = contacts.emails
                    if (!r.email) r.email = contacts.emails[0]
                  }
                  if (Array.isArray(contacts.phones) && contacts.phones.length > 0) {
                    r.contactPhones = contacts.phones
                    if (!r.phone) r.phone = contacts.phones[0]
                  }
                  if (Array.isArray(contacts.socials) && contacts.socials.length > 0) {
                    r.socialProfiles = (r.socialProfiles || []).concat(contacts.socials)
                  }
                }
              })
            } catch (e) {
              // Non-fatal enrichment errors; continue with base results
            }
          }
        }
      }

      // Persist status and optionally insert leads
      try {
        await supabaseAdmin
          .from('scrape_runs')
          .update({
            status: 'succeeded',
            result_count: results.length,
          })
          .eq('id', runId)
      } catch (e) {
        console.error('Failed to update scrape_runs:', e)
      }

      if (Array.isArray(results) && results.length) {
        const leadsToInsert = results.slice(0, 500).map(r => ({
          user_id: session.user.id,
          full_name: r.fullName || '',
          job_title: r.jobTitle || null,
          company: r.company || null,
          email: r.email || null,
          email_status: r.email ? 'valid' : 'unknown',
          score: 0,
          region: r.region || null,
          channel: r.channel || 'unknown',
          source_url: r.sourceUrl || null,
          is_outreach_ready: false,
          created_at: new Date().toISOString()
        }))
        try {
          await supabaseAdmin
            .from('leads')
            .insert(leadsToInsert)
        } catch (e) {
          console.error('Failed to insert leads from scrape:', e)
        }
      }
    }

    return NextResponse.json({
      runId,
      status: runStatus.data.status.toLowerCase(),
      results,
      resultCount: results.length,
      debug
    })

  } catch (error) {
    console.error('Apify status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check run status' 
    }, { status: 500 })
  }
}

function transformScrapedData(item: any, actorId: string): ScrapedLead {
  // Apify sometimes returns an opaque actId (e.g., "nwua9Gu5...") instead of the actor name.
  // To avoid empty results, detect dataset shape heuristically and fall back to actor name when available.
  const actorKey = actorId.includes('~') ? actorId.replace('~', '/') : actorId

  const looksLikeLinkedIn = (
    typeof item?.firstName === 'string' ||
    typeof item?.lastName === 'string' ||
    typeof item?.jobTitle === 'string' ||
    typeof item?.companyName === 'string' ||
    typeof item?.basic_info?.fullname === 'string' ||
    typeof item?.basic_info?.profile_url === 'string'
  )

  const looksLikeMaps = (
    // Common Google Places fields across actor versions
    typeof item?.placeId === 'string' ||
    typeof item?.googleMapsUrl === 'string' ||
    typeof item?.gmapsUrl === 'string' ||
    typeof item?.formattedAddress === 'string' ||
    typeof item?.address === 'string' || typeof item?.address === 'object' ||
    typeof item?.phone === 'string' || typeof item?.phoneNumber === 'string' ||
    typeof item?.internationalPhoneNumber === 'string' ||
    (item?.location && (typeof item.location.lat === 'number' || typeof item.location.lng === 'number')) ||
    Array.isArray(item?.categories) || Array.isArray(item?.types) ||
    typeof item?.userRatingsTotal === 'number' || typeof item?.reviewsCount === 'number'
  )

  const looksLikeValidator = (
    typeof item?.email === 'string' && !looksLikeLinkedIn && !looksLikeMaps
  )

  // Prefer explicit actor names, but rely on shape detection when actId is opaque
  if (actorKey.includes('linkedin') || looksLikeLinkedIn) {
    const bi = item.basic_info || {}
    return {
      fullName: `${item.firstName || ''} ${item.lastName || ''}`.trim() || bi.fullname || '',
      jobTitle: item.jobTitle || bi.headline || '',
      company: item.companyName || bi.current_company || '',
      email: item.email,
      region: item.location || bi?.location?.country || '',
      channel: 'linkedin',
      sourceUrl: item.url || item.profileUrl || bi.profile_url || ''
    }
  }

  if (actorKey === 'compass/crawler-google-places' || looksLikeMaps) {
    return {
      fullName: item.title || '',
      jobTitle: '',
      company: item.name || item.title || '',
      email: item.email || '',
      region: item.address?.country || item.country || '',
      channel: 'maps',
      // Prefer explicit Google Maps URL if provided
      sourceUrl: item.googleMapsUrl || item.gmapsUrl || item.url || item.website || '',
      // Phone formats vary across actors
      phone: item.phone || item.phoneNumber || item.internationalPhoneNumber || item.formattedPhoneNumber || '',
      // Website may be under different keys
      websiteUrl: item.website || item.site || item.domain || item.url || '',
      // Address can be a string or nested object depending on actor version
      address: item.formattedAddress || item.address?.formatted || item.address || '',
      city: item.address?.city || item.city || '',
      country: item.address?.country || item.country || '',
      postalCode: item.address?.postalCode || item.postalCode || '',
      lat: item.location?.lat ?? item.lat ?? (Array.isArray(item.coordinates) ? item.coordinates[0] : undefined),
      lng: item.location?.lng ?? item.lng ?? (Array.isArray(item.coordinates) ? item.coordinates[1] : undefined),
      ratingAvg: typeof item.rating === 'number' ? item.rating : (item.rating?.avg ?? undefined),
      ratingCount: item.userRatingsTotal ?? item.userRatingCount ?? item.reviewsCount ?? item.reviews ?? undefined,
      categories: Array.isArray(item.categories) ? item.categories : (Array.isArray(item.types) ? item.types : undefined),
      // Contacts enrichment mapping
      contactEmails: Array.isArray(item.contactDetails?.emails)
        ? item.contactDetails.emails
        : (Array.isArray(item.emails) ? item.emails : undefined),
      contactPhones: Array.isArray(item.contactDetails?.phonesUncertain)
        ? item.contactDetails.phonesUncertain
        : (Array.isArray(item.phones) ? item.phones : undefined),
      socialProfiles: buildSocials(item),
      // Leads enrichment mapping
      leadsCount: Array.isArray(item.leadsEnrichment)
        ? item.leadsEnrichment.length
        : (typeof item.leads_count === 'number' ? item.leads_count : undefined),
      leads: normalizeLeads(item)
    }
  }

  if (actorKey === 'anchor/email-check-verify-validate' || looksLikeValidator) {
    return {
      fullName: '',
      jobTitle: '',
      company: '',
      email: item.email,
      region: '',
      channel: 'validator',
      sourceUrl: ''
    }
  }

  // Fallback: unknown actor/result shape
  return {
    fullName: '',
    jobTitle: '',
    company: '',
    email: '',
    region: '',
    channel: 'unknown',
    sourceUrl: ''
  }
}

async function extractContactsFromWebsite(url?: string): Promise<{ emails: string[]; phones: string[]; socials: { type: string; url: string }[] } | null> {
  if (!url) return null
  const normalized = normalizeUrl(url)
  if (!normalized) return null
  const htmlMain = await fetchTextWithTimeout(normalized, 6000).catch(() => '')
  const htmlContact = await fetchTextWithTimeout(joinPath(normalized, '/contact'), 4000).catch(() => '')
  const html = `${htmlMain}\n${htmlContact}`
  if (!html || html.length < 200) return null
  const emails = Array.from(new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])
    .map(e => e.toLowerCase())
    .filter(e => !e.endsWith('@example.com'))))
  const phones = Array.from(new Set((html.match(/\+?\d[\d\s().\-]{6,}\d/g) || [])
    .map(p => p.trim())))
  const socials: { type: string; url: string }[] = []
  const addSocial = (type: string, pattern: RegExp) => {
    const found = html.match(pattern) || []
    found.slice(0, 5).forEach(u => socials.push({ type, url: u }))
  }
  addSocial('facebook', /https?:\/\/[^\s"']*facebook\.com\/[^\s"']+/gi)
  addSocial('instagram', /https?:\/\/[^\s"']*instagram\.com\/[^\s"']+/gi)
  addSocial('linkedin', /https?:\/\/[^\s"']*linkedin\.com\/[^\s"']+/gi)
  addSocial('twitter', /https?:\/\/[^\s"']*(twitter|x)\.com\/[^\s"']+/gi)
  addSocial('youtube', /https?:\/\/[^\s"']*youtube\.com\/[^\s"']+/gi)
  addSocial('tiktok', /https?:\/\/[^\s"']*tiktok\.com\/[^\s"']+/gi)
  return { emails, phones, socials }
}

function normalizeUrl(url: string): string | null {
  try {
    const hasProtocol = /^https?:\/\//i.test(url)
    const u = new URL(hasProtocol ? url : `https://${url}`)
    return `${u.protocol}//${u.hostname}`
  } catch {
    return null
  }
}

async function fetchTextWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (LeadGen)' } })
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  } finally {
    clearTimeout(id)
  }
}

function joinPath(base: string, path: string): string {
  try {
    const u = new URL(base)
    return `${u.protocol}//${u.hostname}${path.startsWith('/') ? path : `/${path}`}`
  } catch {
    return base
  }
}

function buildSocials(item: any): { type: string; url: string }[] | undefined {
  const socials: { type: string; url: string }[] = []
  const cd = item.contactDetails || {}
  const add = (type: string, arr: any) => {
    if (Array.isArray(arr)) {
      arr.forEach((url: any) => {
        if (typeof url === 'string' && url) socials.push({ type, url })
      })
    }
  }
  add('twitter', cd.twitters || item.twitters)
  add('instagram', cd.instagrams || item.instagrams)
  add('facebook', cd.facebooks || item.facebooks)
  add('linkedin', cd.linkedins || item.linkedins || (Array.isArray(item.socials) ? item.socials.filter((s: any) => typeof s === 'string' && s.includes('linkedin.com')) : undefined))
  return socials.length ? socials : undefined
}

function normalizeLeads(item: any): Array<{ fullName?: string; jobTitle?: string; workEmail?: string; phone?: string; linkedin?: string }> | undefined {
  const leads = item.leadsEnrichment || item.leads || item.leads_enrichment
  if (!Array.isArray(leads)) return undefined
  return leads.map((l: any) => ({
    fullName: l.fullName || l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || undefined,
    jobTitle: l.jobTitle || l.title || undefined,
    workEmail: l.workEmail || l.email || undefined,
    phone: l.phone || l.workPhone || undefined,
    linkedin: l.linkedin || l.linkedinUrl || (Array.isArray(l.socials) ? l.socials.find((s: any) => typeof s === 'string' && s.includes('linkedin.com')) : undefined)
  }))
}
