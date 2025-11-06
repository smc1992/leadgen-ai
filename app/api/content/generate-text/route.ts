import { NextRequest, NextResponse } from 'next/server'
import { generateText, GenerateTextParams, BlotatoTextResponse } from '@/lib/blotato'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prompt,
      tone,
      platform,
      targetAudience,
      includeHashtags,
      includeCTA,
      includeEmojis,
    } = body

    if (!prompt || !tone || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, tone, platform' },
        { status: 400 }
      )
    }

    const params: GenerateTextParams = {
      prompt,
      tone,
      channel: platform,
      targetAudience,
      includeHashtags: includeHashtags ?? true,
      includeCTA: includeCTA ?? true,
      includeEmojis: includeEmojis ?? false,
    }

    // Generate content with Blotato
    const generatedContent: BlotatoTextResponse = await generateText(params)

    // Save to Supabase
    const { data: contentItem, error } = await supabase
      .from('content_items')
      .insert({
        type: 'text',
        status: 'draft',
        platform: [platform],
        data: {
          prompt,
          tone,
          targetAudience,
          headline: generatedContent.headline,
          body: generatedContent.body,
          hashtags: generatedContent.hashtags,
          cta: generatedContent.cta,
          metadata: generatedContent.metadata,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      content: contentItem,
      generated: generatedContent,
    })
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
