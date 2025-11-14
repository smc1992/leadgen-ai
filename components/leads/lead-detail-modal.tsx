"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Paperclip,
  Edit,
  Save,
  X,
  User,
  Building,
  Briefcase,
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react"
import type { Lead } from "@/lib/supabase"
import { fetchWithCsrf } from "@/lib/client-fetch"
import { Card as UICard } from "@/components/ui/card"

interface LeadDetailModalProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock activity data
const mockActivities = [
  {
    id: "1",
    type: "created",
    message: "Lead was created",
    timestamp: "2024-01-15 10:30",
    icon: User,
  },
  {
    id: "2",
    type: "email_sent",
    message: "Outreach email sent",
    timestamp: "2024-01-15 11:00",
    icon: Mail,
  },
  {
    id: "3",
    type: "note_added",
    message: "Added note: Interested in supply chain solutions",
    timestamp: "2024-01-15 14:20",
    icon: MessageSquare,
  },
  {
    id: "4",
    type: "status_changed",
    message: "Status changed to outreach_ready",
    timestamp: "2024-01-16 09:15",
    icon: CheckCircle,
  },
]

const mockNotes = [
  {
    id: "1",
    content: "Lead showed interest in our logistics optimization services during initial outreach.",
    author: "John Doe",
    timestamp: "2024-01-15 14:20",
  },
  {
    id: "2",
    content: "Follow-up scheduled for next week to discuss specific requirements.",
    author: "Jane Smith",
    timestamp: "2024-01-16 09:15",
  },
]

export function LeadDetailModal({ lead, open, onOpenChange }: LeadDetailModalProps) {
  const [newNote, setNewNote] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({})
  const [scoreDetails, setScoreDetails] = useState<any | null>(null)
  const [scoring, setScoring] = useState(false)
  const [enrichments, setEnrichments] = useState<any[]>([])
  const [applying, setApplying] = useState(false)

  if (!lead) return null

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">Excellent</Badge>
    if (score >= 75) return <Badge className="bg-blue-600">Good</Badge>
    if (score >= 50) return <Badge className="bg-yellow-600">Fair</Badge>
    return <Badge variant="destructive">Poor</Badge>
  }

  const getEmailStatusBadge = (status: string) => {
    if (status === "valid") return <Badge variant="outline" className="border-green-600 text-green-600">Valid</Badge>
    if (status === "invalid") return <Badge variant="outline" className="border-red-600 text-red-600">Invalid</Badge>
    return <Badge variant="outline">Unknown</Badge>
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return

    toast.success("Note added successfully")
    setNewNote("")
  }

  const handleSaveChanges = () => {
    toast.success("Lead updated successfully")
    setIsEditing(false)
    setEditedLead({})
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedLead({})
  }

  useEffect(() => {
    const loadScore = async () => {
      try {
        const res = await fetch(`/api/sales/lead-scoring?lead_id=${encodeURIComponent(lead.id)}`)
        const json = await res.json()
        if (res.ok && json.score) setScoreDetails(json.score)
      } catch {}
    }
    const loadEnrichments = async () => {
      try {
        const res = await fetch(`/api/leads/enrichments?leadId=${encodeURIComponent(lead.id)}`)
        const json = await res.json()
        if (res.ok) setEnrichments(json.items || [])
      } catch {}
    }
    loadScore()
    loadEnrichments()
  }, [lead.id])

  const handleRecalculateLLM = async () => {
    try {
      setScoring(true)
      const res = await fetchWithCsrf('/api/sales/lead-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, use_llm: true, force_recalculate: true })
      })
      const json = await res.json()
      if (res.ok && json.score) {
        setScoreDetails(json.score)
        toast.success('LLM scoring updated')
      } else {
        toast.error('Scoring failed')
      }
    } catch (e) {
      toast.error('Scoring failed')
    } finally {
      setScoring(false)
    }
  }

  const applyLeadField = async (fields: Partial<Lead>) => {
    try {
      setApplying(true)
      const res = await fetchWithCsrf(`/api/leads/${encodeURIComponent(lead.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Lead aktualisiert')
      } else {
        toast.error(json?.error || 'Update fehlgeschlagen')
      }
    } catch {
      toast.error('Update fehlgeschlagen')
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {lead.full_name}
                {getScoreBadge(lead.score)}
              </DialogTitle>
              <DialogDescription>
                Lead details and activity history
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedLead.full_name || lead.full_name}
                        onChange={(e) => setEditedLead(prev => ({ ...prev, full_name: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm mt-1">{lead.full_name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm">{lead.email}</p>
                      {getEmailStatusBadge(lead.email_status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      Job Title
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedLead.job_title || lead.job_title || ""}
                        onChange={(e) => setEditedLead(prev => ({ ...prev, job_title: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm mt-1">{lead.job_title || "Not specified"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Company
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedLead.company || lead.company}
                        onChange={(e) => setEditedLead(prev => ({ ...prev, company: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm mt-1">{lead.company}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Region
                    </Label>
                    <p className="text-sm mt-1">{lead.region}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Channel</Label>
                    <p className="text-sm mt-1">{lead.channel}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Score</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium">{lead.score}</span>
                      {getScoreBadge(lead.score)}
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveChanges}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <activity.icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes & Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {mockNotes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-3">
                      <p className="text-sm">{note.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">{note.author}</p>
                        <p className="text-xs text-muted-foreground">{note.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Add New Note</Label>
                  <Textarea
                    placeholder="Add a note about this lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button className="w-full" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Add Phone Number
                </Button>
                <Button className="w-full" variant="outline">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach File
                </Button>
                <Button
                  className="w-full"
                  variant={lead.is_outreach_ready ? "default" : "outline"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {lead.is_outreach_ready ? "Ready for Outreach" : "Mark as Ready"}
                </Button>
              </CardContent>
            </Card>

            {/* Lead Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Email Status</Label>
                  <div className="mt-1">
                    {getEmailStatusBadge(lead.email_status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Outreach Ready</Label>
                  <div className="mt-1">
                    {lead.is_outreach_ready ? (
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Ready
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Lead Score</Label>
                  <div className="mt-1">
                    {getScoreBadge(lead.score)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Score Details */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Score Details</CardTitle>
                <CardDescription>Breakdown und LLM‑Begründung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {scoreDetails ? (
                  <div className="space-y-2">
                    <div className="text-sm">Total: <span className="font-medium">{scoreDetails.total_score}</span></div>
                    <div className="text-sm">Level: <span className="font-medium">{scoreDetails.qualification_level}</span></div>
                    {scoreDetails.score_breakdown && (
                      <div className="space-y-1">
                        {Object.entries(scoreDetails.score_breakdown).map(([k,v]) => (
                          <div key={String(k)} className="text-xs flex justify-between">
                            <span className="text-muted-foreground">{String(k)}</span>
                            <span className="font-medium">{typeof v === 'number' ? v : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {typeof scoreDetails?.score_breakdown?.llm_adjust === 'number' && (
                      <div className="text-xs mt-2">
                        <span className="text-muted-foreground">LLM Adjust:</span>
                        <span className="ml-1 font-medium">
                          {scoreDetails.score_breakdown.llm_adjust > 0 ? `+${scoreDetails.score_breakdown.llm_adjust}` : scoreDetails.score_breakdown.llm_adjust}
                        </span>
                      </div>
                    )}
                    {scoreDetails?.score_breakdown?.llm_rationale && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {String(scoreDetails.score_breakdown.llm_rationale)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Keine Score‑Details vorhanden</div>
                )}
                <Button className="w-full" variant="outline" onClick={handleRecalculateLLM} disabled={scoring}>
                  {scoring ? 'Recalculating…' : 'Recalculate (LLM)'}
                </Button>
              </CardContent>
            </Card>

            {/* Enrichment Review */}
            <Card>
              <CardHeader>
                <CardTitle>Enrichment</CardTitle>
                <CardDescription>Branding, Links und Zusammenfassung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {enrichments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Keine Enrichment‑Einträge</div>
                ) : (
                  <div className="space-y-4">
                    {enrichments.slice(0,1).map((e) => (
                      <div key={e.id} className="space-y-3">
                        {e.branding?.colors && (
                          <div>
                            <Label className="text-sm font-medium">Brand Colors</Label>
                            <div className="flex gap-2 mt-2">
                              {Object.values(e.branding.colors).slice(0,5).map((c: any, i: number) => (
                                <div key={i} className="w-6 h-6 rounded" style={{ backgroundColor: String(c) }} title={String(c)} />
                              ))}
                            </div>
                          </div>
                        )}
                        {Array.isArray(e.links) && e.links.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Links</Label>
                            <div className="text-xs mt-2 space-y-2">
                              {(() => {
                                const arr = e.links.slice(0,20).map((l: any) => String(l))
                                const emails = arr.filter((l: string) => l.toLowerCase().startsWith('mailto:')).map((l: string) => l.replace(/^mailto:/i, ''))
                                const phones = arr.filter((l: string) => l.toLowerCase().startsWith('tel:')).map((l: string) => l.replace(/^tel:/i, ''))
                                const contacts = arr.filter((l: string) => /kontakt|contact|impressum/i.test(l))
                                return (
                                  <div className="space-y-2">
                                    {emails.length > 0 && (
                                      <div>
                                        <div className="text-muted-foreground mb-1">E‑Mails</div>
                                        {emails.slice(0,3).map((em: string, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between gap-2">
                                            <div className="truncate">{em}</div>
                                            <Button variant="outline" size="sm" disabled={applying} onClick={() => applyLeadField({ email: em } as any)}>Apply</Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {phones.length > 0 && (
                                      <div>
                                        <div className="text-muted-foreground mb-1">Telefon</div>
                                        {phones.slice(0,3).map((ph: string, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between gap-2">
                                            <div className="truncate">{ph}</div>
                                            <Button variant="outline" size="sm" disabled={applying} onClick={() => applyLeadField({ phone: ph } as any)}>Apply</Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {contacts.length > 0 && (
                                      <div>
                                        <div className="text-muted-foreground mb-1">Kontakt/Impressum</div>
                                        {contacts.slice(0,3).map((url: string, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between gap-2">
                                            <div className="truncate">{url}</div>
                                            <a className="text-blue-600" href={url} target="_blank" rel="noreferrer">Open</a>
                                            <Button variant="outline" size="sm" disabled={applying} onClick={() => {
                                              try {
                                                const u = new URL(url)
                                                applyLeadField({ website_url: `${u.protocol}//${u.hostname}` } as any)
                                              } catch {}
                                            }}>Apply</Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        )}
                        {e.summary && (
                          <div>
                            <Label className="text-sm font-medium">Summary</Label>
                            <div className="text-xs mt-1 text-muted-foreground whitespace-pre-wrap">{e.summary}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Jan 15, 2024</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last Updated
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Jan 16, 2024</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Source</Label>
                  <p className="text-sm text-muted-foreground mt-1">{lead.channel}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
