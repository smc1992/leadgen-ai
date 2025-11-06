import { NextRequest, NextResponse } from 'next/server'

// kie.ai supports multiple image generation models
const KIE_API_KEY = process.env.KIE_API_KEY!

/**
 * Start image generation (returns immediately with task ID)
 */
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

    console.log('Starting async generation with model:', model)

    // Enhance prompt with style
    const stylePrompts: Record<string, string> = {
      realistic: 'photorealistic, high detail, professional photography',
      illustration: 'digital illustration, artistic, vibrant colors',
      '3d': '3D render, octane render, high quality',
      abstract: 'abstract art, creative, artistic',
      minimalist: 'minimalist design, clean, simple',
    }

    const enhancedPrompt = `${prompt}, ${stylePrompts[style] || ''}`

    // Determine which API to use
    const isFluxKontext = model === 'flux-kontext-pro' || model === 'flux-kontext-max'
    const is4OImage = model === '4o-image'
    const isJobsAPI = !isFluxKontext && !is4OImage

    let taskId: string
    let apiType: string

    if (isFluxKontext) {
      // Flux Kontext API
      apiType = 'flux'
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
        throw new Error(`Flux API error: ${await fluxResponse.text()}`)
      }

      const fluxResult = await fluxResponse.json()
      if (fluxResult.code !== 200 || !fluxResult.data?.taskId) {
        throw new Error(`Flux generation failed: ${fluxResult.msg}`)
      }

      taskId = fluxResult.data.taskId

    } else if (is4OImage) {
      // 4O Image API
      apiType = '4o'
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
        throw new Error(`4O API error: ${await fourOResponse.text()}`)
      }

      const fourOResult = await fourOResponse.json()
      if (fourOResult.code !== 200 || !fourOResult.data?.taskId) {
        throw new Error(`4O generation failed: ${fourOResult.msg}`)
      }

      taskId = fourOResult.data.taskId

    } else {
      // Jobs API
      apiType = 'jobs'
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
        throw new Error(`Jobs API error: ${await jobsResponse.text()}`)
      }

      const jobsResult = await jobsResponse.json()
      if (jobsResult.code !== 200 || !jobsResult.data?.taskId) {
        throw new Error(`Job creation failed: ${jobsResult.msg}`)
      }

      taskId = jobsResult.data.taskId
    }

    // Return task ID immediately
    return NextResponse.json({
      success: true,
      taskId,
      apiType,
      model,
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start image generation' },
      { status: 500 }
    )
  }
}
