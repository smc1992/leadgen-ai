import { NextRequest, NextResponse } from 'next/server'
import { createVideo, CreateVideoRequest } from '@/lib/blotato-api'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic,
      duration,
      style,
      script,
      voiceover,
      backgroundMusic,
      captions,
    } = body

    if (!topic || !duration || !style) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, duration, style' },
        { status: 400 }
      )
    }

    // Map style to Blotato VideoStyle
    const blotatoStyle = style === 'modern' ? 'cinematic' : 
                         style === 'minimal' ? 'realistic' :
                         style === 'corporate' ? 'corporate' :
                         style === 'creative' ? 'painterly' :
                         style === 'animated' ? 'animated' : 'cinematic'

    const videoRequest: CreateVideoRequest = {
      template: { 
        id: 'base/pov/wakeup',
        captionPosition: captions ? 'bottom' : null
      },
      script: script || topic,
      style: blotatoStyle as any,
      animateFirstImage: true,
    }

    // Generate video with Blotato
    const video = await createVideo(videoRequest)

    // Save to Supabase
    const { data: contentItem, error } = await supabase
      .from('content_items')
      .insert({
        type: 'video',
        status: 'processing',
        platform: [],
        data: {
          topic,
          duration,
          style,
          script,
          blotatoId: video.id,
          status: video.status,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
    }

    return NextResponse.json({
      success: true,
      content: contentItem,
      video: {
        id: video.id,
        status: video.status,
      },
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
