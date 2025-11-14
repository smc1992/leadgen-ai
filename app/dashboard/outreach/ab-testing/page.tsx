"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { FlaskConical, Trophy, Activity, MousePointerClick, Mail, Users, RefreshCw } from "lucide-react"
import { fetchWithCsrf } from '@/lib/client-fetch'

export default function ABTestingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [metric, setMetric] = useState("open_rate")

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/intelligence/ab-testing')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : [])
      }
    } catch (e) {
      toast.error('A/B-Kampagnen konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  const fetchResults = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/intelligence/ab-testing?campaign_id=${encodeURIComponent(campaignId)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(Array.isArray(data.results) ? data.results : [])
      }
    } catch (e) {
      toast.error('Testergebnisse konnten nicht geladen werden')
    }
  }

  useEffect(() => { fetchCampaigns() }, [])

  const selectCampaign = (c: any) => {
    setSelectedCampaign(c)
    fetchResults(c.id)
  }

  const calcRate = (row: any, key: string): number => {
    const v = Number(row?.[key] || 0)
    return isNaN(v) ? 0 : v
  }

  const determineWinner = async () => {
    try {
      if (!selectedCampaign) return
      if (results.length < 2) {
        toast.error('Mindestens zwei Varianten erforderlich')
        return
      }
      const best = results.reduce((acc, r) => {
        const val = Number(r?.[metric] || 0)
        const bestVal = Number(acc?.[metric] || 0)
        return val > bestVal ? r : acc
      })
      if (!best) {
        toast.error('Kein Gewinner bestimmbar')
        return
      }
      const body = {
        id: selectedCampaign.id,
        status: 'completed',
        winner_variant_id: best.variant_id
      }
      const res = await fetchWithCsrf('/api/intelligence/ab-testing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Gewinner konnte nicht gesetzt werden')
      }
      toast.success(`Gewinner: Variante ${best.variant_id}`)
      await fetchCampaigns()
      await fetchResults(selectedCampaign.id)
    } catch (e: any) {
      toast.error(e?.message || 'Unbekannter Fehler bei Gewinner-Ermittlung')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground">Erstelle und analysiere A/B-Tests für Outreach-Kampagnen</p>
        </div>
        <div className="flex gap-2">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open_rate">Open Rate</SelectItem>
              <SelectItem value="click_rate">Click Rate</SelectItem>
              <SelectItem value="reply_rate">Reply Rate</SelectItem>
              <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchCampaigns} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests insgesamt</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnitt {metric.replace('_',' ')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{
              (() => {
                const vals = results.map(r => calcRate(r, metric))
                const avg = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0
                return `${avg.toFixed(1)}%`
              })()
            }</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gewinner bestimmt</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.filter(r => r.is_winner).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Varianten ausgewertet</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns list */}
      <Card>
        <CardHeader>
          <CardTitle>A/B-Kampagnen</CardTitle>
          <CardDescription>Wähle eine Kampagne, um Test-Ergebnisse zu sehen</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade Kampagnen...</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <Card key={c.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => selectCampaign(c)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">{(c.status || 'draft')}</Badge>
                      {c.winner_variant_id && <Badge className="bg-amber-100 text-amber-800"><Trophy className="h-3 w-3 mr-1" /> Gewinner: {c.winner_variant_id}</Badge>}
                    </div>
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <CardDescription>{c.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium flex items-center gap-1"><Mail className="h-3 w-3" /> Sample</span>
                          <span className="text-xs font-bold">{c.sample_size || 0}</span>
                        </div>
                        <Progress value={Math.min(100, (c.sample_size || 0) / (c.sample_size || 1) * 100)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium flex items-center gap-1"><Activity className="h-3 w-3" /> Confidence</span>
                          <span className="text-xs font-bold">{((c.confidence_level || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={(c.confidence_level || 0) * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results table */}
      {selectedCampaign && (
        <Card>
          <CardHeader>
            <CardTitle>Testergebnisse – {selectedCampaign.name}</CardTitle>
            <CardDescription>Variantenvergleich nach {metric.replace('_',' ')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-3">
              <Button onClick={determineWinner}>
                <Trophy className="h-4 w-4 mr-2" /> Gewinner ermitteln
              </Button>
            </div>
            {results.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">Keine Ergebnisse vorhanden</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variante</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Replies</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>Reply Rate</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>Winner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={`${r.test_id}-${r.variant_id}`}>
                      <TableCell>{r.variant_name || r.variant_id}</TableCell>
                      <TableCell>{r.opens || 0}</TableCell>
                      <TableCell>{r.clicks || 0}</TableCell>
                      <TableCell>{r.replies || 0}</TableCell>
                      <TableCell>{r.conversions || 0}</TableCell>
                      <TableCell>{(r.open_rate || 0).toFixed ? (r.open_rate as number).toFixed(1) + '%' : `${r.open_rate || 0}%`}</TableCell>
                      <TableCell>{(r.click_rate || 0).toFixed ? (r.click_rate as number).toFixed(1) + '%' : `${r.click_rate || 0}%`}</TableCell>
                      <TableCell>{(r.reply_rate || 0).toFixed ? (r.reply_rate as number).toFixed(1) + '%' : `${r.reply_rate || 0}%`}</TableCell>
                      <TableCell>{(r.conversion_rate || 0).toFixed ? (r.conversion_rate as number).toFixed(1) + '%' : `${r.conversion_rate || 0}%`}</TableCell>
                      <TableCell>{r.is_winner ? <Badge className="bg-green-100 text-green-800">Winner</Badge> : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
