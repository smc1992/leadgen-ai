"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useDropzone } from "react-dropzone"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Image as ImageIcon, Upload, Sparkles, Download, Copy, RefreshCw, Check } from "lucide-react"

const imageGeneratorSchema = z.object({
  mode: z.enum(['generate', 'upload']),
  // For AI Generation
  prompt: z.string().optional(),
  style: z.enum(['realistic', 'illustration', '3d', 'abstract', 'minimalist']).optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '16:21']).optional(),
  model: z.enum([
    'flux-kontext-pro', 
    'flux-kontext-max', 
    '4o-image',
    'google/nano-banana',
    'ideogram/v3-text-to-image',
    'qwen/text-to-image',
    'bytedance/seedream',
    'bytedance/seedream-v4-text-to-image',
    'google/imagen4-ultra'
  ]).optional(),
  // Advanced Settings
  promptUpsampling: z.boolean().optional(),
  safetyTolerance: z.number().min(0).max(6).optional(),
  outputFormat: z.enum(['png', 'jpeg']).optional(),
  // For Upload
  uploadUrl: z.string().optional(), // Removed .url() validation
})

type ImageGeneratorFormValues = z.infer<typeof imageGeneratorSchema>

// Model Card Component
interface ModelCardProps {
  value: string
  selected: boolean
  onChange: (value: string) => void
  name: string
  badge: string
  badgeVariant?: "default" | "secondary" | "outline"
  description: string
  speed: string
  quality: string
  credits: string
}

const ModelCard = ({ value, selected, onChange, name, badge, badgeVariant = "outline", description, speed, quality, credits }: ModelCardProps) => (
  <div 
    className={`border rounded-lg p-3 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
    onClick={() => onChange(value)}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            checked={selected}
            onChange={() => onChange(value)}
            className="mt-0.5"
          />
          <span className="font-semibold text-sm">{name}</span>
          <Badge variant={badgeVariant} className="text-xs">{badge}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          {description}
        </p>
        <div className="flex items-center gap-3 mt-1.5 ml-6 text-xs">
          <span>{speed}</span>
          <span>{quality}</span>
          <span className="font-semibold text-primary">{credits} credits</span>
        </div>
      </div>
    </div>
  </div>
)

interface GeneratedImage {
  id: string
  imageUrl: string
  thumbnailUrl: string
  prompt?: string
  style?: string
  aspectRatio?: string
  metadata: {
    width: number
    height: number
    format: string
    fileSize: number
  }
}

interface ImageGeneratorWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (image: GeneratedImage) => void
}

export function ImageGeneratorWizard({ open, onOpenChange, onSave }: ImageGeneratorWizardProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [mode, setMode] = useState<'generate' | 'upload'>('generate')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState<number>(0)

  const form = useForm<ImageGeneratorFormValues>({
    resolver: zodResolver(imageGeneratorSchema),
    defaultValues: {
      mode: 'generate',
      prompt: "",
      style: "realistic",
      aspectRatio: "1:1",
      model: "flux-kontext-pro",
      promptUpsampling: false,
      safetyTolerance: 2,
      outputFormat: "png",
      uploadUrl: "",
    },
  })

  // Dropzone for file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const onSubmit = async (data: ImageGeneratorFormValues) => {
    console.log('🚀🚀🚀 onSubmit CALLED!')
    console.log('Mode:', mode)
    console.log('Data:', data)
    console.log('Form errors:', form.formState.errors)
    
    // Sofortiges visuelles Feedback
    toast.info("🚀 Starting image generation...", {
      duration: 2000,
    })
    
    // Reset progress
    setGenerationProgress('Initializing...')
    setProgressPercent(0)
    setIsGenerating(true)

    try {
      if (mode === 'generate') {
        // AI Image Generation
        if (!data.prompt || data.prompt.length < 5) {
          toast.error("❌ Please provide a detailed prompt (min 5 characters)")
          setIsGenerating(false)
          return
        }

        console.log('✅ Validation passed, sending generation request:', data)
        
        setGenerationProgress(`Starting generation...`)
        setProgressPercent(5)
        toast.info(`🎨 Initializing...`, {
          duration: 2000,
        })

        // Step 1: Start generation (returns immediately)
        const startResponse = await fetch('/api/content/generate-image-async', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: data.prompt,
            style: data.style,
            aspectRatio: data.aspectRatio,
            model: data.model,
            promptUpsampling: data.promptUpsampling,
            safetyTolerance: data.safetyTolerance,
            outputFormat: data.outputFormat,
          }),
        })

        if (!startResponse.ok) {
          throw new Error('Failed to start generation')
        }

        const startResult = await startResponse.json()
        const { taskId, apiType } = startResult

        setGenerationProgress(`Generating with ${data.model}...`)
        setProgressPercent(20)
        toast.info(`⏳ Generating... (this may take 15-30s)`, {
          duration: 5000,
        })

        // Step 2: Poll for completion
        let attempts = 0
        const maxAttempts = 30
        let response: any = null

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000))

          const checkResponse = await fetch('/api/content/check-image-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId,
              apiType,
              model: data.model,
              prompt: data.prompt,
              style: data.style,
              aspectRatio: data.aspectRatio,
              outputFormat: data.outputFormat,
            }),
          })

          if (checkResponse.ok) {
            const checkResult = await checkResponse.json()

            if (checkResult.status === 'completed') {
              response = checkResult
              break
            } else if (checkResult.status === 'failed') {
              throw new Error('Image generation failed')
            }
          }

          attempts++
          setProgressPercent(20 + (attempts / maxAttempts) * 60)
        }

        if (!response) {
          throw new Error('Generation timeout')
        }

        console.log('📦 Generation completed!')
        
        setGenerationProgress('Finalizing...')
        setProgressPercent(90)

        if (!response.success || !response.image) {
          console.error('❌ Generation failed')
          throw new Error('Failed to generate image')
        }

        console.log('✅ Image generated successfully!')
        console.log('📸 Image data:', response.image)
        
        setGenerationProgress('Finalizing...')
        setProgressPercent(100)
        
        setGeneratedImage(response.image)
        console.log('🔄 Setting step to preview')
        setStep('preview')
        
        toast.success("✅ Image ready!", {
          duration: 3000,
        })
        
        console.log('✅ Preview should now be visible')

      } else {
        // Upload Image
        if (!uploadedFile) {
          toast.error("Please select an image to upload")
          setIsGenerating(false)
          return
        }

        // First upload to temporary storage (you can use your own storage)
        const formData = new FormData()
        formData.append('file', uploadedFile)

        // Upload to your backend first
        const uploadResponse = await fetch('/api/content/upload-temp', {
          method: 'POST',
          body: formData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResult.success) {
          throw new Error('Failed to upload image')
        }

        // Then upload to Blotato CDN
        const blotatoResponse = await fetch('/api/content/upload-to-blotato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: uploadResult.url,
          }),
        })

        const blotatoResult = await blotatoResponse.json()

        if (!blotatoResult.success) {
          throw new Error('Failed to upload to Blotato CDN')
        }

        setGeneratedImage({
          id: 'uploaded-' + Date.now(),
          imageUrl: blotatoResult.blotatoUrl,
          thumbnailUrl: blotatoResult.blotatoUrl,
          metadata: {
            width: 0,
            height: 0,
            format: uploadedFile.type.split('/')[1],
            fileSize: uploadedFile.size,
          },
        })
        setStep('preview')
        toast.success("Image uploaded successfully!")
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to process image")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!generatedImage) return
    navigator.clipboard.writeText(generatedImage.imageUrl)
    setCopied(true)
    toast.success("Image URL copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    setStep('input')
    setGeneratedImage(null)
    setUploadedFile(null)
    setUploadPreview(null)
  }

  const handleSave = () => {
    if (generatedImage && onSave) {
      onSave(generatedImage)
      toast.success("Image saved!")
      onOpenChange(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return
    window.open(generatedImage.imageUrl, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            AI Image Generator & Uploader
          </DialogTitle>
          <DialogDescription>
            Generate AI images or upload your own via Blotato
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'generate' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Generate
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="E.g., A modern cargo airplane flying over a city at sunset, photorealistic, high detail"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe the image you want to generate in detail
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
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
                              <SelectItem value="realistic">Realistic</SelectItem>
                              <SelectItem value="illustration">Illustration</SelectItem>
                              <SelectItem value="3d">3D Render</SelectItem>
                              <SelectItem value="abstract">Abstract</SelectItem>
                              <SelectItem value="minimalist">Minimalist</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aspectRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspect Ratio *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1:1">Square (1:1) - Social Media</SelectItem>
                              <SelectItem value="16:9">Landscape (16:9) - YouTube, Desktop</SelectItem>
                              <SelectItem value="9:16">Portrait (9:16) - Stories, TikTok</SelectItem>
                              <SelectItem value="4:3">Standard (4:3) - Traditional</SelectItem>
                              <SelectItem value="3:4">Portrait (3:4) - Magazine</SelectItem>
                              <SelectItem value="21:9">Ultra-Wide (21:9) - Cinematic</SelectItem>
                              <SelectItem value="16:21">Ultra-Tall (16:21) - Mobile App</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model *</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Budget Models */}
                            <div>
                              <p className="text-sm font-medium mb-2">💰 Budget (Fast & Cheap)</p>
                              <div className="space-y-2">
                                <ModelCard
                                  value="flux-kontext-pro"
                                  selected={field.value === 'flux-kontext-pro'}
                                  onChange={field.onChange}
                                  name="Flux Kontext Pro"
                                  badge="Recommended"
                                  badgeVariant="secondary"
                                  description="Balanced performance for social media"
                                  speed="⚡⚡⚡ Fast (10-15s)"
                                  quality="⭐⭐⭐"
                                  credits="~0.75"
                                />
                                <ModelCard
                                  value="google/nano-banana"
                                  selected={field.value === 'google/nano-banana'}
                                  onChange={field.onChange}
                                  name="Google Nano Banana"
                                  badge="Ultra Fast"
                                  description="Lightweight & ultra-fast generation"
                                  speed="⚡⚡⚡⚡ Ultra Fast (5-10s)"
                                  quality="⭐⭐⭐"
                                  credits="~0.75"
                                />
                              </div>
                            </div>

                            {/* Balanced Models */}
                            <div>
                              <p className="text-sm font-medium mb-2">⚖️ Balanced (Quality & Speed)</p>
                              <div className="space-y-2">
                                <ModelCard
                                  value="flux-kontext-max"
                                  selected={field.value === 'flux-kontext-max'}
                                  onChange={field.onChange}
                                  name="Flux Kontext Max"
                                  badge="Premium"
                                  description="Highest quality for professional content"
                                  speed="⚡⚡ Slower (20-30s)"
                                  quality="⭐⭐⭐⭐⭐"
                                  credits="~1.5"
                                />
                                <ModelCard
                                  value="ideogram/v3-text-to-image"
                                  selected={field.value === 'ideogram/v3-text-to-image'}
                                  onChange={field.onChange}
                                  name="Ideogram V3"
                                  badge="Typography"
                                  description="Excellent text rendering & logo design"
                                  speed="⚡⚡ Medium (15-20s)"
                                  quality="⭐⭐⭐⭐"
                                  credits="~1.25"
                                />
                                <ModelCard
                                  value="qwen/text-to-image"
                                  selected={field.value === 'qwen/text-to-image'}
                                  onChange={field.onChange}
                                  name="Qwen Text-to-Image"
                                  badge="Chinese AI"
                                  description="Chinese language & Asian aesthetics"
                                  speed="⚡⚡ Medium (15-20s)"
                                  quality="⭐⭐⭐⭐"
                                  credits="~1.25"
                                />
                                <ModelCard
                                  value="bytedance/seedream"
                                  selected={field.value === 'bytedance/seedream'}
                                  onChange={field.onChange}
                                  name="ByteDance SeeDream"
                                  badge="TikTok AI"
                                  description="Social media optimized, trendy aesthetics"
                                  speed="⚡⚡ Medium (15-25s)"
                                  quality="⭐⭐⭐⭐"
                                  credits="~1.5"
                                />
                              </div>
                            </div>

                            {/* Premium Models */}
                            <div>
                              <p className="text-sm font-medium mb-2">💎 Premium (Best Quality)</p>
                              <div className="space-y-2">
                                <ModelCard
                                  value="4o-image"
                                  selected={field.value === '4o-image'}
                                  onChange={field.onChange}
                                  name="GPT-4O Image"
                                  badge="AI-Enhanced"
                                  description="Advanced editing & variants generation"
                                  speed="⚡⚡ Medium (15-25s)"
                                  quality="⭐⭐⭐⭐"
                                  credits="~2"
                                />
                                <ModelCard
                                  value="bytedance/seedream-v4-text-to-image"
                                  selected={field.value === 'bytedance/seedream-v4-text-to-image'}
                                  onChange={field.onChange}
                                  name="SeeDream V4"
                                  badge="Latest"
                                  description="Latest version with enhanced quality"
                                  speed="⚡ Slower (20-30s)"
                                  quality="⭐⭐⭐⭐⭐"
                                  credits="~2"
                                />
                                <ModelCard
                                  value="google/imagen4-ultra"
                                  selected={field.value === 'google/imagen4-ultra'}
                                  onChange={field.onChange}
                                  name="Google Imagen 4 Ultra"
                                  badge="Photorealistic"
                                  description="Google's latest, photorealistic quality"
                                  speed="⚡ Slower (20-30s)"
                                  quality="⭐⭐⭐⭐⭐"
                                  credits="~2.5"
                                />
                              </div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Advanced Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Advanced Settings</CardTitle>
                      <CardDescription>Fine-tune your image generation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="outputFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Output Format</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={field.value === 'png' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => field.onChange('png')}
                                  className="flex-1"
                                >
                                  PNG (High Quality)
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === 'jpeg' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => field.onChange('jpeg')}
                                  className="flex-1"
                                >
                                  JPEG (Smaller)
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="promptUpsampling"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">AI Enhance Prompt</FormLabel>
                              <FormDescription className="text-xs">
                                AI will improve your prompt
                              </FormDescription>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="safetyTolerance"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Safety Level</FormLabel>
                              <span className="text-xs text-muted-foreground">{field.value || 2}</span>
                            </div>
                            <FormControl>
                              <input
                                type="range"
                                min="0"
                                max="6"
                                step="1"
                                value={field.value || 2}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Strict</span>
                              <span>Balanced</span>
                              <span>Permissive</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Cost Calculator */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Estimated Cost</p>
                          <p className="text-2xl font-bold text-primary">
                            ~{(() => {
                              const model = form.watch('model')
                              if (model === 'flux-kontext-pro' || model === 'google/nano-banana') return '0.75'
                              if (model === 'ideogram/v3-text-to-image' || model === 'qwen/text-to-image') return '1.25'
                              if (model === 'flux-kontext-max' || model === 'bytedance/seedream') return '1.5'
                              if (model === '4o-image' || model === 'bytedance/seedream-v4-text-to-image') return '2'
                              if (model === 'google/imagen4-ultra') return '2.5'
                              return '1.5'
                            })()} credits
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Generation Time</p>
                          <p className="text-lg font-semibold">
                            {(() => {
                              const model = form.watch('model')
                              if (model === 'google/nano-banana') return '5-10s'
                              if (model === 'flux-kontext-pro') return '10-15s'
                              if (model === '4o-image' || model === 'ideogram/v3-text-to-image' || model === 'qwen/text-to-image') return '15-20s'
                              if (model === 'bytedance/seedream') return '15-25s'
                              if (model === 'flux-kontext-max' || model === 'bytedance/seedream-v4-text-to-image' || model === 'google/imagen4-ultra') return '20-30s'
                              return '15-20s'
                            })()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Progress Indicator */}
                  {isGenerating && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{generationProgress}</span>
                            <span className="text-muted-foreground">{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-primary h-full transition-all duration-500 ease-out"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            This may take 10-30 seconds depending on the model...
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        console.log('Cancel clicked')
                        onOpenChange(false)
                      }}
                      disabled={isGenerating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => {
                        console.log('🔘 Direct button click!')
                        console.log('Form values:', form.getValues())
                        console.log('Form errors:', form.formState.errors)
                        console.log('Is form valid:', form.formState.isValid)
                        console.log('Calling form.handleSubmit...')
                        form.handleSubmit(
                          (data) => {
                            console.log('✅ Validation passed!')
                            onSubmit(data)
                          },
                          (errors) => {
                            console.error('❌ Validation failed:', errors)
                            toast.error('Please fill in all required fields')
                          }
                        )()
                      }}
                      disabled={isGenerating}
                      className="min-w-[160px]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {uploadPreview ? (
                    <div className="space-y-4">
                      <img
                        src={uploadPreview}
                        alt="Upload preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground">
                        {uploadedFile?.name} ({(uploadedFile!.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedFile(null)
                          setUploadPreview(null)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {isDragActive ? 'Drop image here' : 'Drag & drop an image here'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          or click to browse (max 10MB)
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supports: PNG, JPG, JPEG, GIF, WebP
                      </p>
                    </div>
                  )}
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
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={!uploadedFile || isGenerating}
                  >
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isGenerating ? "Uploading..." : "Upload to Blotato"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {(() => {
          console.log('🔍 Current step:', step)
          console.log('🖼️ Generated image:', generatedImage)
          return null
        })()}
        
        {step === 'preview' && generatedImage && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
                <CardDescription className="flex gap-2">
                  {generatedImage.metadata.format && (
                    <Badge variant="outline">{generatedImage.metadata.format.toUpperCase()}</Badge>
                  )}
                  {generatedImage.metadata.fileSize > 0 && (
                    <Badge variant="outline">
                      {(generatedImage.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  )}
                  {generatedImage.style && (
                    <Badge variant="outline">{generatedImage.style}</Badge>
                  )}
                  {generatedImage.aspectRatio && (
                    <Badge variant="outline">{generatedImage.aspectRatio}</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img
                    src={generatedImage.imageUrl}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                </div>
                {generatedImage.prompt && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    <strong>Prompt:</strong> {generatedImage.prompt}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {mode === 'generate' ? 'Regenerate' : 'Upload Another'}
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
                    Copy URL
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={handleSave}>
                Save Image
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
