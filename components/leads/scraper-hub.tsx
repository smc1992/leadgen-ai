"use client"
import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { fetchWithCsrf } from "@/lib/client-fetch"

type Lead = { fullName?: string; jobTitle?: string; company?: string; email?: string; region?: string; channel?: string; sourceUrl?: string }

export default function ScraperHub() {
  const [tab, setTab] = useState("maps")
  const [mapsSearch, setMapsSearch] = useState("")
  const [mapsLocation, setMapsLocation] = useState("")
  const [mapsLimit, setMapsLimit] = useState(100)
  const [mapsWebsiteOnly, setMapsWebsiteOnly] = useState(false)
  const [enrichContacts, setEnrichContacts] = useState(false)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [linkedinSearchUrl, setLinkedinSearchUrl] = useState("")
  const [linkedinKeywords, setLinkedinKeywords] = useState("")
  const [linkedinResultType, setLinkedinResultType] = useState("people")
  const [startPage, setStartPage] = useState(1)
  const [endPage, setEndPage] = useState(1)
  const [lnLocation, setLnLocation] = useState("")
  const [lnIndustry, setLnIndustry] = useState("")
  const [lnCompany, setLnCompany] = useState("")
  const [validatorEmails, setValidatorEmails] = useState("")
  const [lnTitle, setLnTitle] = useState("")
  const [lnCompanySize, setLnCompanySize] = useState("")
  const [messeProvider, setMesseProvider] = useState("messe-berlin")
  const [messeParam, setMesseParam] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Lead[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const toggle = (i: number) => setSelected(prev => ({ ...prev, [i]: !prev[i] }))
  const [listName, setListName] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [runs, setRuns] = useState<any[]>([])
  const [cronExpr, setCronExpr] = useState("")

  const runMaps = async () => {
    setLoading(true)
    setResults([])
    const run = await fetchWithCsrf("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "maps", params: { searchQuery: mapsSearch, location: mapsLocation, limit: mapsLimit, withWebsiteOnly: mapsWebsiteOnly } }) })
    const runJson = await run.json()
    if (!run.ok) { setLoading(false); return }
    const runId = runJson.runId
    const poll = async () => {
      const res = await fetch(`/api/scrape?runId=${runId}&enrichContacts=${enrichContacts}`)
      const json = await res.json()
      if (json.status === "succeeded") { setResults(json.results || []); setLoading(false) } else { setTimeout(poll, 2000) }
    }
    poll()
  }

  const runLinkedin = async () => {
    setLoading(true)
    setResults([])
    let searchUrl = linkedinSearchUrl
    if (!searchUrl && (linkedinKeywords || lnCompany || lnIndustry || lnLocation || lnTitle || lnCompanySize)) {
      const base = linkedinResultType === "companies" ? "https://www.linkedin.com/search/results/companies/?keywords=" : "https://www.linkedin.com/search/results/people/?keywords="
      const parts = [linkedinKeywords, lnCompany, lnIndustry, lnLocation, lnTitle, lnCompanySize && `employees ${lnCompanySize}`].filter(Boolean)
      searchUrl = base + encodeURIComponent(parts.join(" "))
    }
    const params = searchUrl ? { searchUrl, startPage, endPage } : { profileUrl: linkedinUrl, limit: 50 }
    const run = await fetchWithCsrf("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "linkedin", params }) })
    const runJson = await run.json()
    if (!run.ok) { setLoading(false); return }
    const runId = runJson.runId
    const poll = async () => {
      const res = await fetch(`/api/scrape?runId=${runId}`)
      const json = await res.json()
      if (json.status === "succeeded") { setResults(json.results || []); setLoading(false) } else { setTimeout(poll, 2000) }
    }
    poll()
  }

  const runValidator = async () => {
    setLoading(true)
    setResults([])
    const emails = validatorEmails.split(/[,\n\s]+/).map(e => e.trim()).filter(Boolean)
    const run = await fetchWithCsrf("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "validator", params: { emails } }) })
    const runJson = await run.json()
    if (!run.ok) { setLoading(false); return }
    const runId = runJson.runId
    const poll = async () => {
      const res = await fetch(`/api/scrape?runId=${runId}`)
      const json = await res.json()
      if (json.status === "succeeded") { setResults(json.results || []); setLoading(false) } else { setTimeout(poll, 2000) }
    }
    poll()
  }

  const runMesse = async () => {
    setLoading(true)
    setResults([])
    const path = `/api/leads/scrapers/${messeProvider}`
    const res = await fetchWithCsrf(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: messeParam }) })
    const json = await res.json()
    if (res.ok) { setResults(json.leads || []); setLoading(false) } else { setLoading(false) }
  }

  const saveToList = async () => {
    if (!listName || results.length === 0) return
    const leads = results.map(r => ({ full_name: r.fullName || "", job_title: r.jobTitle || "", company: r.company || "", email: r.email || "", region: r.region || "", channel: r.channel || "scraper", source_url: r.sourceUrl || "" }))
    const res = await fetchWithCsrf("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leads, listName }) })
    if (res.ok) { setListName("") }
  }

  const sendOutreach = async () => {
    if (!campaignId || !templateId || results.length === 0) return
    const idsRes = await fetch(`/api/automation/schedules`) 
    const leadsRes = await fetch(`/api/leads?limit=100`) 
    const emails = results.filter(r => r.email)
    const body = { type: "add-leads", data: { campaignId, leads: emails.map(e => ({ email: e.email || "", firstName: (e.fullName || "").split(" ")[0] || "", lastName: (e.fullName || "").split(" ").slice(1).join(" ") || "", company: e.company || "" })) } }
    const res = await fetchWithCsrf("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) { const sendBody = { campaignId, templateId, leadIds: [], sendNow: true }; await fetchWithCsrf("/api/outreach/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sendBody) }) }
  }

  const createDealsFromSelection = async () => {
    const indices = Object.entries(selected).filter(([i, v]) => v).map(([i]) => parseInt(i))
    const picks = indices.map(i => results[i]).filter(Boolean)
    for (const p of picks) {
      const title = p.company || p.fullName || 'Lead Deal'
      const body = {
        title,
        description: `Imported from ${p.channel || 'scraper'}: ${p.sourceUrl || ''}`,
        deal_value: null,
        currency: 'EUR',
        stage_id: null,
        contact_name: p.fullName || null,
        contact_email: p.email || null,
        company_name: p.company || null,
        source: 'scraper'
      }
      await fetchWithCsrf('/api/sales/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSelected({})
  }

  const rows = useMemo(() => results.slice(0, 200), [results])

  const loadRuns = async () => {
    const res = await fetch('/api/scrape/runs')
    const json = await res.json()
    if (res.ok) setRuns(json.runs || [])
  }

  useEffect(() => { loadRuns() }, [])

  useEffect(() => {
    const id = setInterval(loadRuns, 10000)
    return () => clearInterval(id)
  }, [])

  const createScrapeSchedule = async () => {
    const name = tab === 'maps' ? `Scrape Maps: ${mapsSearch}` : tab === 'linkedin' ? 'Scrape LinkedIn' : tab === 'validator' ? 'Validate Emails' : `Scrape Messe: ${messeProvider}`
    const metadata = tab === 'maps'
      ? { type: 'maps', params: { searchQuery: mapsSearch, location: mapsLocation, limit: mapsLimit, withWebsiteOnly: mapsWebsiteOnly } }
      : tab === 'linkedin'
      ? { type: 'linkedin', params: (linkedinSearchUrl ? { searchUrl: linkedinSearchUrl, startPage, endPage } : { profileUrl: linkedinUrl }) }
      : tab === 'validator'
      ? { type: 'validator', params: { emails: validatorEmails.split(/[\n,\s]+/).map(e=>e.trim()).filter(Boolean) } }
      : { type: 'messe', params: { provider: messeProvider, query: messeParam } }
    const body = { name, type: 'scrape', interval_minutes: 60, cron_expr: cronExpr || null, active: true, metadata }
    const res = await fetchWithCsrf('/api/automation/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { await loadRuns() }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="maps">Google Maps</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="validator">Validator</TabsTrigger>
            <TabsTrigger value="messe">Messe</TabsTrigger>
          </TabsList>
          <TabsContent value="maps">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input placeholder="Suche" value={mapsSearch} onChange={e => setMapsSearch(e.target.value)} />
              <Input placeholder="Ort" value={mapsLocation} onChange={e => setMapsLocation(e.target.value)} />
              <Input type="number" placeholder="Limit" value={mapsLimit} onChange={e => setMapsLimit(parseInt(e.target.value || "0"))} />
              <Select value={mapsWebsiteOnly ? "yes" : "no"} onValueChange={v => setMapsWebsiteOnly(v === "yes")}> 
                <SelectTrigger><SelectValue placeholder="Nur mit Website" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Alle</SelectItem>
                  <SelectItem value="yes">Nur mit Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <Select value={enrichContacts ? "yes" : "no"} onValueChange={v => setEnrichContacts(v === "yes")}> 
                <SelectTrigger><SelectValue placeholder="Kontakte anreichern" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Nicht anreichern</SelectItem>
                  <SelectItem value="yes">Anreichern</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={runMaps} disabled={loading}>Start</Button>
            </div>
          </TabsContent>
          <TabsContent value="linkedin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Select value={linkedinResultType} onValueChange={setLinkedinResultType}>
                <SelectTrigger><SelectValue placeholder="Resultat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="people">Personen</SelectItem>
                  <SelectItem value="companies">Firmen</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Keywords (optional)" value={linkedinKeywords} onChange={e => setLinkedinKeywords(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <Input placeholder="Search URL (optional)" value={linkedinSearchUrl} onChange={e => setLinkedinSearchUrl(e.target.value)} />
              <Input placeholder="Profil URL (optional)" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Startseite" value={startPage} onChange={e => setStartPage(parseInt(e.target.value || "1"))} />
                <Input type="number" placeholder="Endseite" value={endPage} onChange={e => setEndPage(parseInt(e.target.value || "1"))} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <Input placeholder="Ort (optional)" value={lnLocation} onChange={e => setLnLocation(e.target.value)} />
              <Input placeholder="Industrie (optional)" value={lnIndustry} onChange={e => setLnIndustry(e.target.value)} />
              <Input placeholder="Firma (optional)" value={lnCompany} onChange={e => setLnCompany(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <Input placeholder="Titel (optional)" value={lnTitle} onChange={e => setLnTitle(e.target.value)} />
              <Select value={lnCompanySize} onValueChange={setLnCompanySize}>
                <SelectTrigger><SelectValue placeholder="Firmengröße (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Beliebig</SelectItem>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-500">201-500</SelectItem>
                  <SelectItem value="501-1000">501-1000</SelectItem>
                  <SelectItem value="1001-5000">1001-5000</SelectItem>
                  <SelectItem value="5001-10000">5001-10000</SelectItem>
                  <SelectItem value="10001+">10001+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2">
              <Button onClick={runLinkedin} disabled={loading}>Start</Button>
              <Button className="ml-2" variant="outline" onClick={() => {
                let url = linkedinSearchUrl
                if (!url) {
                  const base = linkedinResultType === "companies" ? "https://www.linkedin.com/search/results/companies/?keywords=" : "https://www.linkedin.com/search/results/people/?keywords="
                  const parts = [linkedinKeywords, lnCompany, lnIndustry, lnLocation, lnTitle, lnCompanySize && `employees ${lnCompanySize}`].filter(Boolean)
                  url = base + encodeURIComponent(parts.join(" "))
                }
                if (url) window.open(url, "_blank")
              }}>LinkedIn öffnen</Button>
            </div>
          </TabsContent>
          <TabsContent value="validator">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Emails, getrennt durch Komma" value={validatorEmails} onChange={e => setValidatorEmails(e.target.value)} />
              <Button onClick={runValidator} disabled={loading}>Start</Button>
            </div>
          </TabsContent>
          <TabsContent value="messe">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Select value={messeProvider} onValueChange={setMesseProvider}> 
                <SelectTrigger><SelectValue placeholder="Quelle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="messe-berlin">Messe Berlin</SelectItem>
                  <SelectItem value="messe-muenchen">Messe München</SelectItem>
                  <SelectItem value="koeln">Koelnmesse</SelectItem>
                  <SelectItem value="afag">AFAG</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Parameter" value={messeParam} onChange={e => setMesseParam(e.target.value)} />
              <Button onClick={runMesse} disabled={loading}>Start</Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Cron (optional)" value={cronExpr} onChange={e => setCronExpr(e.target.value)} />
          <Button onClick={createScrapeSchedule}>Schedule</Button>
          <Button variant="outline" onClick={loadRuns}>Refresh Runs</Button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Run</th>
                <th className="text-left">Type</th>
                <th className="text-left">Status</th>
                <th className="text-left">Results</th>
                <th className="text-left">Error</th>
                <th className="text-left">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {(runs || []).map((r) => (
                <tr key={r.id}>
                  <td className="truncate max-w-[200px]">{r.id}</td>
                  <td>{r.type}</td>
                  <td>{r.status}</td>
                  <td>{r.result_count}</td>
                  <td className="truncate max-w-[240px]">{r.error_message || ''}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const res = await fetch(`/api/scrape?runId=${r.id}`)
                      const json = await res.json()
                      if (json.status === 'succeeded') setResults(json.results || [])
                    }}>Ergebnisse laden</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="Leadliste Name" value={listName} onChange={e => setListName(e.target.value)} />
          <Button onClick={saveToList} disabled={loading || results.length === 0}>In Liste speichern</Button>
          <Input placeholder="Kampagnen ID" value={campaignId} onChange={e => setCampaignId(e.target.value)} />
          <Input placeholder="Template ID" value={templateId} onChange={e => setTemplateId(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sendOutreach} disabled={loading || results.length === 0}>Outreach senden</Button>
        </div>
      </Card>
      <Card className="p-4">
        <div className="overflow-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Firma</th>
                <th className="text-left">Email</th>
                <th className="text-left">Kanal</th>
                <th className="text-left">Quelle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input type="checkbox" checked={!!selected[i]} onChange={() => toggle(i)} /> {r.fullName || ""}
                  </td>
                  <td>{r.company || ""}</td>
                  <td>{r.email || ""}</td>
                  <td>{r.channel || ""}</td>
                  <td className="truncate max-w-[240px]">{r.sourceUrl || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="rounded-lg border p-3 flex items-start justify-between">
              <div>
                <div className="font-medium text-sm">{r.fullName || ""}</div>
                <div className="text-xs text-muted-foreground">{r.company || ""}</div>
                <div className="text-xs break-all">{r.email || ""}</div>
                <div className="text-xs text-muted-foreground">{r.channel || ""}</div>
                <div className="text-xs truncate max-w-[240px]">{r.sourceUrl || ""}</div>
              </div>
              <input type="checkbox" checked={!!selected[i]} onChange={() => toggle(i)} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={createDealsFromSelection} disabled={Object.values(selected).filter(Boolean).length === 0}>Deals anlegen</Button>
        </div>
      </Card>
    </div>
  )
}
