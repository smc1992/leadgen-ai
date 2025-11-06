import { NextRequest, NextResponse } from 'next/server'
import { createCampaign } from '@/lib/instantly'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, template, domain, followups } = body

    if (!name || !template || !domain) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create campaign in Instantly
    const instantlyCampaign = await createCampaign({
      name,
      template,
      domain,
      followups: followups || 3,
    })

    // Save to Supabase
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        template,
        domain,
        followups: followups || 3,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign,
      instantlyCampaign,
    })
  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
