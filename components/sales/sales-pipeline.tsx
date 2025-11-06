"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Filter,
  Search,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PipedriveIntegration } from "@/components/crm/pipedrive-integration"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Deal {
  id: string
  title: string
  deal_value?: number
  company_name?: string
  contact_name?: string
  expected_close_date?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  stage_id: string
  deal_stages?: {
    name: string
    color: string
    probability: number
  }
  assigned_user?: {
    email: string
  }
}

interface DealStage {
  id: string
  name: string
  color: string
  order_position: number
  probability: number
}

export function SalesPipeline() {
  const [stages, setStages] = useState<DealStage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStage, setFilterStage] = useState<string>("")
  const [showNewDealDialog, setShowNewDealDialog] = useState(false)
  const [newDealData, setNewDealData] = useState({
    title: '',
    company_name: '',
    contact_name: '',
    contact_email: '',
    deal_value: '',
    expected_close_date: '',
    priority: 'medium',
    notes: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchPipelineData()
  }, [])

  const fetchPipelineData = async () => {
    try {
      const [stagesResponse, dealsResponse] = await Promise.all([
        fetch('/api/sales/deal-stages'),
        fetch('/api/sales/deals')
      ])

      let stagesData = await stagesResponse.json()
      const dealsData = await dealsResponse.json()

      // If no stages exist, try to set them up
      if (!stagesData.stages || stagesData.stages.length === 0) {
        console.log('No deal stages found, setting up defaults...')
        const setupResponse = await fetch('/api/setup/deal-stages', {
          method: 'POST'
        })

        if (setupResponse.ok) {
          // Refetch stages after setup
          const newStagesResponse = await fetch('/api/sales/deal-stages')
          stagesData = await newStagesResponse.json()
        }
      }

      setStages(stagesData.stages || [])
      setDeals(dealsData.deals || [])
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error)
      toast({
        title: "Error",
        description: "Failed to load pipeline data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDealMove = async (dealId: string, newStageId: string) => {
    try {
      const response = await fetch('/api/sales/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dealId, stage_id: newStageId })
      })

      if (response.ok) {
        // Update local state
        setDeals(deals.map(deal =>
          deal.id === dealId
            ? { ...deal, stage_id: newStageId }
            : deal
        ))
        fetchPipelineData() // Refresh to get updated data
      }
    } catch (error) {
      console.error('Failed to move deal:', error)
      toast({
        title: "Error",
        description: "Failed to move deal",
        variant: "destructive"
      })
    }
  }

  const createNewDeal = async () => {
    try {
      if (!newDealData.title.trim()) {
        toast({
          title: "Error",
          description: "Deal title is required",
          variant: "destructive"
        })
        return
      }

      // Normalize date input to YYYY-MM-DD (supports DD.MM.YYYY and MM/DD/YYYY)
      const normalizeDate = (input: string) => {
        if (!input) return null as any
        const s = input.trim()
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
        const dotMatch = s.match(/^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})$/)
        if (dotMatch) {
          const [, dd, mm, yyyy] = dotMatch
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
        }
        const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (slashMatch) {
          const [, mm, dd, yyyy] = slashMatch
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
        }
        const d = new Date(s)
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}`
        }
        return null as any
      }

      const dealPayload = {
        title: newDealData.title,
        company_name: newDealData.company_name,
        contact_name: newDealData.contact_name,
        contact_email: newDealData.contact_email,
        deal_value: newDealData.deal_value ? parseFloat(newDealData.deal_value) : null,
        expected_close_date: normalizeDate(newDealData.expected_close_date || ''),
        priority: newDealData.priority,
        notes: newDealData.notes,
        stage_id: stages[0]?.id // Start with first stage (Discovery)
      }

      const response = await fetch('/api/sales/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealPayload)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Deal created successfully",
        })
        setShowNewDealDialog(false)
        setNewDealData({
          title: '',
          company_name: '',
          contact_name: '',
          contact_email: '',
          deal_value: '',
          expected_close_date: '',
          priority: 'medium',
          notes: ''
        })
        fetchPipelineData() // Refresh data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create deal",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to create deal:', error)
      toast({
        title: "Error",
        description: "Failed to create deal",
        variant: "destructive"
      })
    }
  }

  const getDealsForStage = (stageId: string) => {
    return deals.filter(deal => {
      const matchesStage = !filterStage || deal.stage_id === filterStage
      const matchesSearch = !searchQuery ||
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())

      return deal.stage_id === stageId && matchesStage && matchesSearch
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getTotalValueForStage = (stageId: string) => {
    return deals
      .filter(deal => deal.stage_id === stageId)
      .reduce((total, deal) => total + (deal.deal_value || 0), 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Pipeline</h1>
            <p className="text-muted-foreground">Loading your deals...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2].map(j => (
                    <div key={j} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Track and manage your deals across the sales process
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStage("")}>
                All Stages
              </DropdownMenuItem>
              {stages.map(stage => (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={() => setFilterStage(stage.id)}
                >
                  {stage.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="gap-2" onClick={() => setShowNewDealDialog(true)}>
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pipeline</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(deals.reduce((total, deal) => total + (deal.deal_value || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weighted Pipeline</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(deals.reduce((total, deal) => {
                    const probability = deal.deal_stages?.probability || 0
                    return total + ((deal.deal_value || 0) * probability) / 100
                  }, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">
                  {deals.filter(deal => deal.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Closing This Month</p>
                <p className="text-2xl font-bold">
                  {deals.filter(deal => {
                    if (!deal.expected_close_date) return false
                    const closeDate = new Date(deal.expected_close_date)
                    const now = new Date()
                    return closeDate.getMonth() === now.getMonth() &&
                           closeDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = getDealsForStage(stage.id)
          const totalValue = getTotalValueForStage(stage.id)

          return (
            <Card key={stage.id} className="min-h-[600px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    ></div>
                    <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageDeals.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {stage.probability}% win rate
                  </p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {stageDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="cursor-move hover:shadow-md transition-shadow border-l-4"
                    style={{ borderLeftColor: stage.color }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight line-clamp-2">
                            {deal.title}
                          </h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Deal
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Deal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getPriorityColor(deal.priority)}`}
                          ></div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {deal.priority}
                          </span>
                        </div>

                        {deal.company_name && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {deal.company_name}
                          </p>
                        )}

                        {deal.contact_name && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {deal.contact_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {deal.contact_name}
                            </span>
                          </div>
                        )}

                        {deal.deal_value && (
                          <p className="font-semibold text-sm">
                            {formatCurrency(deal.deal_value)}
                          </p>
                        )}

                        {deal.expected_close_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(deal.expected_close_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No deals in this stage</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* New Deal Dialog */}
      <Dialog open={showNewDealDialog} onOpenChange={setShowNewDealDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <DialogDescription>
              Add a new deal to your sales pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deal-title">Deal Title *</Label>
              <Input
                id="deal-title"
                value={newDealData.title}
                onChange={(e) => setNewDealData({ ...newDealData, title: e.target.value })}
                placeholder="Website Redesign Project"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={newDealData.company_name}
                  onChange={(e) => setNewDealData({ ...newDealData, company_name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal-value">Deal Value ($)</Label>
                <Input
                  id="deal-value"
                  type="number"
                  value={newDealData.deal_value}
                  onChange={(e) => setNewDealData({ ...newDealData, deal_value: e.target.value })}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Contact Name</Label>
                <Input
                  id="contact-name"
                  value={newDealData.contact_name}
                  onChange={(e) => setNewDealData({ ...newDealData, contact_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={newDealData.contact_email}
                  onChange={(e) => setNewDealData({ ...newDealData, contact_email: e.target.value })}
                  placeholder="john@acme.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected-close">Expected Close Date</Label>
                <Input
                  id="expected-close"
                  type="date"
                  value={newDealData.expected_close_date}
                  onChange={(e) => setNewDealData({ ...newDealData, expected_close_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newDealData.priority} onValueChange={(value) => setNewDealData({ ...newDealData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newDealData.notes}
                onChange={(e) => setNewDealData({ ...newDealData, notes: e.target.value })}
                placeholder="Additional notes about this deal..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewDealDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createNewDeal}>
                Create Deal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
