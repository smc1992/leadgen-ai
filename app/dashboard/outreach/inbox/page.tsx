"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

export default function OutreachInboxPage() {
  const [items, setItems] = useState<any[]>([])
  const [status, setStatus] = useState<string>("all")
  const [classifyBody, setClassifyBody] = useState<string>("")
  const [selected, setSelected] = useState<any | null>(null)

  const load = async () => {
    const qs = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`
    const res = await fetch(`/api/outreach/inbox${qs}`)
    const json = await res.json()
    if (res.ok) setItems(json.items || [])
  }

  useEffect(() => { load() }, [status])

  const handleUnsubscribe = async (item: any) => {
    const res = await fetch('/api/outreach/unsubscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: item.lead_email, campaignId: item.campaign_id, leadId: item.lead_id, reason: 'inbox' })
    })
    if (res.ok) { toast.success('Unsubscribed'); load() } else { toast.error('Unsubscribe failed') }
  }

  const handleClassify = async () => {
    if (!selected) { toast.error('Select an item'); return }
    const res = await fetch('/api/outreach/replies', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: selected.campaign_id, leadId: selected.lead_id, leadEmail: selected.lead_email, message: classifyBody })
    })
    const json = await res.json()
    if (res.ok) { toast.success(`Classified: ${json.classification?.status || 'updated'}`); setClassifyBody(''); load() } else { toast.error('Classification failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outreach Inbox</h1>
          <p className="text-muted-foreground">Übersicht über Antworten, Bounces und Abmeldungen</p>
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="out_of_office">Out of Office</SelectItem>
              <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={load}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox Items</CardTitle>
          <CardDescription>Letzte Outreach‑Ereignisse</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id} onClick={() => setSelected(it)} className={selected?.id===it.id? 'bg-muted/30' : ''}>
                  <TableCell>{it.lead_name || it.lead_id}</TableCell>
                  <TableCell>{it.lead_email}</TableCell>
                  <TableCell className="truncate max-w-[240px]">{it.subject}</TableCell>
                  <TableCell>{it.status}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" onClick={() => handleUnsubscribe(it)}>Unsubscribe</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reply klassifizieren</CardTitle>
          <CardDescription>Antworttext einfügen und klassifizieren</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Lead Email" value={selected?.lead_email || ''} readOnly />
          <Textarea value={classifyBody} onChange={(e)=>setClassifyBody(e.target.value)} rows={6} placeholder="Antworttext" />
          <Button onClick={handleClassify} disabled={!selected || !classifyBody}>Classify</Button>
        </CardContent>
      </Card>
    </div>
  )
}
