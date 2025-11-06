"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Mail, 
  Target, 
  BarChart3,
  Calendar,
  RefreshCw,
  Activity,
  MousePointer,
  Eye
} from "lucide-react"

interface AnalyticsData {
  leads: {
    total: number
    outreachReady: number
    validEmails: number
    avgScore: number
    growth: string
  }
  campaigns: {
    total: number
    active: number
    sent: number
    opened: number
    openRate: number
  }
  content: {
    templates: number
    knowledgeBases: number
  }
}

interface RealAnalyticsProps {
  className?: string
}

export function RealAnalytics({ className }: RealAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/analytics?timeRange=${timeRange}&type=overview`)
      if (!response.ok) {
        if (response.status === 503) {
          setError('Service unavailable: Supabase not configured. Set SUPABASE_SERVICE_ROLE_KEY and restart the server.')
        } else if (response.status === 401) {
          setError('Unauthorized: Please sign in to view analytics.')
        } else {
          setError('Failed to fetch analytics')
        }
        return
      }
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Fetch analytics error:', error)
      setError('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const getGrowthIcon = (growth: string) => {
    const isPositive = growth.startsWith('+')
    return isPositive ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getGrowthColor = (growth: string) => {
    const isPositive = growth.startsWith('+')
    return isPositive ? 'text-green-600' : 'text-red-600'
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

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle>Analytics Unavailable</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-muted-foreground">Please configure the environment and try again.</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No analytics data available</p>
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
          <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics for your lead generation
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

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.leads.total.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(analytics.leads.growth)}
              <span className={getGrowthColor(analytics.leads.growth)}>
                {analytics.leads.growth}
              </span>
              <span className="text-muted-foreground">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outreach Ready</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.leads.outreachReady.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{Math.round((analytics.leads.outreachReady / analytics.leads.total) * 100)}%</span>
              <span>of total leads</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.campaigns.sent.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>across {analytics.campaigns.total} campaigns</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.campaigns.openRate}%</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{analytics.campaigns.opened.toLocaleString()} opens</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Lead Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Lead Quality
            </CardTitle>
            <CardDescription>Quality metrics for your leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Valid Emails</span>
                <span className="font-medium">{analytics.leads.validEmails}</span>
              </div>
              <Progress 
                value={(analytics.leads.validEmails / analytics.leads.total) * 100} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Score</span>
                <span className="font-medium">{analytics.leads.avgScore}/100</span>
              </div>
              <Progress value={analytics.leads.avgScore} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Outreach Ready</span>
                <span className="font-medium">{analytics.leads.outreachReady}</span>
              </div>
              <Progress 
                value={(analytics.leads.outreachReady / analytics.leads.total) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Campaign Performance
            </CardTitle>
            <CardDescription>Email campaign metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.campaigns.active}</div>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.campaigns.total}</div>
                <p className="text-xs text-muted-foreground">Total Campaigns</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Open Rate</span>
                <Badge variant="outline">{analytics.campaigns.openRate}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Emails Opened</span>
                <span className="text-sm font-medium">{analytics.campaigns.opened.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Sent</span>
                <span className="text-sm font-medium">{analytics.campaigns.sent.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Content Library
            </CardTitle>
            <CardDescription>Your marketing assets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.content.templates}</div>
                <p className="text-xs text-muted-foreground">Email Templates</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.content.knowledgeBases}</div>
                <p className="text-xs text-muted-foreground">Knowledge Bases</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Templates ready for use</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>AI-powered content</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Personalization assets</span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View All Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
