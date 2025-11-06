import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToSupabase } from '@/lib/supabase-storage'
import { supabase } from '@/lib/supabase'

const KIE_API_KEY = process.env.KIE_API_KEY!

/**
 * Check image generation status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, apiType, model, prompt, style, aspectRatio, outputFormat } = body

    if (!taskId || !apiType) {
      return NextResponse.json(
        { error: 'Missing taskId or apiType' },
        { status: 400 }
      )
    }

    let imageUrl: string | undefined
    let status: 'pending' | 'completed' | 'failed' = 'pending'

    if (apiType === 'flux') {
      // Check Flux Kontext status
      const statusResponse = await fetch(
        `https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${KIE_API_KEY}`,
          },
        }
      )

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json()

        if (statusResult.data.successFlag === 1 && statusResult.data.response?.resultImageUrl) {
          imageUrl = statusResult.data.response.resultImageUrl
          status = 'completed'
        } else if (statusResult.data.successFlag === 2 || statusResult.data.successFlag === 3) {
          status = 'failed'
        }
      }

    } else if (apiType === '4o') {
      // Check 4O status
      const statusResponse = await fetch(
        `https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${KIE_API_KEY}`,
          },
        }
      )

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json()

        if (statusResult.data.status === 1 && statusResult.data.imageUrl) {
          imageUrl = statusResult.data.imageUrl
          status = 'completed'
        } else if (statusResult.data.status === 2 || statusResult.data.status === 3) {
          status = 'failed'
        }
      }

    } else if (apiType === 'jobs') {
      // Check Jobs API status
      const statusResponse = await fetch(
        `https://api.kie.ai/api/v1/jobs/queryTask?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${KIE_API_KEY}`,
          },
        }
      )

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json()

        if (statusResult.data.status === 'completed' && statusResult.data.result?.images?.[0]) {
          imageUrl = statusResult.data.result.images[0].url
          status = 'completed'
        } else if (statusResult.data.status === 'failed') {
          status = 'failed'
        }
      }
    }

    if (status === 'completed' && imageUrl) {
      // Upload to Supabase
      let supabaseUrl = imageUrl
      try {
        supabaseUrl = await uploadImageToSupabase(imageUrl)
      } catch (error) {
        console.warn('Supabase upload failed:', error)
      }

      // Save to database
      try {
        await supabase
          .from('content_items')
          .insert({
            type: 'image',
            status: 'draft',
            platform: [],
            data: {
              prompt,
              style,
              aspectRatio,
              model,
              imageUrl: supabaseUrl,
              originalUrl: imageUrl,
              generatedWith: 'kie.ai',
              taskId,
            },
            created_at: new Date().toISOString(),
          })
      } catch (error) {
        console.warn('Database save failed:', error)
      }

      return NextResponse.json({
        success: true,
        status: 'completed',
        image: {
          id: 'img-' + Date.now(),
          imageUrl: supabaseUrl,
          thumbnailUrl: supabaseUrl,
          prompt,
          style,
          aspectRatio,
          metadata: {
            width: 1024,
            height: 1024,
            format: outputFormat || 'png',
            fileSize: 0,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      status,
    })

  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    )
  }
}
