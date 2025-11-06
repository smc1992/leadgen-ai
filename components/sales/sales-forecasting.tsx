"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ForecastData {
  forecasts: Array<{
    id: string
    period: string
    period_start: string
    period_end: string
    forecast_amount: number
    actual_amount: number
    confidence_percentage: number
  }>
  pipeline_metrics: {
    total_pipeline: number
    weighted_pipeline: number
    upcoming_deals_count: number
    average_deal_size: number
  }
}

export function SalesForecasting() {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const { toast } = useToast()

  useEffect(() => {
    fetchForecastData()
  }, [selectedPeriod, selectedYear])

  const fetchForecastData = async () => {
    try {
      const response = await fetch(`/api/sales/forecasting?period=${selectedPeriod}&year=${selectedYear}`)
      let data = await response.json()

      // If no forecast data exists, try to set it up
      if (!data.forecasts || data.forecasts.length === 0) {
        console.log('No forecast data found, setting up defaults...')
        const setupResponse = await fetch('/api/setup/forecasts', {
          method: 'POST'
        })

        if (setupResponse.ok) {
          // Refetch data after setup
          const newResponse = await fetch(`/api/sales/forecasting?period=${selectedPeriod}&year=${selectedYear}`)
          data = await newResponse.json()
        }
      }

      setForecastData(data)
    } catch (error) {
      console.error('Failed to fetch forecast data:', error)
      toast({
        title: "Error",
        description: "Failed to load forecast data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const calculateForecastAccuracy = () => {
    if (!forecastData?.forecasts?.length) return 0

    const completedForecasts = forecastData.forecasts.filter(f => f.actual_amount > 0)
    if (completedForecasts.length === 0) return 0

    const totalAccuracy = completedForecasts.reduce((acc, forecast) => {
      const accuracy = forecast.actual_amount / forecast.forecast_amount
      return acc + Math.min(accuracy, 2) // Cap at 200% to avoid outliers
    }, 0)

    return Math.round((totalAccuracy / completedForecasts.length) * 100)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Forecasting</h1>
            <p className="text-muted-foreground">Loading forecast data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const accuracy = calculateForecastAccuracy()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Forecasting</h1>
          <p className="text-muted-foreground">
            Predict and track your sales performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Update Forecast
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pipeline</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(forecastData?.pipeline_metrics?.total_pipeline ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weighted Pipeline</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(forecastData?.pipeline_metrics?.weighted_pipeline ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on win probabilities
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
                <p className="text-sm font-medium text-muted-foreground">Upcoming Deals</p>
                <p className="text-2xl font-bold">
                  {forecastData?.pipeline_metrics?.upcoming_deals_count ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Closing this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forecast Accuracy</p>
                <p className="text-2xl font-bold">{accuracy}%</p>
                <div className="flex items-center mt-1">
                  {accuracy >= 90 ? (
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {accuracy >= 90 ? 'Excellent' : accuracy >= 70 ? 'Good' : 'Needs improvement'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast vs Actual Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast vs Actual Performance</CardTitle>
          <CardDescription>
            Compare your forecasted amounts with actual closed deals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(forecastData?.forecasts ?? []).map((forecast) => {
              const actualPercentage = forecast.actual_amount > 0
                ? (forecast.actual_amount / forecast.forecast_amount) * 100
                : 0

              return (
                <div key={forecast.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {new Date(forecast.period_start).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <Badge variant="outline">
                        {forecast.confidence_percentage}% confidence
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(forecast.actual_amount)} / {formatCurrency(forecast.forecast_amount)}
                      </p>
                      <p className={`text-xs ${actualPercentage >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {actualPercentage.toFixed(1)}% of forecast
                      </p>
                    </div>
                  </div>

                  <Progress
                    value={Math.min(actualPercentage, 100)}
                    className="h-2"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>Forecast: {formatCurrency(forecast.forecast_amount)}</span>
                    <span>100%</span>
                  </div>
                </div>
              )
            })}

            {(!forecastData?.forecasts || forecastData.forecasts.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No forecast data available for the selected period</p>
                <Button className="mt-4">
                  Create Your First Forecast
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Health</CardTitle>
            <CardDescription>Analysis of your sales pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Average Deal Size</span>
                <span className="font-medium">
                  {formatCurrency(forecastData?.pipeline_metrics?.average_deal_size ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pipeline Coverage</span>
                <span className="font-medium">
                  {forecastData?.pipeline_metrics?.total_pipeline ?
                    Math.round(((forecastData?.pipeline_metrics?.weighted_pipeline ?? 0) / (forecastData?.pipeline_metrics?.total_pipeline || 1)) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Deals Closing Soon</span>
                <span className="font-medium">
                  {forecastData?.pipeline_metrics?.upcoming_deals_count ?? 0} deals
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecast Recommendations</CardTitle>
            <CardDescription>AI-powered insights for better forecasting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Increase Confidence</p>
                <p className="text-xs text-blue-700">
                  Add more historical data to improve forecast accuracy
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">Pipeline Optimization</p>
                <p className="text-xs text-green-700">
                  Focus on deals with 60%+ win probability
                </p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-900">Seasonal Trends</p>
                <p className="text-xs text-orange-700">
                  Consider Q4 seasonality in your forecasts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
