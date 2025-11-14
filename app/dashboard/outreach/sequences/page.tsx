"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Clock, Plus, Edit, Trash2, Play, Pause, Copy, Mail, Calendar, Users, BarChart3, Activity } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

// Mock sequences data
const mockSequences = [
  {
    id: "1",
    name: "Logistics Lead Nurturing",
    description: "5-step sequence for logistics leads",
    status: "active",
    steps: [
      {
        id: "1",
        name: "Initial Introduction",
        type: "email",
        template: "Logistics Introduction",
        delay: 0,
        delayUnit: "immediate"
      },
      {
        id: "2", 
        name: "Follow-up Email",
        type: "email",
        template: "Follow-up Template",
        delay: 3,
        delayUnit: "days"
      },
      {
        id: "3",
        name: "Case Study Share",
        type: "email",
        template: "Value Proposition",
        delay: 2,
        delayUnit: "days"
      },
      {
        id: "4",
        name: "Meeting Request",
        type: "email",
        template: "Meeting Confirmation",
        delay: 3,
        delayUnit: "days"
      },
      {
        id: "5",
        name: "Final Follow-up",
        type: "email",
        template: "Last Attempt",
        delay: 5,
        delayUnit: "days"
      }
    ],
    enrolledLeads: 127,
    completionRate: 68.5,
    createdAt: "2024-01-10"
  },
  {
    id: "2",
    name: "European Transport Sequence",
    description: "3-step sequence for European market",
    status: "draft",
    steps: [
      {
        id: "1",
        name: "European Market Intro",
        type: "email",
        template: "European Logistics",
        delay: 0,
        delayUnit: "immediate"
      },
      {
        id: "2",
        name: "Regulatory Compliance",
        type: "email",
        template: "Compliance Focus",
        delay: 2,
        delayUnit: "days"
      },
      {
        id: "3",
        name: "Partnership Proposal",
        type: "email",
        template: "Partnership Offer",
        delay: 4,
        delayUnit: "days"
      }
    ],
    enrolledLeads: 0,
    completionRate: 0,
    createdAt: "2024-01-15"
  }
]

export default function SequencesPage() {
  const [sequences, setSequences] = useState<any[]>(mockSequences)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSequence, setSelectedSequence] = useState<any>(null)
  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
    status: "draft"
  })
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Record<string, { sent: number; opened: number; clicked: number }>>({})

  useEffect(() => {
    const fetchSequences = async () => {
      try {
        const res = await fetch('/api/outreach/sequences')
        if (res.ok) {
          const data = await res.json()
          setSequences(Array.isArray(data.sequences) ? data.sequences : [])
        }
        const ra = await fetch('/api/outreach/sequences/analytics')
        if (ra.ok) {
          const data = await ra.json()
          setAnalytics(data.byTemplate || {})
        }
      } catch (e) {
        // keep mock
      } finally {
        setLoading(false)
      }
    }
    fetchSequences()
  }, [])

  const handleCreateSequence = () => {
    if (!newSequence.name) {
      toast.error("Please enter a sequence name")
      return
    }

    const sequence = {
      id: Date.now().toString(),
      ...newSequence,
      steps: [],
      enrolledLeads: 0,
      completionRate: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }

    setSequences([sequence, ...sequences])
    setNewSequence({ name: "", description: "", status: "draft" })
    setIsCreateDialogOpen(false)
    toast.success("Sequence created successfully!")
  }

  const handleToggleSequence = (id: string) => {
    const updatedSequences = sequences.map(s => 
      s.id === id 
        ? { ...s, status: s.status === "active" ? "paused" : "active" }
        : s
    )
    setSequences(updatedSequences)
    toast.success(`Sequence ${updatedSequences.find(s => s.id === id)?.status === "active" ? "activated" : "paused"}!`)
  }

  const handleDuplicateSequence = (sequence: any) => {
    const duplicated = {
      ...sequence,
      id: Date.now().toString(),
      name: `${sequence.name} (Copy)`,
      enrolledLeads: 0,
      completionRate: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setSequences([duplicated, ...sequences])
    toast.success("Sequence duplicated successfully!")
  }

  const handleDeleteSequence = (id: string) => {
    setSequences(sequences.filter(s => s.id !== id))
    toast.success("Sequence deleted successfully!")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      case "draft": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-3 w-3" />
      case "paused": return <Pause className="h-3 w-3" />
      case "draft": return <Clock className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Sequences</h1>
          <p className="text-muted-foreground">
            Create automated email sequences for lead nurturing
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Sequence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Email Sequence</DialogTitle>
              <DialogDescription>
                Set up a new automated email sequence
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seq-name">Sequence Name</Label>
                <Input
                  id="seq-name"
                  placeholder="e.g., Logistics Lead Nurturing"
                  value={newSequence.name}
                  onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seq-description">Description</Label>
                <Textarea
                  id="seq-description"
                  placeholder="Describe the purpose of this sequence..."
                  rows={3}
                  value={newSequence.description}
                  onChange={(e) => setNewSequence({ ...newSequence, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSequence}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sequence
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sequences</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sequences.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Leads</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sequences.reduce((acc, s: any) => acc + (s.enrolled_leads ?? s.enrolledLeads ?? 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const vals = sequences.map((s: any) => s.completion_rate ?? s.completionRate ?? 0)
                const avg = vals.length ? vals.reduce((a: number,b: number)=>a+b,0) / vals.length : 0
                return `${avg.toFixed(1)}%`
              })()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active vs Paused</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              Active: {sequences.filter((s: any) => (s.status || '').toLowerCase() === 'active').length}
              <span className="mx-2">|</span>
              Paused: {sequences.filter((s: any) => (s.status || '').toLowerCase() === 'paused').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading sequences...</div>
      ) : (
      <div className="grid gap-6">
        {sequences.map((sequence: any) => (
          <Card key={sequence.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{sequence.name}</CardTitle>
                    <Badge className={getStatusColor(sequence.status)}>
                      {getStatusIcon(sequence.status)}
                      {sequence.status}
                    </Badge>
                  </div>
                  <CardDescription>{sequence.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDuplicateSequence(sequence)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedSequence(sequence)
                    setIsEditDialogOpen(true)
                  }}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteSequence(sequence.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleSequence(sequence.id)}>
                    {sequence.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sequence Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Enrolled:</span>
                      <div className="font-medium">{sequence.enrolled_leads ?? sequence.enrolledLeads ?? 0} leads</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Completion:</span>
                      <div className="font-medium">{(sequence.completion_rate ?? sequence.completionRate ?? 0)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <div className="font-medium">{sequence.createdAt || new Date().toISOString().split('T')[0]}</div>
                    </div>
                  </div>
                </div>

                {/* Sequence Steps */}
                <div>
                  <Label className="text-sm font-medium">Sequence Steps ({sequence.steps.length})</Label>
                  <div className="mt-2 space-y-2">
                    {(sequence.steps || []).map((step: any, index: number) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Template: {step.template} • 
                            {step.delay === 0 ? " Send immediately" : ` Send after ${step.delay} ${step.delayUnit}`}
                          </div>
                        </div>
                        <Badge variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          {step.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template Metrics (aggregated) */}
                <div>
                  <Label className="text-sm font-medium">Template Metrics</Label>
                  <div className="mt-2 grid md:grid-cols-2 gap-3">
                    {Object.entries(analytics).slice(0,4).map(([tid, m]) => (
                      <div key={tid} className="rounded border p-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Template</span>
                          <span className="font-medium">{tid}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <span className="text-muted-foreground">Sent</span>
                            <div className="font-medium">{m.sent}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Opened</span>
                            <div className="font-medium">{m.opened}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Clicked</span>
                            <div className="font-medium">{m.clicked}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-2" />
                    Edit Steps
                  </Button>
                  <Button size="sm" variant="outline">
                    <Users className="h-3 w-3 mr-2" />
                    Enroll Leads
                  </Button>
                  <Button size="sm">
                    <Play className="h-3 w-3 mr-2" />
                    {sequence.status === "active" ? "Manage" : "Activate"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!loading && sequences.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No sequences yet</h3>
            <p className="text-muted-foreground mb-4">
              Create automated email sequences to nurture your leads over time.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Create Sequence
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
