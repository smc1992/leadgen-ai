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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, Copy, RefreshCw, Check } from "lucide-react"
import { Platform, getPlatformLimits } from "@/lib/blotato-api"

type Tone = 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous' | 'inspirational'

const textGeneratorSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'humorous', 'inspirational']),
  platform: z.enum(['linkedin', 'facebook', 'instagram', 'tiktok', 'twitter']),
  targetAudience: z.string().optional(),
  includeHashtags: z.boolean(),
  includeCTA: z.boolean(),
  includeEmojis: z.boolean(),
})

type TextGeneratorFormValues = z.infer<typeof textGeneratorSchema>

interface GeneratedContent {
  headline: string
  body: string
  hashtags: string[]
  cta: string
  metadata: {
    wordCount: number
    characterCount: number
    estimatedReadTime: number
  }
}

interface TextGeneratorWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (content: GeneratedContent) => void
}

export function TextGeneratorWizard({ open, onOpenChange, onSave }: TextGeneratorWizardProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<'input' | 'preview'>('input')

  const form = useForm<TextGeneratorFormValues>({
    resolver: zodResolver(textGeneratorSchema),
    defaultValues: {
      prompt: "",
      tone: "professional",
      platform: "linkedin",
      targetAudience: "",
      includeHashtags: true,
      includeCTA: true,
      includeEmojis: false,
    },
  })

  const selectedPlatform = form.watch("platform")
  const platformLimits = getPlatformLimits(selectedPlatform as Platform)
  
  // Get account ID from localStorage
  const getAccountId = (platform: string): string | null => {
    if (typeof window === 'undefined') return null
    const accounts = JSON.parse(localStorage.getItem('blotato_accounts') || '{}')
    return accounts[platform] || null
  }

  async function onSubmit(data: TextGeneratorFormValues) {
    setIsGenerating(true)

    try {
      // Check if account is configured
      const accountId = getAccountId(data.platform)
      if (!accountId) {
        toast.error(`Please configure ${data.platform} account in Settings first`)
        setIsGenerating(false)
        return
      }

      // Call API to generate and publish content
      const response = await fetch('/api/content/generate-and-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          platform: data.platform,
          prompt: data.prompt,
          tone: data.tone,
          targetAudience: data.targetAudience,
          includeHashtags: data.includeHashtags,
          includeCTA: data.includeCTA,
          includeEmojis: data.includeEmojis,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate content')
      }

      // Set generated content from API response
      setGeneratedContent({
        headline: result.generated.headline || data.prompt,
        body: result.generated.body || data.prompt,
        hashtags: result.generated.hashtags || [],
        cta: result.generated.cta || '',
        metadata: {
          wordCount: result.generated.metadata?.wordCount || 0,
          characterCount: result.generated.metadata?.characterCount || 0,
          estimatedReadTime: result.generated.metadata?.estimatedReadTime || 1,
        },
      })

      setStep('preview')
      toast.success("Content generated successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate content")
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!generatedContent) return

    const fullText = `${generatedContent.headline}\n\n${generatedContent.body}\n\n${generatedContent.hashtags.join(' ')}\n\n${generatedContent.cta}`
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    setStep('input')
    setGeneratedContent(null)
  }

  const handleSave = () => {
    if (generatedContent && onSave) {
      onSave(generatedContent)
      toast.success("Content saved as draft!")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Text Generator
          </DialogTitle>
          <DialogDescription>
            Create engaging social media content with AI
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What do you want to write about? *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="E.g., Air Freight from Germany to USA: Key advantages for businesses"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific about your topic, target audience, and key points
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Max: {platformLimits.maxTextLength} chars
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                          <SelectItem value="humorous">Humorous</SelectItem>
                          <SelectItem value="inspirational">Inspirational</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Supply chain managers, logistics professionals" {...field} />
                    </FormControl>
                    <FormDescription>
                      Who is this content for?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Options</FormLabel>
                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="includeHashtags"
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
                        <FormLabel className="!mt-0 cursor-pointer">Include Hashtags</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeCTA"
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
                        <FormLabel className="!mt-0 cursor-pointer">Include Call-to-Action</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeEmojis"
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
                        <FormLabel className="!mt-0 cursor-pointer">Include Emojis</FormLabel>
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
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isGenerating ? "Generating..." : "Generate Content"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="preview">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                {generatedContent && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">{generatedContent.headline}</CardTitle>
                        <CardDescription className="flex gap-2">
                          <Badge variant="outline">{generatedContent.metadata.wordCount} words</Badge>
                          <Badge variant="outline">{generatedContent.metadata.characterCount} characters</Badge>
                          <Badge variant="outline">{generatedContent.metadata.estimatedReadTime} min read</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="whitespace-pre-wrap text-sm">
                          {generatedContent.body}
                        </div>

                        {generatedContent.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {generatedContent.hashtags.map((tag, i) => (
                              <Badge key={i} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        )}

                        {generatedContent.cta && (
                          <div className="rounded-lg bg-muted p-3 text-sm font-medium">
                            {generatedContent.cta}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleRegenerate}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                      <Button variant="outline" onClick={handleCopy}>
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button onClick={handleSave}>
                        Save as Draft
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="edit">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Headline</label>
                    <Input
                      value={generatedContent?.headline || ""}
                      onChange={(e) => setGeneratedContent(prev => prev ? {...prev, headline: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Body</label>
                    <Textarea
                      value={generatedContent?.body || ""}
                      onChange={(e) => setGeneratedContent(prev => prev ? {...prev, body: e.target.value} : null)}
                      rows={12}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Call-to-Action</label>
                    <Input
                      value={generatedContent?.cta || ""}
                      onChange={(e) => setGeneratedContent(prev => prev ? {...prev, cta: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setStep('preview')}>
                      Back to Preview
                    </Button>
                    <Button onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
