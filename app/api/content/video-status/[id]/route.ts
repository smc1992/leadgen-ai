import { NextRequest, NextResponse } from 'next/server'
import { getVideo } from '@/lib/blotato-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing video ID' },
        { status: 400 }
      )
    }

    // Get video status from Blotato
    const video = await getVideo(videoId)

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        status: video.status,
        mediaUrl: video.mediaUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        progress: video.progress,
        error: video.error,
      },
    })
  } catch (error) {
    console.error('Video status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get video status',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
