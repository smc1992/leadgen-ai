import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const leadId = searchParams.get('leadId')
    const url = searchParams.get('url')

    if (!campaignId || !leadId || !url) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Update email status to 'clicked'
    const { error: updateError } = await supabaseAdmin
      .from('emails')
      .update({
        status: 'clicked',
      })
      .eq('campaign_id', campaignId)
      .eq('lead_id', leadId)
      .in('status', ['sent', 'opened']) // Update if sent or opened

    if (!updateError) {
      // Increment campaign clicked count
      const { data: campaign } = await supabaseAdmin
        .from('email_campaigns')
        .select('clicked_count')
        .eq('id', campaignId)
        .single()

      if (campaign) {
        await supabaseAdmin
          .from('email_campaigns')
          .update({
            clicked_count: (campaign.clicked_count || 0) + 1,
          })
          .eq('id', campaignId)
      }
    }

    // Redirect to the original URL
    return NextResponse.redirect(decodeURIComponent(url))
  } catch (error) {
    console.error('Track click error:', error)
    
    // Try to redirect to URL even on error
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (url) {
      return NextResponse.redirect(decodeURIComponent(url))
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
