"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, RefreshCw, Loader2, Sparkles } from "lucide-react"
import { formatDateLong, formatDate } from "@/lib/utils/date"
import { toast } from "sonner"

interface ScheduledPost {
  id: string
  title: string
  type: string
  platform: string[]
  schedule_at: string
  status: string
  blotatoId?: string
}

interface ScheduledStats {
  total: number
  today: number
  thisWeek: number
}

export default function CalendarPage() {
  const [scheduledContent, setScheduledContent] = useState<ScheduledPost[]>([])
  const [stats, setStats] = useState<ScheduledStats>({ total: 0, today: 0, thisWeek: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Fetch scheduled posts
  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/content/scheduled?days=7')
      const result = await response.json()

      if (result.success) {
        setScheduledContent(result.posts)
        setStats(result.stats)
      } else {
        toast.error('Failed to load scheduled posts')
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
      toast.error('Failed to load calendar data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchScheduledPosts()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchScheduledPosts()
  }

  const groupByDate = (items: typeof scheduledContent) => {
    const grouped: Record<string, typeof scheduledContent> = {}
    items.forEach(item => {
      const date = formatDate(item.schedule_at, "yyyy-MM-dd")
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(item)
    })
    return grouped
  }

  const groupedContent = groupByDate(scheduledContent)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your scheduled content via Blotato
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days via Blotato
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              Posts scheduled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
          <CardDescription>
            Your scheduled content for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledContent.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Scheduled Posts</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Schedule posts from the Content page to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedContent).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  {formatDateLong(items[0].schedule_at)}
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatDate(item.schedule_at, "h:mm a")}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                          {item.platform.map(platform => (
                            <Badge key={platform} variant="secondary" className="capitalize">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
