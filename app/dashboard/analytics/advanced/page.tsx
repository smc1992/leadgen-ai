"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Download, Plus, Filter, TrendingUp, Users, Target, Calendar, BarChart3, PieChartIcon, Activity } from "lucide-react"
import { toast } from "sonner"

// Mock advanced analytics data
const leadScoringPrediction = [
  { score: 0, actual: 0.05, predicted: 0.03 },
  { score: 10, actual: 0.08, predicted: 0.07 },
  { score: 20, actual: 0.12, predicted: 0.11 },
  { score: 30, actual: 0.18, predicted: 0.16 },
  { score: 40, actual: 0.25, predicted: 0.23 },
  { score: 50, actual: 0.35, predicted: 0.33 },
  { score: 60, actual: 0.48, predicted: 0.45 },
  { score: 70, actual: 0.62, predicted: 0.58 },
  { score: 80, actual: 0.78, predicted: 0.75 },
  { score: 90, actual: 0.88, predicted: 0.85 },
  { score: 100, actual: 0.95, predicted: 0.92 },
]

const cohortAnalysis = [
  { cohort: "Jan 2024", week0: 100, week1: 85, week2: 72, week3: 65, week4: 58 },
  { cohort: "Feb 2024", week0: 120, week1: 98, week2: 88, week3: 78, week4: 0 },
  { cohort: "Mar 2024", week0: 95, week1: 82, week2: 74, week3: 0, week4: 0 },
  { cohort: "Apr 2024", week0: 110, week1: 95, week2: 0, week3: 0, week4: 0 },
]

const optimalSendTimes = [
  { hour: "9:00", monday: 85, tuesday: 92, wednesday: 78, thursday: 88, friday: 65 },
  { hour: "10:00", monday: 92, tuesday: 88, wednesday: 95, thursday: 82, friday: 72 },
  { hour: "11:00", monday: 78, tuesday: 85, wednesday: 88, thursday: 95, friday: 68 },
  { hour: "14:00", monday: 88, tuesday: 78, wednesday: 92, thursday: 85, friday: 75 },
  { hour: "15:00", monday: 95, tuesday: 82, wednesday: 85, thursday: 78, friday: 82 },
  { hour: "16:00", monday: 82, tuesday: 95, wednesday: 78, thursday: 92, friday: 88 },
]

const churnRiskData = [
  { segment: "High Risk", count: 45, percentage: 12 },
  { segment: "Medium Risk", count: 120, percentage: 32 },
  { segment: "Low Risk", count: 185, percentage: 49 },
  { segment: "No Risk", count: 25, percentage: 7 },
]

export default function AdvancedAnalyticsPage() {
  const [selectedReport, setSelectedReport] = useState("predictive")

  const handleExportReport = () => {
    toast.success("Report exported successfully!", {
      description: "Your advanced analytics report has been downloaded."
    })
  }

  const handleCreateCustomReport = () => {
    toast.info("Custom report builder coming soon!")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Predictive insights, custom reports, and cohort analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateCustomReport}>
            <Plus className="mr-2 h-4 w-4" />
            Custom Report
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <Label>Date Range</Label>
              <Select defaultValue="30days">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label>Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="predictive">Predictive Analytics</SelectItem>
                  <SelectItem value="cohort">Cohort Analysis</SelectItem>
                  <SelectItem value="timing">Optimal Send Times</SelectItem>
                  <SelectItem value="churn">Churn Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label>Region</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="usa">USA</SelectItem>
                  <SelectItem value="germany">Germany</SelectItem>
                  <SelectItem value="nigeria">Nigeria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="cohort" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cohorts
          </TabsTrigger>
          <TabsTrigger value="timing" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Send Times
          </TabsTrigger>
          <TabsTrigger value="churn" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Churn Risk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictive" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Lead Scoring Accuracy
                </CardTitle>
                <CardDescription>
                  Predicted vs actual conversion rates by score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={leadScoringPrediction}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="score" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${(Number(value) * 100).toFixed(1)}%`, name === 'actual' ? 'Actual' : 'Predicted']} />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Predictions</CardTitle>
                <CardDescription>
                  Machine learning insights for lead quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Next Week Lead Volume</p>
                    <p className="text-sm text-muted-foreground">Based on historical patterns</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">+12%</p>
                    <p className="text-sm text-muted-foreground">245 leads expected</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Best Performing Industry</p>
                    <p className="text-sm text-muted-foreground">This month</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-blue-600">Manufacturing</Badge>
                    <p className="text-sm text-muted-foreground">32% conversion rate</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Email Response Peak</p>
                    <p className="text-sm text-muted-foreground">Optimal timing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">Wed 10:00</p>
                    <p className="text-sm text-muted-foreground">+45% open rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cohort" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lead Acquisition Cohorts
              </CardTitle>
              <CardDescription>
                Track lead quality and engagement over time by acquisition month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cohortAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cohort" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Retention']} />
                  <Legend />
                  <Area type="monotone" dataKey="week0" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Week 0" />
                  <Area type="monotone" dataKey="week1" stackId="1" stroke="#10b981" fill="#10b981" name="Week 1" />
                  <Area type="monotone" dataKey="week2" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Week 2" />
                  <Area type="monotone" dataKey="week3" stackId="1" stroke="#ef4444" fill="#ef4444" name="Week 3" />
                  <Area type="monotone" dataKey="week4" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Week 4" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Optimal Email Send Times
              </CardTitle>
              <CardDescription>
                Best performing send times by day and hour (open rates %)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={optimalSendTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Open Rate']} />
                  <Legend />
                  <Bar dataKey="monday" fill="#3b82f6" name="Monday" />
                  <Bar dataKey="tuesday" fill="#10b981" name="Tuesday" />
                  <Bar dataKey="wednesday" fill="#f59e0b" name="Wednesday" />
                  <Bar dataKey="thursday" fill="#ef4444" name="Thursday" />
                  <Bar dataKey="friday" fill="#8b5cf6" name="Friday" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Best Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Wednesday</div>
                <p className="text-xs text-muted-foreground">Highest average open rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Best Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">10:00 AM</div>
                <p className="text-xs text-muted-foreground">Peak engagement hour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Worst Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">Friday</div>
                <p className="text-xs text-muted-foreground">Lowest engagement</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="churn" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Churn Risk Distribution
                </CardTitle>
                <CardDescription>
                  Lead segments by churn probability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={churnRiskData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {churnRiskData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.segment === 'High Risk' ? '#ef4444' :
                            entry.segment === 'Medium Risk' ? '#f59e0b' :
                            entry.segment === 'Low Risk' ? '#10b981' : '#6b7280'
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Mitigation Actions</CardTitle>
                <CardDescription>
                  Recommended actions to reduce churn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="h-2 w-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-red-700">High Risk Leads (45)</p>
                    <p className="text-sm text-muted-foreground">Immediate follow-up required</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Send Re-engagement Email
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-yellow-700">Medium Risk Leads (120)</p>
                    <p className="text-sm text-muted-foreground">Monitor closely</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Add to Nurture Sequence
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-green-700">Low Risk Leads (185)</p>
                    <p className="text-sm text-muted-foreground">Stable engagement</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Continue Standard Outreach
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
