import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadMedia } from '@/lib/blotato-api'
import { uploadImageToSupabase } from '@/lib/supabase-storage'

// kie.ai supports multiple image generation models
const KIE_API_KEY = process.env.KIE_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      style, 
      aspectRatio, 
      model,
      promptUpsampling,
      safetyTolerance,
      outputFormat 
    } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    console.log('Generating image with model:', model)

    // Enhance prompt with style
    const stylePrompts: Record<string, string> = {
      realistic: 'photorealistic, high detail, professional photography',
      illustration: 'digital illustration, artistic, vibrant colors',
      '3d': '3D render, octane render, high quality',
      abstract: 'abstract art, creative, artistic',
      minimalist: 'minimalist design, clean, simple',
    }

    const enhancedPrompt = `${prompt}, ${stylePrompts[style] || ''}`

    let imageUrl: string = ''
    let imageWidth: number | undefined
    let imageHeight: number | undefined
    let taskId: string = ''

    // Determine which API to use based on model
    const isFluxKontext = model === 'flux-kontext-pro' || model === 'flux-kontext-max'
    const is4OImage = model === '4o-image'
    const isJobsAPI = !isFluxKontext && !is4OImage

    if (isFluxKontext) {
      // ===== FLUX KONTEXT API =====
      console.log('Using Flux Kontext API')
      
      const fluxResponse = await fetch('https://api.kie.ai/api/v1/flux/kontext/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          aspectRatio: aspectRatio || '1:1',
          model: model,
          outputFormat: outputFormat || 'png',
          promptUpsampling: promptUpsampling || false,
          safetyTolerance: safetyTolerance || 2,
          enableTranslation: true,
          watermark: false,
        }),
      })

      if (!fluxResponse.ok) {
        const errorText = await fluxResponse.text()
        console.error('Flux API error:', errorText)
        throw new Error(`Flux API error: ${errorText}`)
      }

      const fluxResult = await fluxResponse.json()
      console.log('Flux response:', fluxResult)

      if (fluxResult.code !== 200 || !fluxResult.data?.taskId) {
        throw new Error(`Flux generation failed: ${fluxResult.msg}`)
      }

      taskId = fluxResult.data.taskId

      // Poll for completion
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000))

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
          console.log('Flux status:', statusResult)

          // kie.ai uses successFlag: 1 for success
          if (statusResult.data.successFlag === 1 && statusResult.data.response?.resultImageUrl) {
            imageUrl = statusResult.data.response.resultImageUrl
            imageWidth = 1024 // Default, kie.ai doesn't return dimensions
            imageHeight = 1024
            break
          } else if (statusResult.data.successFlag === 2 || statusResult.data.successFlag === 3) {
            throw new Error(statusResult.data.errorMessage || 'Image generation failed')
          }
        }

        attempts++
      }

      if (!imageUrl) {
        throw new Error('Image generation timeout')
      }

    } else if (is4OImage) {
      // ===== 4O IMAGE API =====
      console.log('Using 4O Image API')
      
      const fourOResponse = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          size: aspectRatio || '1:1',
          isEnhance: promptUpsampling || false,
        }),
      })

      if (!fourOResponse.ok) {
        const errorText = await fourOResponse.text()
        console.error('4O API error:', errorText)
        throw new Error(`4O API error: ${errorText}`)
      }

      const fourOResult = await fourOResponse.json()
      console.log('4O response:', fourOResult)

      if (fourOResult.code !== 200 || !fourOResult.data?.taskId) {
        throw new Error(`4O generation failed: ${fourOResult.msg}`)
      }

      taskId = fourOResult.data.taskId

      // Poll for completion
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000))

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
          console.log('4O status:', statusResult)

          if (statusResult.data.status === 1 && statusResult.data.imageUrl) {
            imageUrl = statusResult.data.imageUrl
            imageWidth = statusResult.data.width
            imageHeight = statusResult.data.height
            break
          } else if (statusResult.data.status === 2 || statusResult.data.status === 3) {
            throw new Error('Image generation failed')
          }
        }

        attempts++
      }

      if (!imageUrl) {
        throw new Error('Image generation timeout')
      }

    } else if (isJobsAPI) {
      // ===== JOBS API (New Models) =====
      console.log('Using Jobs API for model:', model)
      
      const jobsResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          input: {
            prompt: enhancedPrompt,
            aspect_ratio: aspectRatio || '1:1',
          },
        }),
      })

      if (!jobsResponse.ok) {
        const errorText = await jobsResponse.text()
        console.error('Jobs API error:', errorText)
        throw new Error(`Jobs API error: ${errorText}`)
      }

      const jobsResult = await jobsResponse.json()
      console.log('Jobs response:', jobsResult)

      if (jobsResult.code !== 200 || !jobsResult.data?.taskId) {
        throw new Error(`Job creation failed: ${jobsResult.msg}`)
      }

      taskId = jobsResult.data.taskId

      // Poll for completion
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000))

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
          console.log('Jobs status:', statusResult)

          if (statusResult.data.status === 'completed' && statusResult.data.result?.images?.[0]) {
            imageUrl = statusResult.data.result.images[0].url
            imageWidth = statusResult.data.result.images[0].width
            imageHeight = statusResult.data.result.images[0].height
            break
          } else if (statusResult.data.status === 'failed') {
            throw new Error('Image generation failed')
          }
        }

        attempts++
      }

      if (!imageUrl) {
        throw new Error('Image generation timeout')
      }
    }

    // Upload to Supabase Storage
    let supabaseUrl = imageUrl
    try {
      console.log('📤 Uploading to Supabase Storage:', imageUrl)
      supabaseUrl = await uploadImageToSupabase(imageUrl)
      console.log('✅ Uploaded to Supabase:', supabaseUrl)
    } catch (supabaseError) {
      console.warn('⚠️ Supabase upload failed (using original URL):', supabaseError)
    }

    // Upload to Blotato CDN (optional)
    let finalImageUrl = supabaseUrl
    try {
      console.log('📤 Uploading to Blotato CDN:', supabaseUrl)
      const blotatoMedia = await uploadMedia({ url: supabaseUrl })
      finalImageUrl = blotatoMedia.url
      console.log('✅ Uploaded to Blotato:', finalImageUrl)
    } catch (blotatoError) {
      console.warn('⚠️ Blotato upload failed (using Supabase URL):', blotatoError)
    }

    const imageData = {
      id: 'img-' + Date.now(),
      imageUrl: finalImageUrl,
      thumbnailUrl: finalImageUrl,
      prompt,
      style,
      aspectRatio,
      metadata: {
        width: imageWidth || 1024,
        height: imageHeight || 1024,
        format: outputFormat || 'png',
        fileSize: 0,
      },
    }

    // Save to Supabase (optional)
    let contentItem = null
    try {
      const { data, error } = await supabase
        .from('content_items')
        .insert({
          type: 'image',
          status: 'draft',
          platform: [],
          data: {
            prompt,
            style,
            aspectRatio,
            model: model,
            imageUrl: finalImageUrl,
            originalUrl: imageUrl,
            generatedWith: 'kie.ai',
            taskId: taskId,
          },
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.warn('Supabase error (non-critical):', error)
      } else {
        contentItem = data
      }
    } catch (supabaseError) {
      console.warn('Supabase not configured or error:', supabaseError)
    }

    console.log('Image generated successfully!')

    return NextResponse.json({
      success: true,
      image: imageData,
      content: contentItem,
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
