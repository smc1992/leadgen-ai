"use client"

import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo
    })

    // Report to error tracking service
    this.reportError(error, errorInfo)
  }

  reportError = (error: Error, errorInfo: any) => {
    console.error('Global Error Boundary caught an error:', error, errorInfo)
    try {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    } catch {}
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="space-y-2">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-red-600">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              <Button onClick={this.handleGoHome} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Error ID: {Date.now().toString(36)}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// API Error Handler Hook
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

export function useApiErrorHandler() {
  const [lastError, setLastError] = useState<ApiError | null>(null)

  const handleApiError = useCallback((error: any, context?: string) => {
    let apiError: ApiError = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500
    }

    // Handle different error formats
    if (error?.response) {
      // Axios error
      apiError = {
        message: error.response.data?.message || error.message,
        code: error.response.data?.code,
        status: error.response.status,
        details: error.response.data
      }
    } else if (error?.message) {
      // Generic error
      apiError = {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error
      }
    } else if (typeof error === 'string') {
      apiError.message = error
    }

    setLastError(apiError)

    // Log to error tracking
    console.error(`API Error${context ? ` in ${context}` : ''}:`, apiError)

    // Show user-friendly toast
    const userMessage = getUserFriendlyMessage(apiError)
    toast.error(userMessage, {
      description: apiError.code && apiError.code !== 'UNKNOWN_ERROR' ? apiError.code : undefined,
      action: {
        label: 'Retry',
        onClick: () => {
          // Could implement retry logic here
          console.log('Retry requested for:', context)
        }
      }
    })

    return apiError
  }, [])

  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  return {
    lastError,
    handleApiError,
    clearError
  }
}

// User-friendly error messages
function getUserFriendlyMessage(error: ApiError): string {
  const { status, code, message } = error

  // Network errors
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection.'
  }

  // HTTP status codes
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.'
    case 401:
      return 'Authentication required. Please log in again.'
    case 403:
      return 'You don\'t have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'Server error. Our team has been notified. Please try again later.'
    case 503:
      return 'Service temporarily unavailable. Please try again later.'
  }

  // Specific error codes
  switch (code) {
    case 'EMAIL_SEND_FAILED':
      return 'Failed to send email. Please check your email settings.'
    case 'INVALID_API_KEY':
      return 'Invalid API key. Please check your configuration.'
    case 'RATE_LIMIT_EXCEEDED':
      return 'Rate limit exceeded. Please wait before trying again.'
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.'
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.'
  }

  // Return original message if it's user-friendly
  if (message && message.length < 100 && !message.includes('stack')) {
    return message
  }

  return 'Something went wrong. Please try again.'
}

// Async Error Boundary for Suspense
export function AsyncErrorBoundary({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <GlobalErrorBoundary
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <Card className="max-w-sm">
              <CardContent className="pt-6 text-center">
                <Bug className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-medium">Loading Error</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Failed to load this section
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }
    >
      {children}
    </GlobalErrorBoundary>
  )
}

// Utility function for error reporting
export function reportError(error: Error, context?: any) {
  console.error('Reported error:', error, context)
  try {
    Sentry.captureException(error, {
      tags: {
        component: 'error-handler'
      },
      extra: context
    })
  } catch {}
}

// Retry utility for failed API calls
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }

  throw lastError!
}
