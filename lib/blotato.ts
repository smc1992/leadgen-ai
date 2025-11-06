/**
 * @deprecated Diese Datei enthält die alte Mock-Implementierung
 * 
 * ⚠️ WICHTIG: Nutze stattdessen die neue Production-Ready API:
 * @see /lib/blotato-api.ts
 * 
 * Die neue API basiert auf der offiziellen Blotato API v2 Dokumentation:
 * - https://help.blotato.com/api/start
 * - https://help.blotato.com/api/api-reference
 * 
 * Vollständige Dokumentation: /BLOTATO-API-COMPLETE.md
 */

const BLOTATO_API_KEY = process.env.BLOTATO_API_KEY!
const BLOTATO_BASE_URL = 'https://backend.blotato.com/v2' // Updated to v2

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Platform = 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'twitter'
export type Tone = 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous' | 'inspirational'
export type VideoStyle = 'modern' | 'minimal' | 'corporate' | 'creative' | 'animated' | 'cinematic'
export type ImageStyle = 'realistic' | 'illustration' | '3d' | 'abstract' | 'minimalist'
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '2:3'

export interface GenerateTextParams {
  prompt: string
  tone: Tone
  channel: Platform
  maxLength?: number
  includeHashtags?: boolean
  includeCTA?: boolean
  includeEmojis?: boolean
  targetAudience?: string
}

export interface GenerateVideoParams {
  topic: string
  duration: number
  style: VideoStyle
  script?: string
  voiceover?: boolean
  backgroundMusic?: boolean
  captions?: boolean
}

export interface GenerateImageParams {
  prompt: string
  style: ImageStyle
  aspectRatio: AspectRatio
  count?: number
}

export interface GenerateCarouselParams {
  topic: string
  slideCount: number
  style: ImageStyle
  includeText?: boolean
}

export interface GenerateHashtagsParams {
  topic: string
  platform: Platform
  count?: number
}

// Response Types
export interface BlotatoTextResponse {
  id: string
  headline: string
  body: string
  hashtags: string[]
  cta: string
  emojis?: string[]
  metadata: {
    wordCount: number
    characterCount: number
    estimatedReadTime: number
    sentiment: 'positive' | 'neutral' | 'negative'
  }
  variants?: Array<{
    headline: string
    body: string
  }>
}

export interface BlotatoVideoResponse {
  id: string
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration: number
  script?: string
  metadata: {
    format: string
    resolution: string
    fileSize: number
    fps: number
  }
  progress?: number
  estimatedTimeRemaining?: number
}

export interface BlotatoImageResponse {
  id: string
  imageUrl: string
  thumbnailUrl: string
  metadata: {
    width: number
    height: number
    format: string
    fileSize: number
  }
}

export interface BlotatoHashtagsResponse {
  hashtags: string[]
  trending: string[]
  recommended: string[]
  metadata: {
    totalSearchVolume: number
    competitionLevel: 'low' | 'medium' | 'high'
  }
}

export async function generateText(params: GenerateTextParams) {
  const response = await fetch(`${BLOTATO_BASE_URL}/content/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BLOTATO_API_KEY}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Blotato API error: ${response.statusText}`)
  }

  return response.json()
}

export async function generateVideo(params: GenerateVideoParams) {
  const response = await fetch(`${BLOTATO_BASE_URL}/content/video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BLOTATO_API_KEY}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Blotato API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getGenerationStatus(jobId: string): Promise<BlotatoVideoResponse> {
  const response = await fetch(`${BLOTATO_BASE_URL}/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${BLOTATO_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Blotato API error: ${response.statusText}`)
  }

  return response.json()
}

// ============================================
// NEW API FUNCTIONS
// ============================================

/**
 * Generate an image based on a prompt
 */
export async function generateImage(params: GenerateImageParams): Promise<BlotatoImageResponse> {
  const response = await fetch(`${BLOTATO_BASE_URL}/content/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BLOTATO_API_KEY}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Blotato API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Generate a carousel (multiple images)
 */
export async function generateCarousel(params: GenerateCarouselParams): Promise<BlotatoImageResponse[]> {
  const response = await fetch(`${BLOTATO_BASE_URL}/content/carousel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BLOTATO_API_KEY}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Blotato API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Generate hashtags for a topic and platform
 */
export async function generateHashtags(params: GenerateHashtagsParams): Promise<BlotatoHashtagsResponse> {
  const response = await fetch(`${BLOTATO_BASE_URL}/content/hashtags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BLOTATO_API_KEY}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Blotato API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Generate multiple text variants for A/B testing
 */
export async function generateVariants(
  params: GenerateTextParams,
  count: number = 3
): Promise<BlotatoTextResponse[]> {
  const response = await fetch(`${BLOTATO_BASE_URL}/content/variants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BLOTATO_API_KEY}`,
    },
    body: JSON.stringify({ ...params, variantCount: count }),
  })

  if (!response.ok) {
    throw new Error(`Blotato API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Poll video generation status until completed or failed
 */
export async function pollVideoStatus(
  jobId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<BlotatoVideoResponse> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const status = await getGenerationStatus(jobId)

    if (status.status === 'completed' || status.status === 'failed') {
      return status
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('Video generation timeout')
}

/**
 * Get platform-specific character limits
 */
export function getPlatformLimits(platform: Platform): {
  maxLength: number
  recommendedLength: number
  maxHashtags: number
} {
  const limits = {
    linkedin: { maxLength: 3000, recommendedLength: 1300, maxHashtags: 30 },
    facebook: { maxLength: 63206, recommendedLength: 500, maxHashtags: 30 },
    instagram: { maxLength: 2200, recommendedLength: 1000, maxHashtags: 30 },
    tiktok: { maxLength: 2200, recommendedLength: 300, maxHashtags: 30 },
    twitter: { maxLength: 280, recommendedLength: 280, maxHashtags: 10 },
  }

  return limits[platform]
}

/**
 * Validate content for platform
 */
export function validateContentForPlatform(
  content: string,
  platform: Platform
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const limits = getPlatformLimits(platform)

  if (content.length > limits.maxLength) {
    errors.push(`Content exceeds ${platform} limit of ${limits.maxLength} characters`)
  }

  if (content.length < 10) {
    errors.push('Content is too short (minimum 10 characters)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
