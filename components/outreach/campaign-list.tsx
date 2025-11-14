"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Clock, CheckCircle, AlertTriangle, MoreVertical, Play, Pause, Trash2, TrendingUp, Users, Mail, MousePointerClick, FlaskConical, Target } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { fetchWithCsrf } from '@/lib/client-fetch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Campaign {
  id: string
  name: string
  template_id: string
  status: string
  leads_count: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  created_at: string
  instantly_id?: string
  instantlyData?: { id: string }
}

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [abDialogOpen, setAbDialogOpen] = useState<{open: boolean, campaign?: Campaign}>({ open: false })
  const [abName, setAbName] = useState("")
  const [abDescription, setAbDescription] = useState("")
  const [variantA, setVariantA] = useState("")
  const [variantB, setVariantB] = useState("")
  const [sampleSize, setSampleSize] = useState("1000")
  const [confidence, setConfidence] = useState("0.95")
  const [metric, setMetric] = useState("open_rate")

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/email')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "completed": return "bg-blue-100 text-blue-800"
      case "draft": return "bg-gray-100 text-gray-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Send className="h-3 w-3" />
      case "completed": return <CheckCircle className="h-3 w-3" />
      case "draft": return <Clock className="h-3 w-3" />
      case "paused": return <AlertTriangle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const handleStatusChange = async (campaign: Campaign, newStatus: string) => {
    try {
      const instantlyId = campaign.instantly_id || campaign.instantlyData?.id || campaign.id
      const response = await fetchWithCsrf('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          newStatus === 'active'
            ? { type: 'launch', data: instantlyId }
            : { type: 'update-status', data: { instantlyId, status: newStatus } }
        )
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Campaign ${newStatus === 'active' ? 'started' : 'paused'}`,
        })
        fetchCampaigns()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const response = await fetchWithCsrf(`/api/outreach/campaigns?id=${campaignId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Campaign deleted",
        })
        fetchCampaigns()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive"
      })
    }
  }

  const handleCreateAbTest = async () => {
    try {
      if (!abDialogOpen.campaign) return
      if (!abName || !variantA || !variantB) {
        toast({ title: 'Fehler', description: 'Name und beide Varianten erforderlich', variant: 'destructive' })
        return
      }
      const body = {
        name: abName,
        description: abDescription,
        campaign_type: 'email',
        original_template_id: abDialogOpen.campaign.template_id,
        test_variants: [
          { id: 'A', name: variantA },
          { id: 'B', name: variantB }
        ],
        sample_size: parseInt(sampleSize) || 1000,
        confidence_level: parseFloat(confidence) || 0.95,
        test_metric: metric
      }
      const res = await fetchWithCsrf('/api/intelligence/ab-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'A/B-Test konnte nicht erstellt werden')
      }
      toast({ title: 'A/B-Test erstellt', description: 'Test wurde angelegt und initialisiert' })
      setAbDialogOpen({ open: false })
      setAbName(''); setAbDescription(''); setVariantA(''); setVariantB('')
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message || 'Unbekannter Fehler', variant: 'destructive' })
    }
  }

  const calculateOpenRate = (campaign: Campaign) => {
    if (campaign.sent_count === 0) return '0%'
    return `${((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)}%`
  }

  const calculateClickRate = (campaign: Campaign) => {
    if (campaign.opened_count === 0) return '0%'
    return `${((campaign.clicked_count / campaign.opened_count) * 100).toFixed(1)}%`
  }

  if (loading) {
    return <div className="text-center py-8">Loading campaigns...</div>
  }

  if (campaigns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Send className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first email campaign to start reaching out to leads
          </p>
          <Button size="lg">
            <Send className="h-4 w-4 mr-2" />
            Create Your First Campaign
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const openRate = parseFloat(calculateOpenRate(campaign).replace('%', ''))
        const clickRate = parseFloat(calculateClickRate(campaign).replace('%', ''))
        
        return (
          <Card key={campaign.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <Badge className={getStatusColor(campaign.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(campaign.status)}
                    {campaign.status}
                  </span>
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {campaign.status === 'draft' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(campaign, 'active')}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Campaign
                      </DropdownMenuItem>
                    )}
                    {campaign.status === 'active' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(campaign, 'paused')}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Campaign
                      </DropdownMenuItem>
                    )}
                    {campaign.status === 'paused' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(campaign, 'active')}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume Campaign
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAbDialogOpen({ open: true, campaign })}>
                      <FlaskConical className="h-4 w-4 mr-2" />
                      Start A/B Test
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-xl line-clamp-2">{campaign.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {new Date(campaign.created_at).toLocaleDateString('de-DE', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Sent</span>
                  </div>
                  <p className="text-2xl font-bold">{campaign.sent_count}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Delivered</span>
                  </div>
                  <p className="text-2xl font-bold">{campaign.delivered_count}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Open Rate
                    </span>
                    <span className="text-sm font-bold">{calculateOpenRate(campaign)}</span>
                  </div>
                  <Progress value={openRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      Click Rate
                    </span>
                    <span className="text-sm font-bold">{calculateClickRate(campaign)}</span>
                  </div>
                  <Progress value={clickRate} className="h-2" />
                </div>
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{campaign.leads_count} leads</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
      <Dialog open={abDialogOpen.open} onOpenChange={(o) => setAbDialogOpen({ open: o, campaign: abDialogOpen.campaign })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen A/B-Test erstellen</DialogTitle>
            <DialogDescription>
              Teste Varianten für {abDialogOpen.campaign?.name || 'Kampagne'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={abName} onChange={(e) => setAbName(e.target.value)} placeholder="Betreff-Test Q4" />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input value={abDescription} onChange={(e) => setAbDescription(e.target.value)} placeholder="Vergleich zweier Betreffzeilen" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Variante A *</Label>
                <Input value={variantA} onChange={(e) => setVariantA(e.target.value)} placeholder="z. B. Betreff A" />
              </div>
              <div className="space-y-2">
                <Label>Variante B *</Label>
                <Input value={variantB} onChange={(e) => setVariantB(e.target.value)} placeholder="z. B. Betreff B" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sample Size</Label>
                <Input value={sampleSize} onChange={(e) => setSampleSize(e.target.value)} placeholder="1000" />
              </div>
              <div className="space-y-2">
                <Label>Confidence</Label>
                <Select value={confidence} onValueChange={setConfidence}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.90">90%</SelectItem>
                    <SelectItem value="0.95">95%</SelectItem>
                    <SelectItem value="0.99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Metric</Label>
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_rate">Open Rate</SelectItem>
                    <SelectItem value="click_rate">Click Rate</SelectItem>
                    <SelectItem value="reply_rate">Reply Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAbDialogOpen({ open: false })}>Abbrechen</Button>
              <Button onClick={handleCreateAbTest}>
                <FlaskConical className="h-4 w-4 mr-2" />
                Test starten
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
