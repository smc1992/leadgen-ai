"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  Calendar,
  RefreshCw,
  Activity,
  Users,
  Target,
  Lightbulb
} from "lucide-react"
import { toast } from "sonner"

interface AIAnalyticsData {
  overview: {
    totalConversations: number
    totalTokensUsed: number
    totalInsights: number
    implementedInsights: number
    implementationRate: number
  }
  usage: {
    contextDistribution: Record<string, number>
    aiTypeDistribution: Record<string, number>
    dailyTrends: Record<string, number>
    avgTokensPerConversation: number
  }
  insights: {
    distribution: Record<string, number>
    avgConfidence: number
  }
}

interface AIAnalyticsProps {
  className?: string
}

export function AIAnalytics({ className }: AIAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAIAnalytics()
  }, [timeRange])

  const fetchAIAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai/analytics?timeRange=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch AI analytics')

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Fetch AI analytics error:', error)
      toast.error("Failed to load AI analytics")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAIAnalytics()
    setRefreshing(false)
  }

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'leads': return Users
      case 'campaigns': return Target
      case 'analytics': return BarChart3
      case 'technical': return Brain
      default: return MessageSquare
    }
  }

  const getContextColor = (context: string) => {
    switch (context) {
      case 'leads': return 'bg-green-500'
      case 'campaigns': return 'bg-purple-500'
      case 'analytics': return 'bg-orange-500'
      case 'technical': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No AI analytics data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Assistant Analytics</h2>
          <p className="text-muted-foreground">
            Performance metrics and usage insights for your AI assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalConversations.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Avg {analytics.usage.avgTokensPerConversation} tokens per conversation</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalTokensUsed.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Across all conversations</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalInsights}</div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-green-600">
                {analytics.overview.implementationRate}% implemented
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.insights.avgConfidence.toFixed(1)}%</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>AI response confidence</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Context Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Conversation Context Distribution
            </CardTitle>
            <CardDescription>AI assistant usage by context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.usage.contextDistribution).map(([context, count]) => {
              const Icon = getContextIcon(context)
              const percentage = (count / analytics.overview.totalConversations) * 100

              return (
                <div key={context} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getContextColor(context)}`}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="capitalize">{context}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Feature Usage
            </CardTitle>
            <CardDescription>Usage of different AI features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.usage.aiTypeDistribution).map(([type, count]) => {
              const percentage = (count / Object.values(analytics.usage.aiTypeDistribution).reduce((a, b) => a + b, 0)) * 100

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Insights Distribution */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Insights Distribution
          </CardTitle>
          <CardDescription>Types of insights generated by AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.insights.distribution).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground capitalize">
                  {type.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
