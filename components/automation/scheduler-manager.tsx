"use client"
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export default function SchedulerManager() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState('workflow')
  const [workflowId, setWorkflowId] = useState('')
  const [intervalMinutes, setIntervalMinutes] = useState(60)
  const [active, setActive] = useState(true)
  const [workflows, setWorkflows] = useState<any[]>([])

  const load = async () => {
    const res = await fetch('/api/automation/schedules')
    const json = await res.json()
    setSchedules(json.schedules || [])
    const wf = await fetch('/api/automation/workflows')
    const wfJson = await wf.json().catch(() => ({ workflows: [] }))
    setWorkflows(wfJson.workflows || [])
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    const res = await fetchWithCsrf('/api/automation/schedules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, workflow_id: type === 'workflow' ? workflowId || null : null, interval_minutes: intervalMinutes, active })
    })
    if (res.ok) { setName(''); setWorkflowId(''); setIntervalMinutes(60); setActive(true); await load() }
  }

  const update = async (s: any, patch: any) => {
    const res = await fetchWithCsrf('/api/automation/schedules', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, ...patch })
    })
    if (res.ok) await load()
  }

  const remove = async (id: string) => {
    const res = await fetchWithCsrf(`/api/automation/schedules?id=${id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="font-medium">Neuen Scheduler anlegen</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Typ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="outreach_queue">Outreach Queue</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Intervall (Minuten)" value={intervalMinutes} onChange={e => setIntervalMinutes(parseInt(e.target.value || '0'))} />
        </div>
        {type === 'workflow' && (
          <Select value={workflowId} onValueChange={setWorkflowId}>
            <SelectTrigger><SelectValue placeholder="Workflow auswählen" /></SelectTrigger>
            <SelectContent>
              {workflows.map((wf: any) => (
                <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} />
          <span>Aktiv</span>
        </div>
        <Button onClick={create}>Anlegen</Button>
      </Card>
      <Card className="p-4">
        <div className="font-medium mb-2">Scheduler</div>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
              <div>{s.name}</div>
              <div>{s.type}</div>
              <Input type="number" value={s.interval_minutes || 60} onChange={e => update(s, { interval_minutes: parseInt(e.target.value || '0') })} />
              <div className="flex items-center gap-2">
                <Switch checked={s.active} onCheckedChange={(v) => update(s, { active: v })} />
                <span>Aktiv</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => remove(s.id)}>Löschen</Button>
                <Button variant="outline" onClick={() => update(s, { last_run_at: null })}>Zurücksetzen</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
import { fetchWithCsrf } from '@/lib/client-fetch'
