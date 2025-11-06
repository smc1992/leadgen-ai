"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Mock data
const leadsPerWeek = [
  { week: "KW40", leads: 120 },
  { week: "KW41", leads: 240 },
  { week: "KW42", leads: 190 },
  { week: "KW43", leads: 280 },
  { week: "KW44", leads: 320 },
]

const campaignPerformance = [
  { name: "Air Freight USA", sent: 250, opened: 142, replied: 12 },
  { name: "Supply Chain DE", sent: 180, opened: 95, replied: 8 },
  { name: "Nigeria Logistics", sent: 120, opened: 68, replied: 5 },
]

const emailValidation = [
  { name: "Valid", value: 1247, color: "#10b981" },
  { name: "Invalid", value: 342, color: "#ef4444" },
  { name: "Unknown", value: 954, color: "#6b7280" },
]

const contentEngagement = [
  { platform: "LinkedIn", views: 4200, likes: 320, comments: 45 },
  { platform: "Facebook", views: 2800, likes: 180, comments: 28 },
  { platform: "Instagram", views: 3500, likes: 420, comments: 62 },
]

const regionDistribution = [
  { name: "USA", value: 890, color: "#3b82f6" },
  { name: "Germany", value: 654, color: "#8b5cf6" },
  { name: "Nigeria", value: 432, color: "#f59e0b" },
  { name: "UK", value: 287, color: "#ec4899" },
  { name: "Others", value: 280, color: "#6b7280" },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track performance metrics and insights
        </p>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leads Per Week</CardTitle>
                <CardDescription>
                  New leads imported over the last 5 weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={leadsPerWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Validation Status</CardTitle>
                <CardDescription>
                  Distribution of email validation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={emailValidation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {emailValidation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Leads by Region</CardTitle>
                <CardDescription>
                  Geographic distribution of your lead database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6">
                      {regionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="outreach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Email metrics across active campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={campaignPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                  <Bar dataKey="opened" fill="#10b981" name="Opened" />
                  <Bar dataKey="replied" fill="#8b5cf6" name="Replied" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Average Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">56.8%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Above industry average of 21%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Reply Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">4.5%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Industry average: 1-3%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-600">2.1%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Below threshold of 5%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Engagement by Platform</CardTitle>
              <CardDescription>
                Views, likes, and comments across social channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={contentEngagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3b82f6" name="Views" />
                  <Bar dataKey="likes" fill="#10b981" name="Likes" />
                  <Bar dataKey="comments" fill="#8b5cf6" name="Comments" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">10,500</div>
                <p className="text-sm text-muted-foreground mt-2">
                  +23% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">8.7%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Above average performance
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Best Performing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Instagram</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Highest engagement rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
