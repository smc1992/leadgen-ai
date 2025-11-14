"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Video, Image, Calendar, Sparkles, Info, Settings, ExternalLink, Share2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/utils/date"
import { TextGeneratorWizard } from "@/components/content/text-generator-wizard"
import { VideoGeneratorWizard } from "@/components/content/video-generator-wizard"
import { ImageGeneratorWizard } from "@/components/content/image-generator-wizard"
import { toast } from "sonner"

// Mock data
const mockContent = [
  {
    id: "1",
    type: "text" as const,
    title: "Air Freight Advantages: Germany to USA",
    platform: ["linkedin", "facebook"],
    status: "published" as const,
    schedule_at: "2025-10-28T08:00:00Z",
    engagement: { views: 1240, likes: 85, comments: 12 },
  },
  {
    id: "2",
    type: "video" as const,
    title: "Supply Chain Optimization Tips",
    platform: ["linkedin", "instagram"],
    status: "scheduled" as const,
    schedule_at: "2025-11-01T10:30:00Z",
    engagement: { views: 0, likes: 0, comments: 0 },
  },
  {
    id: "3",
    type: "text" as const,
    title: "Nigeria Logistics Market Update",
    platform: ["linkedin"],
    status: "draft" as const,
    schedule_at: null,
    engagement: { views: 0, likes: 0, comments: 0 },
  },
]

export default function ContentPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [contentType, setContentType] = useState<"text" | "video">("text")
  const [textGeneratorOpen, setTextGeneratorOpen] = useState(false)
  const [videoGeneratorOpen, setVideoGeneratorOpen] = useState(false)
  const [imageGeneratorOpen, setImageGeneratorOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [env, setEnv] = useState<any>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishForm, setPublishForm] = useState({
    accountId: '',
    platform: 'twitter',
    text: '',
    mediaUrls: '',
    scheduledTime: '',
    pageId: '',
    mediaType: '' as string,
    useNextFreeSlot: false
  })

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkEnv = async () => {
      try {
        const res = await fetch('/api/test-env')
        const json = await res.json()
        setEnv(json)
      } catch {}
    }
    checkEnv()
  }, [])

  const getStatusBadge = (status: string) => {
    if (status === "published") return <Badge className="bg-green-600">Published</Badge>
    if (status === "scheduled") return <Badge className="bg-blue-600">Scheduled</Badge>
    return <Badge variant="outline">Draft</Badge>
  }

  const getTypeIcon = (type: string) => {
    if (type === "text") return <FileText className="h-4 w-4" />
    if (type === "video") return <Video className="h-4 w-4" />
    return <Image className="h-4 w-4" />
  }

  const getPlatformBadges = (platforms: string[]) => {
    return platforms.map(platform => (
      <Badge key={platform} variant="outline" className="capitalize">
        {platform}
      </Badge>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">
            Create and manage social media content with Blotato AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTextGeneratorOpen(true)} className="relative">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Text
            <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">
              Blotato
            </Badge>
          </Button>
          <Button variant="outline" onClick={() => setImageGeneratorOpen(true)} className="relative">
            <Image className="mr-2 h-4 w-4" />
            AI Image
            <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">
              Blotato
            </Badge>
          </Button>
          <Button variant="outline" onClick={() => setVideoGeneratorOpen(true)} className="relative">
            <Video className="mr-2 h-4 w-4" />
            AI Video
            <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">
              Blotato
            </Badge>
          </Button>
          <Button variant="outline" onClick={() => setPublishOpen(true)} className="relative">
            <Share2 className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <TextGeneratorWizard
        open={textGeneratorOpen}
        onOpenChange={setTextGeneratorOpen}
        onSave={(content) => {
          console.log("Saved content:", content)
          toast.success("Content saved as draft!")
        }}
      />

      <ImageGeneratorWizard
        open={imageGeneratorOpen}
        onOpenChange={setImageGeneratorOpen}
        onSave={(image) => {
          console.log("Saved image:", image)
          toast.success("Image saved!")
        }}
      />

      <VideoGeneratorWizard
        open={videoGeneratorOpen}
        onOpenChange={setVideoGeneratorOpen}
        onSave={(video) => {
          console.log("Saved video:", video)
          toast.success("Video saved!")
        }}
      />

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Post</DialogTitle>
            <DialogDescription>Publish via Blotato</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Account ID</Label>
                <Input value={publishForm.accountId} onChange={(e)=>setPublishForm({...publishForm, accountId: e.target.value})} placeholder="acc_12345" />
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={publishForm.platform} onValueChange={(v)=>setPublishForm({...publishForm, platform: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="threads">Threads</SelectItem>
                    <SelectItem value="bluesky">Bluesky</SelectItem>
                    <SelectItem value="pinterest">Pinterest</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Text</Label>
              <Textarea value={publishForm.text} onChange={(e)=>setPublishForm({...publishForm, text: e.target.value})} rows={3} />
            </div>
            <div>
              <Label>Media URLs (comma separated)</Label>
              <Input value={publishForm.mediaUrls} onChange={(e)=>setPublishForm({...publishForm, mediaUrls: e.target.value})} placeholder="https://database.blotato.com/...." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Scheduled Time (ISO)</Label>
                <Input value={publishForm.scheduledTime} onChange={(e)=>setPublishForm({...publishForm, scheduledTime: e.target.value})} placeholder="2025-12-31T23:59:59Z" />
              </div>
              <div>
                <Label>Page ID (optional)</Label>
                <Input value={publishForm.pageId} onChange={(e)=>setPublishForm({...publishForm, pageId: e.target.value})} />
              </div>
              <div>
                <Label>Media Type</Label>
                <Select value={publishForm.mediaType} onValueChange={(v)=>setPublishForm({...publishForm, mediaType: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="auto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">auto</SelectItem>
                    <SelectItem value="video">video</SelectItem>
                    <SelectItem value="reel">reel</SelectItem>
                    <SelectItem value="story">story</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={publishForm.useNextFreeSlot} onChange={(e)=>setPublishForm({...publishForm, useNextFreeSlot: e.target.checked})} className="h-4 w-4" />
              <Label className="cursor-pointer">Use next free slot</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setPublishOpen(false)}>Cancel</Button>
              <Button onClick={async ()=>{
                try {
                  const mediaUrlsArr = publishForm.mediaUrls.split(',').map(s=>s.trim()).filter(Boolean)
                  const res = await fetch('/api/content/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      accountId: publishForm.accountId,
                      platform: publishForm.platform,
                      text: publishForm.text,
                      mediaUrls: mediaUrlsArr,
                      scheduledTime: publishForm.scheduledTime || undefined,
                      pageId: publishForm.pageId || undefined,
                      mediaType: publishForm.mediaType || undefined,
                      useNextFreeSlot: publishForm.useNextFreeSlot || undefined
                    })
                  })
                  const json = await res.json()
                  if (!res.ok) throw new Error(json?.error || 'Failed to publish')
                  toast.success('Published')
                  setPublishOpen(false)
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to publish')
                }
              }}>Publish</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blotato Integration Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          🚀 Blotato AI Integration Active
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p className="text-sm">
            Generate and publish AI-powered content directly to your social media platforms using Blotato API.
          </p>
          {env && env.BLOTATO_API_KEY === 'MISSING' && (
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium mb-1">BLOTATO_API_KEY fehlt</div>
              <div>
                Bitte setze die Umgebungsvariable <code>BLOTATO_API_KEY</code> in deinem Hosting (Netlify) mit deinem Blotato API Key. Danach diese Seite neu laden.
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            <Badge variant="outline">Twitter</Badge>
            <Badge variant="outline">LinkedIn</Badge>
            <Badge variant="outline">Facebook</Badge>
            <Badge variant="outline">Instagram</Badge>
            <Badge variant="outline">TikTok</Badge>
            <Badge variant="outline">Pinterest</Badge>
            <Badge variant="outline">Threads</Badge>
            <Badge variant="outline">Bluesky</Badge>
            <Badge variant="outline">YouTube</Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-3 w-3" />
                Configure Accounts
              </Button>
            </Link>
            <a href="https://my.blotato.com/api-dashboard" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-3 w-3" />
                API Dashboard
              </Button>
            </a>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockContent.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockContent.filter(c => c.status === "published").length} published via Blotato
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockContent.filter(c => c.status === "scheduled").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to publish
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockContent.reduce((acc, c) => acc + c.engagement.views, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total views
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Items</CardTitle>
          <CardDescription>
            Browse and manage your content library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>
            <TabsContent value="all" className="space-y-4 mt-4">
              {mockContent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.title}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getPlatformBadges(item.platform)}
                    </div>
                    {item.schedule_at && (
                      <p className="text-xs text-muted-foreground">
                        Scheduled for {formatDateTime(item.schedule_at)}
                      </p>
                    )}
                    {item.status === "published" && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{item.engagement.views} views</span>
                        <span>{item.engagement.likes} likes</span>
                        <span>{item.engagement.comments} comments</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
