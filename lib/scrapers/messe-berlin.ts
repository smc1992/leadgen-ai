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
    return href || base
  }
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (LeadScraper)' } })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  return await res.text()
}

function decodeCfEmail(hex?: string | null): string | null {
  if (!hex) return null
  try {
    const r = parseInt(hex.substr(0, 2), 16)
    let email = ''
    for (let n = 2; n < hex.length; n += 2) {
      const code = parseInt(hex.substr(n, 2), 16) ^ r
      email += String.fromCharCode(code)
    }
    return email
  } catch {
    return null
  }
}

function hostnameFromUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Messe Berlin list pages often contain "/showfloor/organizations" or link to company profiles
export async function collectBerlinProfileUrls(listUrl: string, limit?: number): Promise<string[]> {
  const html = await fetchHtml(listUrl)
  const $ = load(html)
  const links = new Set<string>()
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (/showfloor\/organizations/i.test(listUrl) || /(company|organizations|exhibitor)[^\s]*detail/i.test(href) || /exhibitor\//i.test(href)) {
      // Heuristik: Profile-Links sammeln
      links.add(absoluteUrl(listUrl, href))
    }
  })
  const arr = Array.from(links)
  return typeof limit === 'number' && limit > 0 ? arr.slice(0, limit) : arr
}

export async function scrapeBerlinProfile(profileUrl: string): Promise<ExhibitorRecord> {
  const html = await fetchHtml(profileUrl)
  const $ = load(html)
  const text = (sel: string) => $(sel).first().text().trim() || null

  const company_name = text('h1') || text('.company-name') || text('[itemprop="name"]')
  let company_email = $('a[href^="mailto:"]').first().attr('href')?.replace(/^mailto:/, '') || null
  const company_phone = $('a[href^="tel:"]').first().attr('href')?.replace(/^tel:/, '') || null

  let company_website: string | null = null
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (/^https?:\/\//.test(href) && !/messe-berlin|showfloor|organizations/i.test(href)) {
      company_website = href
      return false
    }
  })

  const addressCandidate = $('.address').first().text().trim() || $('address').first().text().trim() || null
  let company_country: string | null = null
  if (addressCandidate) {
    const parts = addressCandidate.split(',').map(s => s.trim()).filter(Boolean)
    company_country = parts[parts.length - 1] || null
  }

  const contact_person_name = $('.contact, .contact-person, .person')
    .find('.name, strong')
    .first()
    .text()
    .trim() || null
  const contact_person_role = $('.contact, .contact-person, .person')
    .find('.role, em, i')
    .first()
    .text()
    .trim() || null

  // Robust email fallback: Cloudflare decode or regex from HTML
  if (!company_email) {
    const cfHex = $('[data-cfemail]').first().attr('data-cfemail') || $('.__cf_email__').first().attr('data-cfemail')
    company_email = decodeCfEmail(cfHex) || null
  }

  if (!company_email) {
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
    const allMatches = html.match(emailRegex) || []
    const websiteHost = hostnameFromUrl(company_website)
    const filtered = allMatches
      .filter(e => !/messe[-_]?berlin\.de/i.test(e))
      .filter(e => !/\bno[-_.]?reply\b/i.test(e))
    const domainMatch = websiteHost ? filtered.find(e => e.toLowerCase().includes(websiteHost.toLowerCase())) : null
    company_email = domainMatch || filtered[0] || null
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

export async function scrapeBerlinExhibitors(listUrl: string, limit?: number): Promise<ExhibitorRecord[]> {
  const urls = await collectBerlinProfileUrls(listUrl, limit)
  const results: ExhibitorRecord[] = []
  const concurrency = 5
  let i = 0
  async function next() {
    if (i >= urls.length) return
    const url = urls[i++]
    try {
      const rec = await scrapeBerlinProfile(url)
      results.push(rec)
    } catch (err) {
      console.error('Berlin profile scrape error:', err)
    }
    await next()
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => next()))
  return results
}