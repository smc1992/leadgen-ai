import { load } from 'cheerio'

export interface ExhibitorRecord {
  exhibitor_profile_url: string
  company_name: string | null
  company_address?: string | null
  company_country?: string | null
  company_phone?: string | null
  company_email?: string | null
  company_website?: string | null
  contact_person_name?: string | null
  contact_person_role?: string | null
}

function absoluteUrl(base: string, href?: string | null): string {
  if (!href) return base
  try {
    return new URL(href, base).toString()
  } catch {
    return href
  }
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (LeadScraper)' } })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  return await res.text()
}

export async function collectMesseFrankfurtProfileUrls(listUrl: string, limit?: number): Promise<string[]> {
  const html = await fetchHtml(listUrl)
  const $ = load(html)
  // Heuristik: Links zu Detailseiten enthalten meist "exhibitor-search.detail"
  const links = new Set<string>()
  $('a').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (/exhibitor-search\.detail/i.test(href)) {
      links.add(absoluteUrl(listUrl, href))
    }
  })
  const arr = Array.from(links)
  return typeof limit === 'number' && limit > 0 ? arr.slice(0, limit) : arr
}

export async function scrapeMesseFrankfurtProfile(profileUrl: string): Promise<ExhibitorRecord> {
  const html = await fetchHtml(profileUrl)
  const $ = load(html)
  const text = (sel: string) => $(sel).first().text().trim() || null

  // Company name heuristics
  const company_name = text('h1') || text('.company-name') || text('[itemprop="name"]')

  // Contact person (heuristics on labels and sections)
  const contact_person_name = $('a[href^="mailto:"]').closest('div,li,p').find('strong, .name').first().text().trim() || null
  const contact_person_role = $('.contact, .person, .role').find('.role, em, i').first().text().trim() || null

  // Emails / phones / website
  const company_email = $('a[href^="mailto:"]').first().attr('href')?.replace(/^mailto:/, '') || null
  const company_phone = $('a[href^="tel:"]').first().attr('href')?.replace(/^tel:/, '') || null
  // Try to find an external website link
  let company_website: string | null = null
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (/^https?:\/\//.test(href) && !/messefrankfurt\.com|exhibitor-search\.detail/i.test(href)) {
      company_website = href
      return false
    }
  })

  // Address and country heuristics
  const addressCandidate = $('.address').first().text().trim() || $('address').first().text().trim() || null
  let company_country: string | null = null
  if (addressCandidate) {
    const parts = addressCandidate.split(/\n|,|\|/).map(s => s.trim()).filter(Boolean)
    company_country = parts[parts.length - 1] || null
  }

  return {
    exhibitor_profile_url: profileUrl,
    company_name,
    company_address: addressCandidate,
    company_country,
    company_phone,
    company_email,
    company_website,
    contact_person_name,
    contact_person_role,
  }
}

export async function scrapeMesseFrankfurtExhibitors(listUrl: string, limit?: number): Promise<ExhibitorRecord[]> {
  const profileUrls = await collectMesseFrankfurtProfileUrls(listUrl, limit)
  const results: ExhibitorRecord[] = []
  const concurrency = 5
  let i = 0
  async function next() {
    if (i >= profileUrls.length) return
    const url = profileUrls[i++]
    try {
      const rec = await scrapeMesseFrankfurtProfile(url)
      results.push(rec)
    } catch (err) {
      console.error('Profile scrape error:', err)
    }
    await next()
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, profileUrls.length) }, () => next()))
  return results
}