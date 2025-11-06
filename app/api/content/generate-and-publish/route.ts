import { NextRequest, NextResponse } from 'next/server'
import { createTextPost } from '@/lib/blotato-api'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      accountId,
      platform,
      prompt,
      tone,
      targetAudience,
      includeHashtags,
      includeCTA,
      includeEmojis,
    } = body

    if (!accountId || !platform || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, platform, prompt' },
        { status: 400 }
      )
    }

    // Generate content text (you can enhance this with AI later)
    let contentText = prompt
    
    // Add hashtags if requested
    if (includeHashtags) {
      const hashtags = generateHashtags(prompt, platform)
      contentText += `\n\n${hashtags.join(' ')}`
    }
    
    // Add CTA if requested
    if (includeCTA) {
      const cta = generateCTA(platform)
      contentText += `\n\n${cta}`
    }

    // Add emojis if requested
    if (includeEmojis) {
      contentText = addEmojis(contentText)
    }

    // Publish to Blotato
    const result = await createTextPost(
      accountId,
      platform as any,
      contentText
    )

    // Save to Supabase
    const { data: contentItem, error } = await supabase
      .from('content_items')
      .insert({
        type: 'text',
        status: 'published',
        platform: [platform],
        data: {
          blotatoId: result.id,
          prompt,
          tone,
          targetAudience,
          text: contentText,
          publishedUrl: result.publishedUrl,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
    }

    // Return generated content for preview
    const words = contentText.split(/\s+/).length
    const chars = contentText.length

    return NextResponse.json({
      success: true,
      result,
      generated: {
        headline: prompt.split('\n')[0],
        body: contentText,
        hashtags: includeHashtags ? extractHashtags(contentText) : [],
        cta: includeCTA ? extractCTA(contentText) : '',
        metadata: {
          wordCount: words,
          characterCount: chars,
          estimatedReadTime: Math.ceil(words / 200),
        },
      },
    })
  } catch (error) {
    console.error('Generate and publish error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate and publish content',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Helper functions
function generateHashtags(text: string, platform: string): string[] {
  // Simple hashtag generation - can be enhanced with AI
  const keywords = ['Logistics', 'AirFreight', 'SupplyChain', 'GlobalTrade', 'EmexExpress']
  return keywords.slice(0, 5).map(k => `#${k}`)
}

function generateCTA(platform: string): string {
  const ctas = {
    linkedin: 'Connect with us to learn more! 🚀',
    twitter: 'Follow for more insights! 🚀',
    facebook: 'Like and share if you found this helpful! 👍',
    instagram: 'Follow for daily logistics tips! 📦',
    tiktok: 'Follow for more! 🎯',
  }
  return ctas[platform as keyof typeof ctas] || 'Get in touch today! 🚀'
}

function addEmojis(text: string): string {
  // Simple emoji addition - can be enhanced
  return text
    .replace(/speed/gi, 'speed ⚡')
    .replace(/global/gi, 'global 🌍')
    .replace(/delivery/gi, 'delivery 📦')
    .replace(/freight/gi, 'freight ✈️')
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g)
  return matches || []
}

function extractCTA(text: string): string {
  const lines = text.split('\n')
  return lines[lines.length - 1] || ''
}
