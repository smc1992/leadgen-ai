"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SendEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  templateId: string
  onSuccess: () => void
}

export function SendEmailDialog({ open, onOpenChange, campaignId, templateId, onSuccess }: SendEmailDialogProps) {
  const [leads, setLeads] = useState<any[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [lists, setLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState<string>("")

  useEffect(() => {
    if (open) {
      fetchLists()
      fetchLeads()
    }
  }, [open])

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lead-lists')
      if (res.ok) {
        const data = await res.json()
        setLists(data.lists || [])
      }
    } catch (e) {
      console.error('Failed to fetch lead lists:', e)
    }
  }

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const url = selectedListId ? `/api/leads?listId=${selectedListId}` : '/api/leads'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // Filter leads with valid emails
        const validLeads = (data.leads || []).filter((lead: any) => 
          lead.email && lead.email.includes('@')
        )
        setLeads(validLeads)
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(lead => lead.id))
    }
  }

  const handleSend = async () => {
    if (selectedLeads.length === 0) return

    setSending(true)
    try {
      const response = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          templateId,
          leadIds: selectedLeads,
          sendNow: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Emails sent successfully!\nSent: ${data.sent}\nFailed: ${data.failed}`)
        onSuccess()
        onOpenChange(false)
        setSelectedLeads([])
      }
    } catch (error) {
      console.error('Failed to send emails:', error)
      alert('Failed to send emails. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Campaign Emails</DialogTitle>
          <DialogDescription>
            Select leads to send emails to. Selected: {selectedLeads.length} / {leads.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <Label className="mb-1 block">Lead-Liste</Label>
              <Select value={selectedListId} onValueChange={(val) => { setSelectedListId(val === 'all' ? '' : val); fetchLeads(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Leads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Leads</SelectItem>
                  {lists.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} {typeof l.leads_count === 'number' ? `(${l.leads_count})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedLeads.length === leads.length && leads.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select All
              </Label>
            </div>
          </div>

          <ScrollArea className="h-[400px] border rounded-md p-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads with valid email addresses found
              </div>
            ) : (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start space-x-2 p-2 hover:bg-muted/50 rounded-md"
                  >
                    <Checkbox
                      id={lead.id}
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => handleToggleLead(lead.id)}
                    />
                    <Label
                      htmlFor={lead.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{lead.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lead.email}
                        {lead.company && ` • ${lead.company}`}
                        {lead.job_title && ` • ${lead.job_title}`}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || selectedLeads.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : `Send to ${selectedLeads.length} Lead${selectedLeads.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
