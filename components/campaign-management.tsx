"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Mail, 
  Send, 
  Users, 
  TrendingUp, 
  Calendar,
  Play,
  Pause,
  BarChart3,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Target,
  MousePointer
} from "lucide-react"
import { toast } from "sonner"

interface Campaign {
  id: string
  name: string
  subject: string
  template: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  leads_count: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  replied_count: number
  created_at: string
  updated_at: string
}

interface CampaignManagementProps {
  className?: string
}

export function CampaignManagement({ className }: CampaignManagementProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    subject: "",
    template: "",
    fromEmail: "",
    replyTo: ""
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/email')
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      toast.error("Failed to load campaigns")
      console.error('Fetch campaigns error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'campaign',
          data: newCampaign
        })
      })

      if (!response.ok) throw new Error('Failed to create campaign')
      
      const { campaign } = await response.json()
      setCampaigns(prev => [campaign, ...prev])
      setShowCreateDialog(false)
      setNewCampaign({ name: "", subject: "", template: "", fromEmail: "", replyTo: "" })
      toast.success("Campaign created successfully")
    } catch (error) {
      toast.error("Failed to create campaign")
      console.error('Create campaign error:', error)
    }
  }

  const handleLaunchCampaign = async (campaignId: string) => {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'launch',
          data: { campaignId }
        })
      })

      if (!response.ok) throw new Error('Failed to launch campaign')
      
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId ? { ...c, status: 'active' } : c
      ))
      toast.success("Campaign launched successfully")
    } catch (error) {
      toast.error("Failed to launch campaign")
      console.error('Launch campaign error:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'paused': return 'text-yellow-600 bg-yellow-50'
      case 'completed': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'completed': return <Target className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const calculateMetrics = (campaign: Campaign) => {
    const openRate = campaign.sent_count > 0 ? (campaign.opened_count / campaign.sent_count * 100) : 0
    const clickRate = campaign.opened_count > 0 ? (campaign.clicked_count / campaign.opened_count * 100) : 0
    const replyRate = campaign.delivered_count > 0 ? (campaign.replied_count / campaign.delivered_count * 100) : 0
    
    return { openRate, clickRate, replyRate }
  }

  const totalStats = campaigns.reduce((acc, campaign) => ({
    totalLeads: acc.totalLeads + campaign.leads_count,
    totalSent: acc.totalSent + campaign.sent_count,
    totalOpened: acc.totalOpened + campaign.opened_count,
    totalClicked: acc.totalClicked + campaign.clicked_count
  }), { totalLeads: 0, totalSent: 0, totalOpened: 0, totalClicked: 0 })

  return (
    <div className={className}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats.totalSent > 0 ? Math.round(totalStats.totalOpened / totalStats.totalSent * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>Create and manage your email campaigns</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                      Set up your email campaign with template and scheduling
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input
                          id="name"
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Q1 Lead Generation"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input
                          id="subject"
                          value={newCampaign.subject}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Introduction to Emex Solutions"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                          id="fromEmail"
                          type="email"
                          value={newCampaign.fromEmail}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, fromEmail: e.target.value }))}
                          placeholder="campaign@yourcompany.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="replyTo">Reply To</Label>
                        <Input
                          id="replyTo"
                          type="email"
                          value={newCampaign.replyTo}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, replyTo: e.target.value }))}
                          placeholder="support@yourcompany.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="template">Email Template</Label>
                      <Textarea
                        id="template"
                        value={newCampaign.template}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, template: e.target.value }))}
                        placeholder="Hi {{firstName}},

I hope this email finds you well. I'm reaching out because..."
                        rows={8}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCampaign}>
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={fetchCampaigns} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Clicked</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Loading campaigns...</p>
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No campaigns found</p>
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => {
                  const metrics = calculateMetrics(campaign)
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1">{campaign.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {campaign.leads_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-muted-foreground" />
                          {campaign.sent_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {campaign.opened_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MousePointer className="h-4 w-4 text-muted-foreground" />
                          {campaign.clicked_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Open Rate</span>
                            <span>{metrics.openRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={metrics.openRate} className="h-2" />
                          <div className="flex justify-between text-xs">
                            <span>Click Rate</span>
                            <span>{metrics.clickRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={metrics.clickRate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCampaign(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={campaign.status !== 'draft'}
                            onClick={() => handleLaunchCampaign(campaign.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Campaign Details Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Campaign Name</Label>
                    <p className="font-medium">{selectedCampaign.name}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedCampaign.status)}>
                      {selectedCampaign.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <p className="font-medium">{selectedCampaign.subject}</p>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="font-medium">{new Date(selectedCampaign.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCampaign.leads_count}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCampaign.sent_count}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Opened</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCampaign.opened_count}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Clicked</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCampaign.clicked_count}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="template">
                <div>
                  <Label>Email Template</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{selectedCampaign.template}</pre>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="analytics">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Open Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {calculateMetrics(selectedCampaign).openRate.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Click Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {calculateMetrics(selectedCampaign).clickRate.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Reply Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {calculateMetrics(selectedCampaign).replyRate.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
