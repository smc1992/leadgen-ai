"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Sparkles,
  Plus,
  Settings,
  Target,
  Zap,
  BarChart3,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  ShoppingCart
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PersonalizationRule {
  id: string
  name: string
  description?: string
  content_type: string
  trigger_conditions: any
  personalization_rules: any
  ai_enhancement: boolean
  is_active: boolean
  usage_count: number
  performance_score: number
}

export function ContentPersonalizationEngine() {
  const [rules, setRules] = useState<PersonalizationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTab, setSelectedTab] = useState("rules")
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content_type: 'email',
    trigger_conditions: {},
    personalization_rules: {},
    ai_enhancement: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/content/personalization-rules')
      const data = await response.json()
      setRules(data.rules || [])
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      toast({
        title: "Error",
        description: "Failed to load personalization rules",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    try {
      const response = await fetch('/api/content/personalization-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Personalization rule created successfully",
        })
        setShowCreateDialog(false)
        setFormData({
          name: '',
          description: '',
          content_type: 'email',
          trigger_conditions: {},
          personalization_rules: {},
          ai_enhancement: true
        })
        fetchRules()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create rule",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create personalization rule",
        variant: "destructive"
      })
    }
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const response = await fetch(`/api/content/personalization-rules?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rule deleted successfully",
        })
        fetchRules()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content Personalization</h1>
            <p className="text-muted-foreground">Loading personalization engine...</p>
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
          <h1 className="text-3xl font-bold">Content Personalization Engine</h1>
          <p className="text-muted-foreground">
            AI-powered content adaptation and real-time optimization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="rules">Personalization Rules</TabsTrigger>
          <TabsTrigger value="blocks">Dynamic Blocks</TabsTrigger>
          <TabsTrigger value="optimization">A/B Testing</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          {/* Rules Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {rule.content_type.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule.ai_enhancement && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Toggle active state */}}
                      >
                        {rule.is_active ? (
                          <Pause className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Play className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {rule.description && (
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Usage</div>
                      <div className="font-semibold">{rule.usage_count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Performance</div>
                      <div className="font-semibold">{rule.performance_score.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Trigger Conditions Preview */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Triggers:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(rule.trigger_conditions).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                        </Badge>
                      ))}
                    </div>
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
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Create New Rule Card */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Create New Rule</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add personalized content rules for different lead segments
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Add Rule
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg w-fit mx-auto mb-4">
                <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dynamic Content Blocks</h3>
              <p className="text-muted-foreground mb-6">
                Create reusable content components that adapt based on lead characteristics
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Dynamic Block
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">A/B Testing & Optimization</h3>
              <p className="text-muted-foreground mb-6">
                Run real-time A/B tests to optimize content performance
              </p>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Start New Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Open Rate</p>
                    <p className="text-2xl font-bold">24.5%</p>
                    <p className="text-xs text-green-600">+2.1% vs last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MousePointer className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">8.2%</p>
                    <p className="text-xs text-green-600">+1.5% vs last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-xs text-green-600">+12 vs last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Personalization Lift</p>
                    <p className="text-2xl font-bold">+34%</p>
                    <p className="text-xs text-muted-foreground">vs non-personalized</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Personalization Rule</DialogTitle>
            <DialogDescription>
              Define rules for dynamic content personalization based on lead characteristics
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enterprise Welcome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-type">Content Type</Label>
                <Select value={formData.content_type} onValueChange={(value) => setFormData({ ...formData, content_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="landing_page">Landing Page</SelectItem>
                    <SelectItem value="social_post">Social Post</SelectItem>
                    <SelectItem value="ad_copy">Ad Copy</SelectItem>
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
                placeholder="Describe when and how this rule should be applied..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ai-enhancement"
                checked={formData.ai_enhancement}
                onChange={(e) => setFormData({ ...formData, ai_enhancement: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="ai-enhancement" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Enable AI Enhancement
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createRule}>
                Create Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
