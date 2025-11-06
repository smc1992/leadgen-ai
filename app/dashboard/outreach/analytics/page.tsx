"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Send, 
  Eye, 
  MousePointer, 
  Users, 
  Calendar,
  Download,
  Filter
} from "lucide-react"

// Mock analytics data
const performanceData = [
  { date: "2024-01-01", sent: 120, delivered: 115, opened: 45, clicked: 8, converted: 1 },
  { date: "2024-01-02", sent: 95, delivered: 92, opened: 38, clicked: 7, converted: 1 },
  { date: "2024-01-03", sent: 110, delivered: 108, opened: 52, clicked: 12, converted: 2 },
  { date: "2024-01-04", sent: 85, delivered: 82, opened: 35, clicked: 6, converted: 0 },
  { date: "2024-01-05", sent: 130, delivered: 125, opened: 58, clicked: 14, converted: 3 },
  { date: "2024-01-06", sent: 105, delivered: 102, opened: 48, clicked: 9, converted: 1 },
  { date: "2024-01-07", sent: 140, delivered: 135, opened: 65, clicked: 16, converted: 2 },
]

const campaignPerformance = [
  { name: "Q1 Logistics", sent: 245, openRate: 38.5, clickRate: 7.8, conversionRate: 1.2 },
  { name: "Freight Solutions", sent: 189, openRate: 42.1, clickRate: 9.2, conversionRate: 2.1 },
  { name: "European Transport", sent: 156, openRate: 35.2, clickRate: 6.5, conversionRate: 0.8 },
  { name: "Supply Chain Pro", sent: 203, openRate: 40.8, clickRate: 8.3, conversionRate: 1.5 },
]

const deviceData = [
  { name: "Desktop", value: 65, color: "#3b82f6" },
  { name: "Mobile", value: 28, color: "#10b981" },
  { name: "Tablet", value: 7, color: "#f59e0b" },
]

const timeData = [
  { hour: "6AM", opens: 12, clicks: 2 },
  { hour: "9AM", opens: 45, clicks: 8 },
  { hour: "12PM", opens: 38, clicks: 6 },
  { hour: "3PM", opens: 52, clicks: 11 },
  { hour: "6PM", opens: 28, clicks: 4 },
  { hour: "9PM", opens: 15, clicks: 2 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")
  const [selectedMetric, setSelectedMetric] = useState("all")

  const totalSent = performanceData.reduce((acc, day) => acc + day.sent, 0)
  const totalOpened = performanceData.reduce((acc, day) => acc + day.opened, 0)
  const totalClicked = performanceData.reduce((acc, day) => acc + day.clicked, 0)
  const totalConverted = performanceData.reduce((acc, day) => acc + day.converted, 0)

  const avgOpenRate = ((totalOpened / totalSent) * 100).toFixed(1)
  const avgClickRate = ((totalClicked / totalOpened) * 100).toFixed(1)
  const avgConversionRate = ((totalConverted / totalClicked) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Analytics</h1>
          <p className="text-muted-foreground">
            Track the performance of your outreach campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2.3% improvement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgClickRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +1.1% improvement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgConversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1" />
              -0.5% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">$24.5K</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +18% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">324%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +45% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>
                  Email performance over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      name="Sent"
                    />
                    <Area
                      type="monotone"
                      dataKey="opened"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      name="Opened"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicked"
                      stackId="3"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      name="Clicked"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
                <CardDescription>
                  Best performing campaigns by conversion rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversionRate" fill="#8b5cf6" name="Conversion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Detailed performance metrics for each campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignPerformance.map((campaign, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{campaign.name}</h3>
                      <Badge variant="outline">{campaign.sent} sent</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Open Rate:</span>
                        <div className="font-medium text-blue-600">{campaign.openRate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Click Rate:</span>
                        <div className="font-medium text-green-600">{campaign.clickRate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversion Rate:</span>
                        <div className="font-medium text-purple-600">{campaign.conversionRate}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>
                  How users are interacting with your emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="opened"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Opens"
                    />
                    <Line
                      type="monotone"
                      dataKey="clicked"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Clicks"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
                <CardDescription>
                  Key findings and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Strong Open Rates</p>
                    <p className="text-sm text-green-700">
                      Your subject lines are performing well above industry average.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <MousePointer className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Click Optimization</p>
                    <p className="text-sm text-blue-700">
                      Consider A/B testing CTAs to improve click-through rates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-800">Conversion Focus</p>
                    <p className="text-sm text-purple-700">
                      Landing page optimization could improve conversion rates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>
                  Email opens by device type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Optimization</CardTitle>
                <CardDescription>
                  Recommendations for different devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Desktop (65%)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Primary device - ensure full desktop experience with detailed content.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Mobile (28%)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Optimize for mobile with responsive design and concise content.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Tablet (7%)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consider tablet layout for better reading experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Best Send Times</CardTitle>
              <CardDescription>
                Email engagement by time of day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opens" fill="#3b82f6" name="Opens" />
                  <Bar dataKey="clicks" fill="#10b981" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timing Recommendations</CardTitle>
              <CardDescription>
                Optimal send times based on your audience behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Best Time</h3>
                  <p className="text-sm text-muted-foreground">3:00 PM - 6:00 PM</p>
                  <p className="text-xs text-green-600 mt-1">Highest engagement</p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Best Day</h3>
                  <p className="text-sm text-muted-foreground">Tuesday, Wednesday</p>
                  <p className="text-xs text-blue-600 mt-1">Consistent performance</p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Frequency</h3>
                  <p className="text-sm text-muted-foreground">2-3 times per week</p>
                  <p className="text-xs text-purple-600 mt-1">Optimal for engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
