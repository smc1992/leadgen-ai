"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { MapPin, Play, Loader2, Upload } from "lucide-react"

interface ScrapedLead {
  fullName: string
  jobTitle: string
  company: string
  email?: string
  contactEmails?: string[]
  contactPhones?: string[]
  socialProfiles?: {
    twitter?: string[]
    facebook?: string[]
    instagram?: string[]
    linkedin?: string[]
    tiktok?: string[]
    youtube?: string[]
  }
  leadsCount?: number
  leads?: Array<{
    fullName?: string
    workEmail?: string
    jobTitle?: string
    linkedin?: string
  }>
  region?: string
  channel: string
  sourceUrl: string
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
}

interface Props {
  onImported?: (count: number) => void
}

export function ScrapeGoogleMapsDialog({ onImported }: Props) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [limit, setLimit] = useState(100)
  const [listName, setListName] = useState("")
  const [withWebsiteOnly, setWithWebsiteOnly] = useState(false)
  const [enableContacts, setEnableContacts] = useState(false)
  const [autoImport, setAutoImport] = useState(true)
  const [onlyNew, setOnlyNew] = useState(false)
  const [maxLeads, setMaxLeads] = useState<number>(0)
  const [runId, setRunId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'running' | 'succeeded' | 'failed'>('idle')
  const [results, setResults] = useState<ScrapedLead[]>([])
  const [duplicateFlags, setDuplicateFlags] = useState<boolean[]>([])
  const [duplicatesChecked, setDuplicatesChecked] = useState(false)
  const [polling, setPolling] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (polling && runId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/scrape?runId=${runId}&enrichContacts=${enableContacts ? 'true' : 'false'}`)
          const data = await res.json()
          setStatus(data.status === 'succeeded' ? 'succeeded' : data.status === 'failed' ? 'failed' : 'running')
          if (Array.isArray(data.results)) {
            setResults(data.results)
          }
          if (data.status === 'succeeded' || data.status === 'failed') {
            setPolling(false)
          }
        } catch (e) {
          setPolling(false)
          toast.error("Fehler beim Statusabruf des Scrapers")
        }
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [polling, runId])

  // Auto-Import nach erfolgreichem Scrape
  useEffect(() => {
    if (status === 'succeeded' && autoImport && results.length > 0 && !importing) {
      toast.info('Import wird automatisch gestartet …')
      importResults()
    }
  }, [status, autoImport, results])


  // Wenn „Nur neue Leads importieren“ aktiv ist, prüfe Duplikate gegen bestehende Leads
  useEffect(() => {
    const runDuplicateCheck = async () => {
      if (!onlyNew || status !== 'succeeded' || results.length === 0) return
      try {
        const res = await fetch(`/api/leads?limit=5000&page=1`)
        if (!res.ok) return
        const data = await res.json()
        const existing: any[] = Array.isArray(data?.leads) ? data.leads : []

        const normalizeWebsite = (url?: string) => {
          const raw = (url || '').trim()
          if (!raw) return ''
          try {
            const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
            return (u.hostname + u.pathname).replace(/\/+$/,'').toLowerCase()
          } catch {
            return raw.replace(/\/+$/,'').toLowerCase()
          }
        }

        const websiteSet = new Set<string>()
        for (const e of existing) {
          const w = normalizeWebsite(e?.website_url || e?.source_url)
          if (w) websiteSet.add(w)
        }

        const flags = results.map(r => {
          const w = normalizeWebsite(r.websiteUrl || r.sourceUrl)
          return w ? websiteSet.has(w) : false
        })
        setDuplicateFlags(flags)
        setDuplicatesChecked(true)
      } catch (e) {
        setDuplicateFlags([])
        setDuplicatesChecked(false)
      }
    }
    runDuplicateCheck()
  }, [onlyNew, status, results])

  const startScrape = async () => {
    if (!searchQuery || !location) {
      toast.error("Bitte Suchbegriff und Ort angeben")
      return
    }
    try {
      setStatus('running')
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'maps',
          params: { 
            searchQuery, 
            limit, 
            location,
            withWebsiteOnly,
            maxLeads,
            // contacts enrichment toggle passed for future backend use; may be ignored if unsupported
            contactsEnrichment: enableContacts
          }
        })
      })
      if (!res.ok) {
        let details: any = null
        try { details = await res.json() } catch {}
        setStatus('failed')
        if (details?.error) {
          const code = typeof details?.apifyStatus === 'number' ? ` (Upstream ${details.apifyStatus})` : ''
          const msg = details?.apifyMessage ? ` – ${String(details.apifyMessage).slice(0, 160)}` : ''
          toast.error(`Scrape fehlgeschlagen: ${details.error}${code}${msg}`)
        } else {
          toast.error('Scrape konnte nicht gestartet werden')
        }
        return
      }
      const data = await res.json()
      setRunId(data.runId)
      setPolling(true)
      toast.success("Scrape gestartet – Ergebnisse werden geladen")
    } catch (e) {
      setStatus('failed')
      toast.error("Scrape konnte nicht gestartet werden")
    }
  }

  const importResults = async () => {
    if (results.length === 0) {
      toast.error("Keine Ergebnisse zum Importieren")
      return
    }
    try {
      setImporting(true)
      const filteredResults = onlyNew && duplicatesChecked && duplicateFlags.length === results.length
        ? results.filter((_r, idx) => !duplicateFlags[idx])
        : results

      const leadsPayload = filteredResults.map(r => ({
        full_name: r.fullName || '',
        job_title: r.jobTitle || '',
        company: r.company || '',
        email: r.email || (Array.isArray(r.contactEmails) ? r.contactEmails[0] || '' : ''),
        region: r.country || r.region || '',
        channel: 'maps',
        source_url: r.sourceUrl || '',
        phone: r.phone || '',
        website_url: r.websiteUrl || '',
        address: r.address || '',
        city: r.city || '',
        country: r.country || '',
        postal_code: r.postalCode || '',
        lat: typeof r.lat === 'number' ? r.lat : undefined,
        lng: typeof r.lng === 'number' ? r.lng : undefined,
        rating_avg: typeof r.ratingAvg === 'number' ? r.ratingAvg : undefined,
        rating_count: typeof r.ratingCount === 'number' ? r.ratingCount : undefined,
        categories: Array.isArray(r.categories) ? r.categories : undefined,
      }))
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: leadsPayload, listName: listName || undefined })
      })
      if (!res.ok) {
        let details: any = null
        try { details = await res.json() } catch {}
        const code = res.status
        let msg = details?.error ? String(details.error) : 'Import fehlgeschlagen'
        if (code === 401) msg = 'Nicht angemeldet. Bitte zuerst einloggen.'
        if (code === 503 && /Supabase/i.test(String(msg))) msg = 'Supabase nicht konfiguriert. Prüfe ENV: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY.'
        toast.error(`${msg} (Status ${code})`)
        return
      }
      const data = await res.json()
      const importedCount = (data.imported ?? (data.leads?.length ?? leadsPayload.length))
      const originalCount = results.length
      const skippedEstimated = onlyNew ? duplicateFlags.filter(Boolean).length : Math.max(0, originalCount - importedCount)
      toast.success(`Importiert: ${importedCount}, übersprungen: ${skippedEstimated}`)
      setOpen(false)
      setRunId(null)
      setResults([])
      setDuplicateFlags([])
      setDuplicatesChecked(false)
      setStatus('idle')
      if (onImported) onImported(importedCount)
    } catch (e) {
      toast.error("Import fehlgeschlagen")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <MapPin className="h-4 w-4 mr-2" />
          Leads von Google Maps scrapen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Google Maps Scraper</DialogTitle>
          <DialogDescription>
            Suche nach relevanten Unternehmen und importiere die Ergebnisse direkt in deine Leads.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Suchbegriff</Label>
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="z.B. Spedition, Logistik" />
            </div>
            <div>
              <Label>Ort</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z.B. München, Deutschland" />
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="onlyNew" checked={onlyNew} onCheckedChange={(v) => setOnlyNew(Boolean(v))} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="onlyNew">Nur neue Leads importieren</Label>
                <p className="text-xs text-muted-foreground">Kennzeichnet vorhandene Einträge und importiert nur neue.</p>
              </div>
            </div>
          </div>
          <div>
            <Label>Liste erstellen (optional)</Label>
            <Input value={listName} onChange={(e) => setListName(e.target.value)} placeholder="z.B. Heizungsbauer München Okt 2025" />
          </div>
          <div>
            <Label>Anzahl Orte</Label>
            <Input type="number" min={1} max={1000} value={limit} onChange={(e) => setLimit(parseInt(e.target.value || '100'))} />
          </div>

          {/* Erweiterungen */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={withWebsiteOnly}
                onCheckedChange={(v) => setWithWebsiteOnly(Boolean(v))}
                id="withWebsiteOnly"
              />
              <div className="space-y-0.5">
                <Label htmlFor="withWebsiteOnly">Nur Orte mit Website</Label>
                <div className="text-xs text-muted-foreground">Optimiert Kosten und benötigt für Leads-Enrichment</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={enableContacts}
                onCheckedChange={(v) => setEnableContacts(Boolean(v))}
                id="enableContacts"
              />
              <div className="space-y-0.5">
                <Label htmlFor="enableContacts">Kontakte anreichern (E-Mail, Socials)</Label>
                <div className="text-xs text-muted-foreground">Zusatzkosten je Ergebnis; zieht E-Mail/Telefon/Socials von der Website</div>
              </div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4 items-end">
              <div>
                <Label>Leads pro Ort (Business Leads)</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={maxLeads}
                  onChange={(e) => setMaxLeads(parseInt(e.target.value || '0'))}
                  placeholder="z.B. 3"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Preis je erfolgreich gefundenem Lead ab $0.005. Hohe Werte erhöhen Kosten linear.
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="onlyNew" checked={onlyNew} onCheckedChange={(v) => setOnlyNew(Boolean(v))} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="onlyNew">Nur neue Leads importieren</Label>
                <p className="text-xs text-muted-foreground">Kennzeichnet vorhandene Einträge und importiert nur neue.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={startScrape} disabled={status === 'running'}>
              {status === 'running' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              {status === 'running' ? 'Scraper läuft...' : 'Scrape starten'}
            </Button>
            {status === 'succeeded' && (
              <Button variant="secondary" onClick={importResults} disabled={importing}>
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importiere…' : 'Ergebnisse importieren'}
              </Button>
            )}
        </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="text-sm">
              {status === 'idle' && 'Bereit'}
              {status === 'running' && 'Läuft...'}
              {status === 'succeeded' && `Fertig – ${results.length} Ergebnisse`}
              {status === 'failed' && 'Fehlgeschlagen'}
            </div>
            <Progress value={status === 'running' ? 50 : status === 'succeeded' ? 100 : status === 'failed' ? 0 : 0} />
          </div>

          {/* Optionen */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <Checkbox id="autoImport" checked={autoImport} onCheckedChange={(v) => setAutoImport(Boolean(v))} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="autoImport">Automatisch importieren</Label>
                <p className="text-xs text-muted-foreground">Import startet automatisch nach erfolgreichem Scrape.</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="onlyNew" checked={onlyNew} onCheckedChange={(v) => setOnlyNew(Boolean(v))} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="onlyNew">Nur neue Leads importieren</Label>
                <p className="text-xs text-muted-foreground">Kennzeichnet vorhandene Einträge und importiert nur neue.</p>
              </div>
            </div>
          </div>

          {status === 'succeeded' && results.length > 0 && (
            <div className="space-y-2">
              <Label>Vorschau (Top-Ergebnisse)</Label>
              <div className="rounded border">
                <div className="grid grid-cols-9 gap-2 p-2 text-xs font-medium bg-muted">
                  <div>Firma</div>
                  <div>Website</div>
                  <div>Telefon</div>
                  <div>Ort</div>
                  <div>Bewertung</div>
                  <div>Reviews</div>
                  <div>Emails</div>
                  <div>Socials</div>
                  <div>Leads</div>
                </div>
                <div className="max-h-64 overflow-auto">
                  {results.slice(0, 25).map((r, idx) => (
                    <div key={idx} className="grid grid-cols-9 gap-2 p-2 border-t text-xs">
                      <div className="truncate" title={r.company}>{r.company || '-'}{onlyNew && duplicatesChecked && duplicateFlags[idx] ? ( <Badge variant="outline" className="ml-2">Schon vorhanden</Badge> ) : null}</div>
                      <div className="truncate" title={r.websiteUrl || r.sourceUrl}>{r.websiteUrl || r.sourceUrl || '-'}</div>
                      <div className="truncate" title={r.phone}>{r.phone || '-'}</div>
                      <div className="truncate" title={`${r.city || ''} ${r.country || ''}`.trim()}>
                        {r.city || r.country ? `${r.city || ''}${r.city && r.country ? ', ' : ''}${r.country || ''}` : '-'}
                      </div>
                      <div>{typeof r.ratingAvg === 'number' ? r.ratingAvg.toFixed(1) : '-'}</div>
                      <div>{typeof r.ratingCount === 'number' ? r.ratingCount : '-'}</div>
                      <div className="truncate" title={(r.contactEmails || []).join(', ')}>
                        {Array.isArray(r.contactEmails) && r.contactEmails.length > 0 ? r.contactEmails.slice(0, 2).join(', ') : '-'}
                      </div>
                      <div className="truncate" title={(() => {
                        const socials = r.socialProfiles ? Object.values(r.socialProfiles).flat() : []
                        return socials.join(', ')
                      })()}>
                        {(() => {
                          const socials = r.socialProfiles ? Object.values(r.socialProfiles).flat() : []
                          return socials.length > 0 ? socials.slice(0, 2).join(', ') : '-'
                        })()}
                      </div>
                      <div>
                        {typeof r.leadsCount === 'number' ? r.leadsCount : Array.isArray(r.leads) ? r.leads.length : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}