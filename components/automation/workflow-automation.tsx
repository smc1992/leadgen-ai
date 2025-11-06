"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Play,
  Pause,
  Settings,
  Zap,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Copy
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Workflow {
  id: string
  name: string
  description?: string
  trigger_type: string
  trigger_config: any
  is_active: boolean
  category: string
  execution_count: number
  success_rate: number
  created_at: string
}

interface WorkflowStep {
  step_order: number
  step_type: string
  step_config: any
  conditions: any
}

export function WorkflowAutomation() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'lead_created',
    category: 'automation',
    trigger_config: {},
    steps: [] as WorkflowStep[]
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkflows()
  }, [selectedCategory])

  const fetchWorkflows = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/automation/workflows?${params}`)
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createWorkflow = async () => {
    try {
      const response = await fetch('/api/automation/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Workflow created successfully",
        })
        setShowCreateDialog(false)
        setFormData({
          name: '',
          description: '',
          trigger_type: 'lead_created',
          category: 'automation',
          trigger_config: {},
          steps: []
        })
        fetchWorkflows()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create workflow",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive"
      })
    }
  }

  const toggleWorkflow = async (id: string, is_active: boolean) => {
    try {
      const response = await fetch('/api/automation/workflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !is_active })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Workflow ${!is_active ? 'activated' : 'deactivated'}`,
        })
        fetchWorkflows()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive"
      })
    }
  }

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      const response = await fetch(`/api/automation/workflows?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Workflow deleted successfully",
        })
        fetchWorkflows()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive"
      })
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'lead_created': return <Zap className="h-4 w-4" />
      case 'deal_stage_changed': return <CheckCircle className="h-4 w-4" />
      case 'email_opened': return <Mail className="h-4 w-4" />
      case 'time_based': return <Clock className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nurturing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'follow_up': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'automation': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'scoring': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workflow Automation</h1>
            <p className="text-muted-foreground">Loading workflows...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <h1 className="text-3xl font-bold">Workflow Automation</h1>
          <p className="text-muted-foreground">
            Create automated workflows to streamline your sales processes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
              <SelectItem value="nurturing">Nurturing</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="scoring">Scoring</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Set up an automated workflow to handle repetitive tasks
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Workflow Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Welcome Email Sequence"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automation">Automation</SelectItem>
                        <SelectItem value="nurturing">Nurturing</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="scoring">Scoring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this workflow does..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trigger_type">Trigger Type</Label>
                    <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead_created">New Lead Created</SelectItem>
                        <SelectItem value="deal_stage_changed">Deal Stage Changed</SelectItem>
                        <SelectItem value="email_opened">Email Opened</SelectItem>
                        <SelectItem value="time_based">Time-based</SelectItem>
                        <SelectItem value="webhook">Webhook Trigger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createWorkflow}>
                    Create Workflow
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getTriggerIcon(workflow.trigger_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {workflow.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(workflow.category)}>
                    {workflow.category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                  >
                    {workflow.is_active ? (
                      <Pause className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Play className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Executions</div>
                  <div className="font-semibold">{workflow.execution_count}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Success Rate</div>
                  <div className="font-semibold">{workflow.success_rate.toFixed(1)}%</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {getTriggerIcon(workflow.trigger_type)}
                <span className="capitalize">
                  {workflow.trigger_type.replace('_', ' ')}
                </span>
                <span>•</span>
                <span>
                  {new Date(workflow.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteWorkflow(workflow.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {workflows.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-16 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first automated workflow to get started
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workflow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Workflow Templates */}
      {workflows.filter(w => w.is_template).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Workflow Templates</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflows.filter(w => w.is_template).map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                    {getTriggerIcon(template.trigger_type)}
                  </div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
