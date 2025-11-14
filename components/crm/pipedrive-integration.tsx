"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { fetchWithCsrf } from '@/lib/client-fetch'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap,
  ArrowRightLeft
} from "lucide-react"
import { toast } from "sonner"

interface PipedriveIntegrationProps {
  dealId: string
}

interface SyncStatus {
  configured: boolean
  deal_synced: boolean
  pipedrive_id?: number
  pipedrive_url?: string
}

export function PipedriveIntegration({ dealId }: PipedriveIntegrationProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  // Use Sonner toast (Toaster is provided in app/layout)

  useEffect(() => {
    checkSyncStatus()
  }, [dealId])

  const checkSyncStatus = async () => {
    try {
      const response = await fetch(`/api/crm/pipedrive/sync?dealId=${dealId}`)
      const data = await response.json()
      setSyncStatus(data)
    } catch (error) {
      console.error('Failed to check sync status:', error)
    }
  }

  const syncToPipedrive = async () => {
    setSyncing(true)
    try {
      const response = await fetchWithCsrf('/api/crm/pipedrive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          syncDirection: 'to_pipedrive'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Sync Successful: Deal ${data?.result?.action ?? "updated"} in Pipedrive`)
        checkSyncStatus() // Refresh status
      } else {
        toast.error(data?.error || "Failed to sync with Pipedrive")
      }
    } catch (error) {
      toast.error("Sync Error: Failed to communicate with Pipedrive")
    } finally {
      setSyncing(false)
    }
  }

  const openInPipedrive = () => {
    if (syncStatus?.pipedrive_url) {
      window.open(syncStatus.pipedrive_url, '_blank')
    }
  }

  if (!syncStatus) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking Pipedrive status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!syncStatus.configured) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Pipedrive Not Configured</CardTitle>
          </div>
          <CardDescription>
            Connect your Pipedrive account to sync deals automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              To enable CRM integration:
            </div>
            <ol className="text-sm space-y-1 ml-4">
              <li>1. Get your API token from Pipedrive Settings</li>
              <li>2. Set <code className="bg-muted px-1 rounded">PIPEDRIVE_API_TOKEN</code> in environment</li>
              <li>3. Configure webhooks for real-time sync</li>
            </ol>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure Pipedrive
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Pipedrive Integration</CardTitle>
          </div>
          <Badge variant={syncStatus.deal_synced ? "default" : "secondary"}>
            {syncStatus.deal_synced ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Synced
              </>
            ) : (
              'Not Synced'
            )}
          </Badge>
        </div>
        <CardDescription>
          Sync this deal with your Pipedrive CRM
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Sync Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${syncStatus.deal_synced ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium">
                {syncStatus.deal_synced ? 'Synced with Pipedrive' : 'Not synced'}
              </span>
            </div>
            {syncStatus.pipedrive_id && (
              <span className="text-xs text-muted-foreground">
                ID: {syncStatus.pipedrive_id}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={syncToPipedrive}
              disabled={syncing}
              size="sm"
              className="flex-1"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {syncStatus.deal_synced ? 'Update in Pipedrive' : 'Sync to Pipedrive'}
                </>
              )}
            </Button>

            {syncStatus.deal_synced && (
              <Button
                onClick={openInPipedrive}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Sync Information */}
          {syncStatus.deal_synced && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Deal is automatically synced with Pipedrive</div>
              <div>• Changes in either system will be reflected</div>
              <div>• Real-time updates via webhooks</div>
            </div>
          )}

          {/* Last Sync Info */}
          <div className="text-xs text-muted-foreground border-t pt-2">
            <div className="flex items-center justify-between">
              <span>Status: Connected</span>
              <span>Last check: Just now</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
