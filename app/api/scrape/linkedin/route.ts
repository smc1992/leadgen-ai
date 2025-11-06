import { NextRequest, NextResponse } from 'next/server'
import { scrapeLinkedInProfiles } from '@/lib/apify'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchUrl } = body

    if (!searchUrl) {
      return NextResponse.json(
        { error: 'Search URL is required' },
        { status: 400 }
      )
    }

    // Start Apify scraping
    const run = await scrapeLinkedInProfiles(searchUrl)

    // Log scrape run
    const { data: scrapeRun } = await supabase
      .from('scrape_runs')
      .insert({
        type: 'linkedin',
        status: 'running',
        result_count: 0,
        triggered_by: 'manual',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      runId: run.data.id,
      scrapeRunId: scrapeRun?.id,
      message: 'LinkedIn scraping started',
    })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      { error: 'Failed to start scraping' },
      { status: 500 }
    )
  }
}
