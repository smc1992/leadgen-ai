import { NextRequest, NextResponse } from 'next/server'
import { 
  publishPost,
  createTextPost,
  createMediaPost,
  validateContent,
  Platform,
  FacebookMediaType,
  InstagramMediaType,
  PublishPostRequest
} from '@/lib/blotato-api'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Two input modes supported:
    // 1) Full Blotato PublishPostRequest via `post` (plus optional schedule flags)
    // 2) Convenience params: accountId, platform, text, mediaUrls, scheduledTime, pageId, mediaType

    const { post, scheduledTime, useNextFreeSlot } = body as Partial<PublishPostRequest>

    // Convenience params
    const accountId: string | undefined = body.accountId
    const platform: Platform | undefined = body.platform
    const text: string | undefined = body.text
    const mediaUrls: string[] | undefined = body.mediaUrls
    const pageId: string | undefined = body.pageId
    const mediaType: FacebookMediaType | InstagramMediaType | undefined = body.mediaType

    let result

    if (post && post.accountId && post.content && post.target) {
      // Full request passthrough
      const requestPayload: PublishPostRequest = {
        post,
        ...(scheduledTime ? { scheduledTime } : {}),
        ...(useNextFreeSlot ? { useNextFreeSlot } : {}),
      }
      result = await publishPost(requestPayload)
    } else if (accountId && platform && text !== undefined) {
      // Convenience path: text-only or media
      if (mediaUrls && mediaUrls.length > 0) {
        const validation = validateContent(text, mediaUrls, platform)
        if (!validation.valid) {
          return NextResponse.json({
            error: 'Validation failed',
            details: validation.errors
          }, { status: 400 })
        }

        result = await createMediaPost(accountId, platform, text, mediaUrls, {
          scheduledTime,
          pageId,
          mediaType,
        })
      } else {
        result = await createTextPost(accountId, platform, text, {
          scheduledTime,
          pageId,
        })
      }
    } else {
      return NextResponse.json({
        error: 'Missing fields. Provide either `post` (full request) or convenience params: accountId, platform, text. Optional: mediaUrls, scheduledTime, pageId, mediaType.'
      }, { status: 400 })
    }

    // Persist publish result in Supabase (content_items)
    try {
      const { data: contentItem } = await supabase
        .from('content_items')
        .insert({
          type: mediaUrls && mediaUrls.length > 0 ? 'media' : 'text',
          status: result.status === 'failed' ? 'failed' : result.status === 'scheduled' ? 'scheduled' : 'published',
          platform: [platform || (post?.content.platform as string)],
          data: {
            blotatoId: result.id,
            text: text || post?.content.text,
            mediaUrls: mediaUrls || post?.content.mediaUrls || [],
            scheduledTime: scheduledTime || body?.scheduledTime || result.scheduledTime,
            publishedUrl: result.publishedUrl,
            error: result.error,
          },
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      return NextResponse.json({ success: true, result, content: contentItem })
    } catch (dbError) {
      console.warn('Supabase save failed, returning publish result only:', dbError)
      return NextResponse.json({ success: true, result })
    }
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({
      error: 'Failed to publish content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}