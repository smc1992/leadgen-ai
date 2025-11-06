"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Zap,
  HardDrive,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Code,
  Image,
  Package,
  RefreshCw,
  Download,
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"

// Mock performance data
const bundleData = [
  { name: 'Main Bundle', size: 245, compressed: 89, chunks: 12 },
  { name: 'Vendor Libraries', size: 1800, compressed: 650, chunks: 8 },
  { name: 'UI Components', size: 320, compressed: 120, chunks: 15 },
  { name: 'Charts & Analytics', size: 450, compressed: 180, chunks: 6 },
  { name: 'Email Templates', size: 95, compressed: 35, chunks: 4 },
]

const performanceMetrics = [
  {
    metric: 'First Contentful Paint',
    value: 1.2,
    target: 1.8,
    unit: 's',
    status: 'good',
    trend: 'down'
  },
  {
    metric: 'Largest Contentful Paint',
    value: 2.1,
    target: 2.5,
    unit: 's',
    status: 'good',
    trend: 'down'
  },
  {
    metric: 'First Input Delay',
    value: 45,
    target: 100,
    unit: 'ms',
    status: 'good',
    trend: 'down'
  },
  {
    metric: 'Cumulative Layout Shift',
    value: 0.08,
    target: 0.1,
    unit: '',
    status: 'good',
    trend: 'stable'
  }
]

const lighthouseScores = [
  { category: 'Performance', score: 92, color: '#10b981' },
  { category: 'Accessibility', score: 88, color: '#f59e0b' },
  { category: 'Best Practices', score: 95, color: '#10b981' },
  { category: 'SEO', score: 90, color: '#10b981' },
]

const loadTimeData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  pageLoad: 1800 + Math.random() * 400,
  firstPaint: 1200 + Math.random() * 300,
  domContent: 800 + Math.random() * 200,
}))

export default function PerformanceDashboardPage() {
  const [bundleAnalysis, setBundleAnalysis] = useState(bundleData)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState(new Date())

  const handleRunBundleAnalysis = async () => {
    setIsAnalyzing(true)
    // Simulate bundle analysis
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Update with "new" data
    const updatedData = bundleData.map(item => ({
      ...item,
      size: item.size + Math.floor(Math.random() * 20) - 10,
      compressed: item.compressed + Math.floor(Math.random() * 8) - 4
    }))

    setBundleAnalysis(updatedData)
    setLastAnalysis(new Date())
    setIsAnalyzing(false)
  }

  const totalBundleSize = bundleAnalysis.reduce((acc, item) => acc + item.size, 0)
  const totalCompressedSize = bundleAnalysis.reduce((acc, item) => acc + item.compressed, 0)
  const compressionRatio = ((totalBundleSize - totalCompressedSize) / totalBundleSize * 100).toFixed(1)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and optimize your application's performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunBundleAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalBundleSize / 1024).toFixed(1)} MB</div>
            <p className="text-xs text-muted-foreground">
              {compressionRatio}% compressed to {(totalCompressedSize / 1024).toFixed(1)} MB
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.8s</div>
            <p className="text-xs text-muted-foreground">
              Average page load time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lighthouse Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">91</div>
            <p className="text-xs text-muted-foreground">
              Overall performance score
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Core Web Vitals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">
              All metrics passing
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
          <TabsTrigger value="lighthouse">Lighthouse</TabsTrigger>
          <TabsTrigger value="timeline">Load Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Key performance metrics measured by Google
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceMetrics.map((metric) => (
                  <div key={metric.metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(metric.status)}
                        <span className="font-medium">{metric.metric}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                          {metric.value}{metric.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Target: {metric.target}{metric.unit}
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={(metric.target - metric.value) / metric.target * 100}
                      className="h-2"
                    />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-600" />}
                      {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-600" />}
                      {metric.trend === 'stable' && <div className="h-3 w-3 rounded-full bg-gray-400" />}
                      <span>
                        {metric.trend === 'down' ? 'Improving' :
                         metric.trend === 'up' ? 'Needs attention' : 'Stable'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Great performance!</strong> All Core Web Vitals are within Google's recommended ranges.
              Your app should provide a fast, smooth user experience.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="bundle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Size Analysis</CardTitle>
              <CardDescription>
                Breakdown of your application's JavaScript bundles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Last analysis: {lastAnalysis.toLocaleString()}</span>
                  <Badge variant="outline">
                    {bundleAnalysis.length} bundles • {compressionRatio}% compression
                  </Badge>
                </div>

                <div className="space-y-3">
                  {bundleAnalysis.map((bundle, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{bundle.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {bundle.chunks} chunks
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Size: {(bundle.size / 1024).toFixed(2)} MB</span>
                          <span>Compressed: {(bundle.compressed / 1024).toFixed(2)} MB</span>
                          <span className="text-green-600">
                            {((bundle.size - bundle.compressed) / bundle.size * 100).toFixed(1)}% saved
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bundle Size Trend</CardTitle>
              <CardDescription>
                Track bundle size changes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={loadTimeData.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="pageLoad"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    name="Total Bundle Size (KB)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lighthouse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lighthouse Performance Scores</CardTitle>
              <CardDescription>
                Automated performance audits and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {lighthouseScores.map((score, index) => (
                  <div key={index} className="text-center">
                    <div
                      className="relative w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: score.color }}
                    >
                      {score.score}
                    </div>
                    <div className="text-sm font-medium">{score.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {score.score >= 90 ? 'Excellent' :
                       score.score >= 70 ? 'Good' :
                       score.score >= 50 ? 'Needs work' : 'Poor'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to improve your scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Excellent Image Optimization</p>
                    <p className="text-sm text-green-700">
                      All images are properly optimized with WebP/AVIF formats and lazy loading.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Bundle Splitting Active</p>
                    <p className="text-sm text-blue-700">
                      Code splitting is enabled for vendor libraries and large components.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Consider CDN Integration</p>
                    <p className="text-sm text-yellow-700">
                      Implementing a CDN could further reduce load times by 15-20%.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Load Time Timeline</CardTitle>
              <CardDescription>
                Performance metrics over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={loadTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}ms`, '']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pageLoad"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Page Load Time"
                  />
                  <Line
                    type="monotone"
                    dataKey="firstPaint"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="First Paint"
                  />
                  <Line
                    type="monotone"
                    dataKey="domContent"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="DOM Content Loaded"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-green-800">Fastest Load Time</div>
                    <div className="text-sm text-green-600">1.2s on Day 15</div>
                  </div>
                  <TrendingDown className="h-5 w-5 text-green-600" />
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-800">Average Performance</div>
                    <div className="text-sm text-blue-600">1.8s load time</div>
                  </div>
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium text-yellow-800">Peak Usage Times</div>
                    <div className="text-sm text-yellow-600">9-11 AM, 2-4 PM</div>
                  </div>
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Image className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Image Optimization</p>
                    <p className="text-xs text-muted-foreground">Potential 200KB savings</p>
                  </div>
                  <Badge variant="outline">Low effort</Badge>
                </div>

                <div className="flex items-center gap-3">
                  <Code className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Code Splitting</p>
                    <p className="text-xs text-muted-foreground">Reduce initial bundle by 25%</p>
                  </div>
                  <Badge variant="outline">Medium effort</Badge>
                </div>

                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Caching Strategy</p>
                    <p className="text-xs text-muted-foreground">Implement service worker</p>
                  </div>
                  <Badge variant="outline">High impact</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
