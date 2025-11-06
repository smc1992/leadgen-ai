import { NextRequest, NextResponse } from 'next/server'
import { uploadMedia } from '@/lib/blotato-api'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'Missing required field: url' },
        { status: 400 }
      )
    }

    // Upload to Blotato CDN
    const result = await uploadMedia({ url })

    // Save to Supabase
    const { data: contentItem, error } = await supabase
      .from('content_items')
      .insert({
        type: 'image',
        status: 'draft',
        platform: [],
        data: {
          originalUrl: url,
          blotatoUrl: result.url,
          uploadedAt: new Date().toISOString(),
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
      blotatoUrl: result.url,
      content: contentItem,
    })
  } catch (error) {
    console.error('Upload to Blotato error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload to Blotato',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
