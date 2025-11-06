"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Mail, 
  MailOpen, 
  MailCheck, 
  MailX,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Users,
  TrendingUp,
  MapPin,
  Building,
  Globe,
  Phone,
  Star
} from "lucide-react"
import { toast } from "sonner"
import { ScrapeGoogleMapsDialog } from "@/components/leads/scrape-google-maps-dialog"

interface Lead {
  id: string
  full_name: string
  job_title: string | null
  company: string | null
  email: string | null
  email_status: 'valid' | 'invalid' | 'unknown'
  score: number
  region: string | null
  channel: string
  source_url: string | null
  website_url?: string | null
  phone?: string | null
  rating_avg?: number | null
  rating_count?: number | null
  is_outreach_ready: boolean
  created_at: string
  updated_at: string
}

interface LeadsManagementProps {
  className?: string
}

export function LeadsManagement({ className }: LeadsManagementProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [leadLists, setLeadLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [filters, setFilters] = useState({
    region: "",
    status: "",
    scoreMin: "",
    scoreMax: "",
    outreachReady: ""
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState("")

  useEffect(() => {
    fetchLeadLists()
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [search, filters, pagination.page, selectedListId])

  const fetchLeadLists = async () => {
    try {
      const res = await fetch('/api/lead-lists')
      if (res.ok) {
        const data = await res.json()
        setLeadLists(data.lists || [])
      }
    } catch (e) {
      console.error('Failed to fetch lead lists:', e)
    }
  }

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
        ...(search && { search })
      })

      if (selectedListId) {
        params.set('listId', selectedListId)
      }
      const response = await fetch(`/api/leads?${params}`)
      if (!response.ok) throw new Error('Failed to fetch leads')
      
      const data = await response.json()
      setLeads(data.leads)
      setPagination(data.pagination)
    } catch (error) {
      toast.error("Failed to load leads")
      console.error('Fetch leads error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLead = (leadId: string, checked: boolean) => {
    setSelectedLeads(prev => 
      checked 
        ? [...prev, leadId]
        : prev.filter(id => id !== leadId)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedLeads(checked ? leads.map(lead => lead.id) : [])
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete lead')
      
      setLeads(prev => prev.filter(lead => lead.id !== leadId))
      setSelectedLeads(prev => prev.filter(id => id !== leadId))
      toast.success("Lead deleted successfully")
    } catch (error) {
      toast.error("Failed to delete lead")
      console.error('Delete lead error:', error)
    }
  }

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) throw new Error('Failed to update lead')
      
      const { lead } = await response.json()
      setLeads(prev => prev.map(l => l.id === leadId ? lead : l))
      setEditingLead(null)
      toast.success("Lead updated successfully")
    } catch (error) {
      toast.error("Failed to update lead")
      console.error('Update lead error:', error)
    }
  }

  const handleImportLeads = async () => {
    try {
      const lines = importData.trim().split('\n').filter(line => line.trim())
      const parsedLeads = lines.map(line => {
        const [fullName, email, company, jobTitle] = line.split(',').map(s => s.trim())
        return { fullName, email, company, jobTitle }
      }).filter(lead => lead.fullName)

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: parsedLeads })
      })

      if (!response.ok) throw new Error('Failed to import leads')
      
      const { leads: importedLeads } = await response.json()
      setLeads(prev => [...importedLeads, ...prev])
      setShowImportDialog(false)
      setImportData("")
      toast.success(`Imported ${importedLeads.length} leads`)
    } catch (error) {
      toast.error("Failed to import leads")
      console.error('Import leads error:', error)
    }
  }

  const getEmailStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <MailCheck className="h-4 w-4 text-green-500" />
      case 'invalid': return <MailX className="h-4 w-4 text-red-500" />
      default: return <Mail className="h-4 w-4 text-gray-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const stats = {
    total: leads.length,
    outreachReady: leads.filter(l => l.is_outreach_ready).length,
    validEmails: leads.filter(l => l.email_status === 'valid').length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / leads.length) : 0
  }

  return (
    <div className={className}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outreach Ready</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.outreachReady}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Emails</CardTitle>
            <MailCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.validEmails}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads Management</CardTitle>
              <CardDescription>Manage and analyze your lead database</CardDescription>
            </div>
            <div className="flex gap-2">
              <ScrapeGoogleMapsDialog onImported={() => fetchLeads()} />
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Leads</DialogTitle>
                    <DialogDescription>
                      Paste CSV data (fullName, email, company, jobTitle)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="John Doe, john@example.com, Acme Corp, CEO
Jane Smith, jane@example.com, Tech Inc, CTO"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      rows={6}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleImportLeads}>
                        Import Leads
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={fetchLeads} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <Select value={selectedListId} onValueChange={(value) => setSelectedListId(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Lead-Liste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Listen</SelectItem>
                  {leadLists.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} {typeof l.leads_count === 'number' ? `(${l.leads_count})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.region} onValueChange={(value) => setFilters(prev => ({ ...prev, region: value === 'all' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="DE">DE</SelectItem>
                  <SelectItem value="CA">CA</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Email Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Min Score"
                type="number"
                value={filters.scoreMin}
                onChange={(e) => setFilters(prev => ({ ...prev, scoreMin: e.target.value }))}
              />

              <Input
                placeholder="Max Score"
                type="number"
                value={filters.scoreMax}
                onChange={(e) => setFilters(prev => ({ ...prev, scoreMax: e.target.value }))}
              />

              <Select value={filters.outreachReady} onValueChange={(value) => setFilters(prev => ({ ...prev, outreachReady: value === 'all' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Outreach Ready" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Ready</SelectItem>
                  <SelectItem value="false">Not Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                      <p className="text-muted-foreground mt-2">Loading leads...</p>
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <p className="text-muted-foreground">No leads found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEmailStatusIcon(lead.email_status)}
                          <span className="text-sm">{lead.email || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{lead.company || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{lead.job_title || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{lead.region || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {lead.website_url && (
                        <a href={lead.website_url || undefined} target="_blank" rel="noopener noreferrer">
                          <Badge variant="outline" className="hover:bg-muted">
                            <Globe className="h-3 w-3 mr-1" /> Website
                          </Badge>
                        </a>
                      )}
                      {lead.phone && (
                        <Badge variant="outline">
                          <Phone className="h-3 w-3 mr-1" /> {lead.phone}
                        </Badge>
                      )}
                      {(typeof lead.rating_avg === 'number' || typeof lead.rating_count === 'number') && (
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 mr-1" />
                          {typeof lead.rating_avg === 'number' ? `${lead.rating_avg.toFixed(1)}★` : '—'}
                          {typeof lead.rating_count === 'number' ? ` (${lead.rating_count})` : ''}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getScoreColor(lead.score)}>
                      {lead.score}
                    </Badge>
                  </TableCell>
                      <TableCell>
                        {lead.is_outreach_ready && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Ready
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lead.channel}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLead(lead)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={editingLead.full_name}
                    onChange={(e) => setEditingLead(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={editingLead.company || ''}
                    onChange={(e) => setEditingLead(prev => prev ? { ...prev, company: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={editingLead.job_title || ''}
                    onChange={(e) => setEditingLead(prev => prev ? { ...prev, job_title: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={editingLead.region || ''}
                    onChange={(e) => setEditingLead(prev => prev ? { ...prev, region: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="emailStatus">Email Status</Label>
                  <Select
                    value={editingLead.email_status}
                    onValueChange={(value) => setEditingLead(prev => prev ? { ...prev, email_status: value as 'valid' | 'invalid' | 'unknown' } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="invalid">Invalid</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingLead(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateLead(editingLead.id, editingLead)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
