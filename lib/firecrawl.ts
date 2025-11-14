export type FirecrawlFormats = Array<'markdown'|'summary'|'html'|'rawHtml'|'screenshot'|'links'|'json'|'images'|'branding'>

export async function firecrawlScrape(url: string, formats: FirecrawlFormats = ['markdown','links','branding']): Promise<any> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY missing')
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ url, formats })
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=> '')
    throw new Error(txt || `Firecrawl error ${res.status}`)
  }
  const json = await res.json()
  return json?.data || json
}
