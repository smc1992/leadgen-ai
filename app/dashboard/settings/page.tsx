"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, ExternalLink, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BlotatoAccounts {
  twitter: string
  linkedin: string
  facebook: string
  instagram: string
  tiktok: string
  pinterest: string
  threads: string
  bluesky: string
  youtube: string
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<BlotatoAccounts>({
    twitter: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    pinterest: '',
    threads: '',
    bluesky: '',
    youtube: '',
  })

  const [apiKey, setApiKey] = useState('')

  // Load saved settings
  useEffect(() => {
    const savedAccounts = localStorage.getItem('blotato_accounts')
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts))
    }

    const savedApiKey = localStorage.getItem('blotato_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('blotato_accounts', JSON.stringify(accounts))
    if (apiKey) {
      localStorage.setItem('blotato_api_key', apiKey)
    }
    toast.success("Settings saved successfully!")
  }

  const handleAccountChange = (platform: keyof BlotatoAccounts, value: string) => {
    setAccounts(prev => ({
      ...prev,
      [platform]: value
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your Blotato API integration
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Setup Instructions</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>1. Go to <a href="https://my.blotato.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
            Blotato Settings <ExternalLink className="h-3 w-3" />
          </a></p>
          <p>2. Connect your social media accounts</p>
          <p>3. Copy each Account ID (format: acc_xxxxx) and paste below</p>
          <p>4. Generate an API Key and add it to your .env.local file</p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Blotato Account IDs</CardTitle>
          <CardDescription>
            Enter the Account IDs for each platform you want to post to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter Account ID</Label>
              <Input
                id="twitter"
                placeholder="acc_xxxxx"
                value={accounts.twitter}
                onChange={(e) => handleAccountChange('twitter', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Account ID</Label>
              <Input
                id="linkedin"
                placeholder="acc_xxxxx"
                value={accounts.linkedin}
                onChange={(e) => handleAccountChange('linkedin', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook Account ID</Label>
              <Input
                id="facebook"
                placeholder="acc_xxxxx"
                value={accounts.facebook}
                onChange={(e) => handleAccountChange('facebook', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Account ID</Label>
              <Input
                id="instagram"
                placeholder="acc_xxxxx"
                value={accounts.instagram}
                onChange={(e) => handleAccountChange('instagram', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok Account ID</Label>
              <Input
                id="tiktok"
                placeholder="acc_xxxxx"
                value={accounts.tiktok}
                onChange={(e) => handleAccountChange('tiktok', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pinterest">Pinterest Account ID</Label>
              <Input
                id="pinterest"
                placeholder="acc_xxxxx"
                value={accounts.pinterest}
                onChange={(e) => handleAccountChange('pinterest', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threads">Threads Account ID</Label>
              <Input
                id="threads"
                placeholder="acc_xxxxx"
                value={accounts.threads}
                onChange={(e) => handleAccountChange('threads', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bluesky">Bluesky Account ID</Label>
              <Input
                id="bluesky"
                placeholder="acc_xxxxx"
                value={accounts.bluesky}
                onChange={(e) => handleAccountChange('bluesky', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube Account ID</Label>
              <Input
                id="youtube"
                placeholder="acc_xxxxx"
                value={accounts.youtube}
                onChange={(e) => handleAccountChange('youtube', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Your Blotato API key should be stored in .env.local
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-mono text-sm">BLOTATO_API_KEY=your_api_key_here</p>
              <p className="mt-2 text-xs">Add this to your .env.local file in the project root</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Quick Links</Label>
            <div className="flex flex-col gap-2">
              <a 
                href="https://my.blotato.com/settings" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Blotato Settings
              </a>
              <a 
                href="https://my.blotato.com/api-dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                API Dashboard (Monitoring)
              </a>
              <a 
                href="https://help.blotato.com/api/start" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                API Documentation
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
