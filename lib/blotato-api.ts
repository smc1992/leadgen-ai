/**
 * Blotato API Client - Production Ready
 * Official API Documentation: https://help.blotato.com/api/start
 * 
 * This implementation follows the official Blotato API v2 specification
 */

const BLOTATO_API_KEY = process.env.BLOTATO_API_KEY!
const BLOTATO_BASE_URL = 'https://backend.blotato.com/v2'

// ============================================
// TYPE DEFINITIONS (Based on Official API)
// ============================================

export type Platform = 
  | 'twitter' 
  | 'linkedin' 
  | 'facebook' 
  | 'instagram' 
  | 'pinterest' 
  | 'tiktok' 
  | 'threads' 
  | 'bluesky' 
  | 'youtube'

export type VideoTemplate = 
  | 'empty' 
  | 'base/pov/wakeup' 
  | 'base/slides/quotecard'

export type VideoStyle = 
  | 'cinematic' 
  | 'apocalyptic' 
  | 'baroque' 
  | 'comicbook' 
  | 'cyberpunk' 
  | 'dystopian' 
  | 'fantasy' 
  | 'futuristic' 
  | 'gothic' 
  | 'grunge' 
  | 'horror' 
  | 'kawaii' 
  | 'mystical' 
  | 'noir' 
  | 'painterly' 
  | 'realistic' 
  | 'retro' 
  | 'surreal' 
  | 'whimsical'

export type TextToImageModel = 
  | 'replicate/black-forest-labs/flux-schnell'
  | 'replicate/black-forest-labs/flux-dev'
  | 'replicate/black-forest-labs/flux-1.1-pro'
  | 'replicate/black-forest-labs/flux-1.1-pro-ultra'
  | 'replicate/recraft-ai/recraft-v3'
  | 'replicate/ideogram-ai/ideogram-v2'
  | 'replicate/luma/photon'
  | 'openai/gpt-image-1'

export type ImageToVideoModel = 
  | 'fal-ai/framepack'
  | 'fal-ai/runway-gen3/turbo/image-to-video'
  | 'fal-ai/luma-dream-machine/image-to-video'
  | 'fal-ai/kling-video/v1.5/pro/image-to-video'
  | 'fal-ai/kling-video/v1.6/pro/image-to-video'
  | 'fal-ai/minimax-video/image-to-video'
  | 'fal-ai/minimax/video-01-director/image-to-video'
  | 'fal-ai/hunyuan-video-image-to-video'
  | 'fal-ai/veo2/image-to-video'

export type CaptionPosition = 'top' | 'bottom' | 'middle' | null

export type FacebookMediaType = 'video' | 'reel'
export type InstagramMediaType = 'reel' | 'story'
export type TikTokPrivacyLevel = 'SELF_ONLY' | 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR'

// ============================================
// REQUEST INTERFACES
// ============================================

export interface PublishPostRequest {
  post: {
    accountId: string
    content: {
      text: string
      mediaUrls: string[]
      platform: Platform
      additionalPosts?: Array<{
        text: string
        mediaUrls: string[]
      }>
    }
    target: 
      | { targetType: 'twitter' }
      | { targetType: 'linkedin'; pageId?: string }
      | { targetType: 'facebook'; pageId: string; mediaType?: FacebookMediaType }
      | { targetType: 'instagram'; mediaType?: InstagramMediaType; altText?: string }
      | { 
          targetType: 'tiktok'
          privacyLevel: TikTokPrivacyLevel
          disabledComments: boolean
          disabledDuet: boolean
          disabledStitch: boolean
        }
      | { targetType: 'threads' }
      | { targetType: 'bluesky' }
      | { targetType: 'pinterest' }
      | { targetType: 'youtube' }
      | { targetType: 'webhook'; url: string }
  }
  scheduledTime?: string // ISO 8601 format
  useNextFreeSlot?: boolean
}

export interface UploadMediaRequest {
  url: string
}

export interface CreateVideoRequest {
  template: {
    id: VideoTemplate
    firstSceneText?: string
    captionPosition?: CaptionPosition
    scenes?: Array<{
      prompt: string
      text?: string
      voiceId?: string
    }>
  }
  script: string
  style: VideoStyle
  animateFirstImage?: boolean
  animateAll?: boolean
  textToImageModel?: TextToImageModel
  imageToVideoModel?: ImageToVideoModel
}

// ============================================
// RESPONSE INTERFACES
// ============================================

export interface PublishPostResponse {
  id: string
  status: 'scheduled' | 'published' | 'failed'
  scheduledTime?: string
  publishedUrl?: string
  error?: string
}

export interface UploadMediaResponse {
  url: string // Blotato CDN URL
}

export interface CreateVideoResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

export interface GetVideoResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  mediaUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
  progress?: number
}

// ============================================
// API CLIENT FUNCTIONS
// ============================================

/**
 * Make authenticated request to Blotato API
 */
async function blotatoRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BLOTATO_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'blotato-api-key': BLOTATO_API_KEY,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Blotato API Error (${response.status}): ${errorText}`)
  }

  return response.json()
}

/**
 * Publish a post to social media platforms
 * POST /v2/posts
 * 
 * @example
 * ```typescript
 * const result = await publishPost({
 *   post: {
 *     accountId: 'acc_12345',
 *     content: {
 *       text: 'Hello World!',
 *       mediaUrls: [],
 *       platform: 'twitter'
 *     },
 *     target: { targetType: 'twitter' }
 *   }
 * })
 * ```
 */
export async function publishPost(
  request: PublishPostRequest
): Promise<PublishPostResponse> {
  return blotatoRequest<PublishPostResponse>('/posts', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Schedule a post for later
 * 
 * @example
 * ```typescript
 * const result = await schedulePost({
 *   post: { ... },
 *   scheduledTime: '2025-12-31T23:59:59Z'
 * })
 * ```
 */
export async function schedulePost(
  request: PublishPostRequest & { scheduledTime: string }
): Promise<PublishPostResponse> {
  return publishPost(request)
}

/**
 * Upload media to Blotato CDN
 * POST /v2/media
 * 
 * Media URLs must be from blotato.com domain to be accepted by social platforms
 * 
 * @example
 * ```typescript
 * const result = await uploadMedia({
 *   url: 'https://example.com/image.jpg'
 * })
 * // Returns: { url: 'https://database.blotato.com/xxx.jpg' }
 * ```
 */
export async function uploadMedia(
  request: UploadMediaRequest
): Promise<UploadMediaResponse> {
  return blotatoRequest<UploadMediaResponse>('/media', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Create an AI-generated video
 * POST /v2/videos/creations
 * 
 * @example
 * ```typescript
 * const result = await createVideo({
 *   template: { id: 'base/pov/wakeup' },
 *   script: 'You wake up as a logistics expert',
 *   style: 'cinematic'
 * })
 * ```
 */
export async function createVideo(
  request: CreateVideoRequest
): Promise<CreateVideoResponse> {
  return blotatoRequest<CreateVideoResponse>('/videos/creations', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Get video creation status
 * GET /v2/videos/creations/:id
 * 
 * Poll this endpoint to check if video generation is complete
 * 
 * @example
 * ```typescript
 * const video = await getVideo('video_12345')
 * if (video.status === 'completed') {
 *   console.log('Video URL:', video.mediaUrl)
 * }
 * ```
 */
export async function getVideo(id: string): Promise<GetVideoResponse> {
  return blotatoRequest<GetVideoResponse>(`/videos/creations/${id}`, {
    method: 'GET',
  })
}

/**
 * Delete a video
 * DELETE /v2/videos/:id
 */
export async function deleteVideo(id: string): Promise<{ success: boolean }> {
  return blotatoRequest<{ success: boolean }>(`/videos/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Poll video status until completed or failed
 * 
 * @param id - Video creation ID
 * @param maxAttempts - Maximum polling attempts (default: 60)
 * @param intervalMs - Polling interval in milliseconds (default: 5000)
 */
export async function pollVideoStatus(
  id: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<GetVideoResponse> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const video = await getVideo(id)

    if (video.status === 'completed' || video.status === 'failed') {
      return video
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('Video generation timeout - exceeded maximum polling attempts')
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get platform-specific content limits
 */
export function getPlatformLimits(platform: Platform): {
  maxTextLength: number
  maxMediaCount: number
  supportsVideo: boolean
  supportsCarousel: boolean
  supportsThreads: boolean
} {
  const limits = {
    twitter: {
      maxTextLength: 280,
      maxMediaCount: 4,
      supportsVideo: true,
      supportsCarousel: false,
      supportsThreads: true,
    },
    linkedin: {
      maxTextLength: 3000,
      maxMediaCount: 9,
      supportsVideo: true,
      supportsCarousel: true,
      supportsThreads: false,
    },
    facebook: {
      maxTextLength: 63206,
      maxMediaCount: 10,
      supportsVideo: true,
      supportsCarousel: true,
      supportsThreads: false,
    },
    instagram: {
      maxTextLength: 2200,
      maxMediaCount: 10,
      supportsVideo: true,
      supportsCarousel: true,
      supportsThreads: false,
    },
    tiktok: {
      maxTextLength: 2200,
      maxMediaCount: 1,
      supportsVideo: true,
      supportsCarousel: false,
      supportsThreads: false,
    },
    pinterest: {
      maxTextLength: 500,
      maxMediaCount: 5,
      supportsVideo: true,
      supportsCarousel: true,
      supportsThreads: false,
    },
    threads: {
      maxTextLength: 500,
      maxMediaCount: 10,
      supportsVideo: true,
      supportsCarousel: true,
      supportsThreads: true,
    },
    bluesky: {
      maxTextLength: 300,
      maxMediaCount: 4,
      supportsVideo: true,
      supportsCarousel: false,
      supportsThreads: true,
    },
    youtube: {
      maxTextLength: 5000,
      maxMediaCount: 1,
      supportsVideo: true,
      supportsCarousel: false,
      supportsThreads: false,
    },
  }

  return limits[platform]
}

/**
 * Validate content for platform
 */
export function validateContent(
  text: string,
  mediaUrls: string[],
  platform: Platform
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const limits = getPlatformLimits(platform)

  if (text.length > limits.maxTextLength) {
    errors.push(`Text exceeds ${platform} limit of ${limits.maxTextLength} characters`)
  }

  if (mediaUrls.length > limits.maxMediaCount) {
    errors.push(`Media count exceeds ${platform} limit of ${limits.maxMediaCount} items`)
  }

  // Check if media URLs are from Blotato CDN
  const nonBlotatoUrls = mediaUrls.filter(url => !url.includes('blotato.com'))
  if (nonBlotatoUrls.length > 0) {
    errors.push('All media URLs must be uploaded to Blotato CDN first using uploadMedia()')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create a simple text post
 * Helper function for quick posting
 */
export async function createTextPost(
  accountId: string,
  platform: Platform,
  text: string,
  options?: {
    scheduledTime?: string
    pageId?: string
  }
): Promise<PublishPostResponse> {
  const request: PublishPostRequest = {
    post: {
      accountId,
      content: {
        text,
        mediaUrls: [],
        platform,
      },
      target: platform === 'facebook' && options?.pageId
        ? { targetType: 'facebook', pageId: options.pageId }
        : platform === 'linkedin' && options?.pageId
        ? { targetType: 'linkedin', pageId: options.pageId }
        : { targetType: platform as any },
    },
  }

  if (options?.scheduledTime) {
    request.scheduledTime = options.scheduledTime
  }

  return publishPost(request)
}

/**
 * Create a post with media
 * Helper function for posting with images/videos
 */
export async function createMediaPost(
  accountId: string,
  platform: Platform,
  text: string,
  mediaUrls: string[],
  options?: {
    scheduledTime?: string
    pageId?: string
    mediaType?: FacebookMediaType | InstagramMediaType
  }
): Promise<PublishPostResponse> {
  // Validate content
  const validation = validateContent(text, mediaUrls, platform)
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
  }

  const request: PublishPostRequest = {
    post: {
      accountId,
      content: {
        text,
        mediaUrls,
        platform,
      },
      target: platform === 'facebook' && options?.pageId
        ? { 
            targetType: 'facebook', 
            pageId: options.pageId,
            mediaType: options.mediaType as FacebookMediaType
          }
        : platform === 'instagram'
        ? { 
            targetType: 'instagram',
            mediaType: options?.mediaType as InstagramMediaType
          }
        : { targetType: platform as any },
    },
  }

  if (options?.scheduledTime) {
    request.scheduledTime = options.scheduledTime
  }

  return publishPost(request)
}

/**
 * Create a Twitter/Bluesky/Threads thread
 */
export async function createThread(
  accountId: string,
  platform: 'twitter' | 'bluesky' | 'threads',
  posts: Array<{ text: string; mediaUrls?: string[] }>
): Promise<PublishPostResponse> {
  const [firstPost, ...additionalPosts] = posts

  const request: PublishPostRequest = {
    post: {
      accountId,
      content: {
        text: firstPost.text,
        mediaUrls: firstPost.mediaUrls || [],
        platform,
        additionalPosts: additionalPosts.map(p => ({
          text: p.text,
          mediaUrls: p.mediaUrls || [],
        })),
      },
      target: { targetType: platform },
    },
  }

  return publishPost(request)
}

// ============================================
// VOICE IDs (for video generation with voiceover)
// ============================================

export const VOICE_IDS = {
  // Male voices
  'adam': 'Male - Deep and resonant',
  'antoni': 'Male - Well-rounded',
  'arnold': 'Male - Crisp and authoritative',
  'callum': 'Male - Smooth and conversational',
  'charlie': 'Male - Natural and casual',
  'clyde': 'Male - Rich and warm',
  'daniel': 'Male - Deep and authoritative',
  'eric': 'Male - Friendly and approachable',
  'george': 'Male - Warm and engaging',
  'harry': 'Male - Anxious and emotional',
  'james': 'Male - Calm and professional',
  'jeremy': 'Male - Excited and upbeat',
  'joseph': 'Male - Professional',
  'liam': 'Male - Neutral',
  'michael': 'Male - Smooth',
  'patrick': 'Male - Pleasant',
  'thomas': 'Male - Calm',
  
  // Female voices
  'alice': 'Female - Confident',
  'aria': 'Female - Expressive',
  'bella': 'Female - Soft',
  'charlotte': 'Female - Seductive',
  'domi': 'Female - Strong',
  'dorothy': 'Female - Pleasant',
  'emily': 'Female - Calm',
  'elli': 'Female - Emotional',
  'freya': 'Female - Expressive',
  'gigi': 'Female - Childish',
  'grace': 'Female - Warm',
  'jessica': 'Female - Expressive',
  'lily': 'Female - Warm',
  'matilda': 'Female - Warm',
  'nicole': 'Female - Whisper',
  'rachel': 'Female - Calm',
  'sarah': 'Female - Soft',
} as const

export type VoiceId = keyof typeof VOICE_IDS
