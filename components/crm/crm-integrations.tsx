"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  RefreshCw,
  Link as LinkIcon,
  Unlink
} from "lucide-react"
import { toast } from "sonner"

interface CRMStatus {
  pipedrive: {
    configured: boolean
    connected: boolean
    user?: any
  }
  hubspot?: {
    configured: boolean
    connected: boolean
  }
  salesforce?: {
    configured: boolean
    connected: boolean
  }
}

export function CRMIntegrations() {
  const [crmStatus, setCrmStatus] = useState<CRMStatus>({
    pipedrive: { configured: false, connected: false }
  })
  const [loading, setLoading] = useState(true)
  const [setupMode, setSetupMode] = useState<string | null>(null)
  const [apiToken, setApiToken] = useState("")
  // Using Sonner toast (provider is present in app/layout)

  useEffect(() => {
    checkCRMStatus()
  }, [])

  const checkCRMStatus = async () => {
    try {
      // Check Pipedrive status
      const pipedriveResponse = await fetch('/api/crm/pipedrive/config')
      const pipedriveData = await pipedriveResponse.json()

      setCrmStatus({
        pipedrive: {
          configured: pipedriveData.config?.api_token === 'configured',
          connected: pipedriveData.connection_status === 'connected',
          user: pipedriveData.user
        }
      })
    } catch (error) {
      console.error('Failed to check CRM status:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupPipedrive = async () => {
    if (!apiToken.trim()) {
      toast.error("Please enter your Pipedrive API token")
      return
    }

    try {
      const response = await fetch('/api/crm/pipedrive/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_token: apiToken,
          setup_webhooks: true
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Pipedrive connected successfully")
        setSetupMode(null)
        setApiToken("")
        checkCRMStatus()
      } else {
        toast.error(data?.message || data?.error || "Connection failed")
      }
    } catch (error) {
      toast.error("Failed to connect to Pipedrive")
    }
  }

  const disconnectPipedrive = async () => {
    // In a real implementation, you'd remove the API token from environment
    // For now, we'll just update the UI
    toast("Disconnected", { description: "Pipedrive integration has been disabled" })
    setCrmStatus(prev => ({
      ...prev,
      pipedrive: { configured: false, connected: false }
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CRM Integrations</h1>
          <p className="text-muted-foreground">Loading CRM status...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
      <div>
        <h1 className="text-3xl font-bold">CRM Integrations</h1>
        <p className="text-muted-foreground">
          Connect your favorite CRM tools for seamless deal synchronization
        </p>
      </div>

      {/* Setup Instructions */}
      {setupMode && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup {setupMode}
            </CardTitle>
            <CardDescription>
              Enter your {setupMode} credentials to enable integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupMode === 'Pipedrive' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api-token">API Token</Label>
                  <Input
                    id="api-token"
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Enter your Pipedrive API token"
                  />
                  <p className="text-sm text-muted-foreground">
                    Get your API token from Pipedrive Settings → Personal Preferences → API
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={setupPipedrive}>
                    Connect Pipedrive
                  </Button>
                  <Button variant="outline" onClick={() => setSetupMode(null)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* CRM Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pipedrive */}
        <Card className={`transition-all duration-300 ${
          crmStatus.pipedrive.connected
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50'
            : crmStatus.pipedrive.configured
            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/50'
            : 'border-gray-200'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">P</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Pipedrive</CardTitle>
                  <CardDescription>Sales CRM & Pipeline</CardDescription>
                </div>
              </div>
              <Badge variant={
                crmStatus.pipedrive.connected ? "default" :
                crmStatus.pipedrive.configured ? "secondary" : "outline"
              }>
                {crmStatus.pipedrive.connected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : crmStatus.pipedrive.configured ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Configured
                  </>
                ) : (
                  'Not Connected'
                )}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {crmStatus.pipedrive.user && (
              <div className="text-sm text-muted-foreground">
                Connected as: <strong>{crmStatus.pipedrive.user.name}</strong>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Bidirektionale Deal-Synchronisation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Real-time Webhook Updates</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Contact & Company Sync</span>
              </div>
            </div>

            <div className="flex gap-2">
              {crmStatus.pipedrive.connected ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm" onClick={disconnectPipedrive}>
                    <Unlink className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setSetupMode('Pipedrive')}
                  className="w-full"
                  size="sm"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect Pipedrive
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* HubSpot */}
        <Card className="border-gray-200 opacity-75">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">H</span>
                </div>
                <div>
                  <CardTitle className="text-lg">HubSpot</CardTitle>
                  <CardDescription>Marketing & Sales Hub</CardDescription>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              HubSpot CRM integration with contact scoring and workflow automation.
            </p>
            <Button disabled className="w-full" size="sm">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        {/* Salesforce */}
        <Card className="border-gray-200 opacity-75">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">S</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Salesforce</CardTitle>
                  <CardDescription>Enterprise CRM</CardDescription>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Salesforce integration with custom objects and advanced reporting.
            </p>
            <Button disabled className="w-full" size="sm">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integration Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integration Benefits
          </CardTitle>
          <CardDescription>
            What you get with CRM integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Automatic Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Deals sync bidirectionally between systems
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Real-time Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Changes reflect immediately via webhooks
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Data Consistency</h4>
                <p className="text-sm text-muted-foreground">
                  Single source of truth across all tools
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Team Collaboration</h4>
                <p className="text-sm text-muted-foreground">
                  Everyone works with the same data
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Advanced Reporting</h4>
                <p className="text-sm text-muted-foreground">
                  Unified analytics across platforms
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Workflow Automation</h4>
                <p className="text-sm text-muted-foreground">
                  Automated processes between systems
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
