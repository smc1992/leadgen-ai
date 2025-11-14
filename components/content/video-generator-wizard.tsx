"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Video, Play, Download, RefreshCw, Trash2, Share2 } from "lucide-react"
import { VideoStyle } from "@/lib/blotato-api"

const videoGeneratorSchema = z.object({
  topic: z.string().min(5, "Topic must be at least 5 characters"),
  duration: z.number().min(15).max(90),
  style: z.enum(['modern', 'minimal', 'corporate', 'creative', 'animated', 'cinematic']),
  script: z.string().optional(),
  voiceover: z.boolean(),
  backgroundMusic: z.boolean(),
  captions: z.boolean(),
})

type VideoGeneratorFormValues = z.infer<typeof videoGeneratorSchema>

interface GeneratedVideo {
  id: string
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration: number
  progress?: number
  estimatedTimeRemaining?: number
}

interface VideoGeneratorWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (video: GeneratedVideo) => void
}

export function VideoGeneratorWizard({ open, onOpenChange, onSave }: VideoGeneratorWizardProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null)
  const [step, setStep] = useState<'input' | 'processing' | 'preview'>('input')

  const form = useForm<VideoGeneratorFormValues>({
    resolver: zodResolver(videoGeneratorSchema),
    defaultValues: {
      topic: "",
      duration: 30,
      style: "modern",
      script: "",
      voiceover: true,
      backgroundMusic: true,
      captions: true,
    },
  })

  async function onSubmit(data: VideoGeneratorFormValues) {
    setIsGenerating(true)
    setStep('processing')

    try {
      // Call API to generate video
      const response = await fetch('/api/content/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: data.topic,
          duration: data.duration,
          style: data.style,
          script: data.script,
          voiceover: data.voiceover,
          backgroundMusic: data.backgroundMusic,
          captions: data.captions,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate video')
      }

      const videoId = result.video.id

      // Initialize video state
      setGeneratedVideo({
        id: videoId,
        jobId: result.video.id,
        status: 'processing',
        duration: data.duration,
        progress: 0,
      })

      // Poll for video status
      let attempts = 0
      const maxAttempts = 120 // 10 minutes
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Poll every 5 seconds
        
        const statusResponse = await fetch(`/api/content/video-status/${videoId}`)
        const statusResult = await statusResponse.json()

        if (!statusResult.success) {
          throw new Error('Failed to check video status')
        }

        const video = statusResult.video

        // Update progress
        setGeneratedVideo(prev => prev ? {
          ...prev,
          progress: video.progress || Math.min((attempts / maxAttempts) * 100, 95),
          status: video.status
        } : null)

        if (video.status === 'completed') {
          setGeneratedVideo({
            id: video.id,
            jobId: videoId,
            status: 'completed',
            videoUrl: video.mediaUrl,
            thumbnailUrl: video.thumbnailUrl,
            duration: data.duration,
            progress: 100,
          })
          setStep('preview')
          toast.success("Video generated successfully!")
          setIsGenerating(false)
          return
        }

        if (video.status === 'failed') {
          throw new Error(video.error || 'Video generation failed')
        }

        attempts++
      }

      throw new Error('Video generation timeout - please try again')

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate video")
      console.error(error)
      setStep('input')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setStep('input')
    setGeneratedVideo(null)
  }

  const handleSave = () => {
    if (generatedVideo && onSave) {
      onSave(generatedVideo)
      toast.success("Video saved!")
      onOpenChange(false)
    }
  }

  const handleDelete = async () => {
    if (!generatedVideo) return
    try {
      const res = await fetch(`/api/content/video-status/${generatedVideo.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete video')
      toast.success('Video deleted')
      handleRegenerate()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete video')
    }
  }

  const handlePublish = async () => {
    if (!generatedVideo?.videoUrl) return
    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: 'acc_12345',
          platform: 'tiktok',
          text: 'AI generated video',
          mediaUrls: [generatedVideo.videoUrl]
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to publish')
      toast.success('Published')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to publish')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            AI Video Generator
          </DialogTitle>
          <DialogDescription>
            Create professional videos with AI
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Topic *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Air Freight Delivery Process Explained"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      What should the video be about?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                          <SelectItem value="90">90 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                          <SelectItem value="animated">Animated</SelectItem>
                          <SelectItem value="cinematic">Cinematic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="script"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Script (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Leave empty to auto-generate script from topic..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide your own script or let AI generate one
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Video Options</FormLabel>
                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="voiceover"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">AI Voiceover</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="backgroundMusic"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">Background Music</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="captions"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">Auto Captions</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Generate Video
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 'processing' && generatedVideo && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Generating your video...</h3>
              <p className="text-sm text-muted-foreground">This may take a few minutes</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{generatedVideo.progress}%</span>
                  </div>
                  <Progress value={generatedVideo.progress} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'preview' && generatedVideo && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Preview</CardTitle>
                <CardDescription>
                  {generatedVideo.duration} seconds • {form.watch('style')} style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Play className="mx-auto h-16 w-16 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Video preview would appear here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {generatedVideo.videoUrl}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button variant="outline" onClick={handlePublish}>
                <Share2 className="mr-2 h-4 w-4" />
                Publish
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={handleSave}>
                Save Video
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
