import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const leadId = searchParams.get('leadId')

    if (!campaignId || !leadId) {
      // Return 1x1 transparent pixel even on error
      return new NextResponse(
        Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'base64'
        ),
        {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    // Update email status to 'opened'
    const { error: updateError } = await supabaseAdmin
      .from('emails')
      .update({
        status: 'opened',
      })
      .eq('campaign_id', campaignId)
      .eq('lead_id', leadId)
      .eq('status', 'sent') // Only update if currently 'sent'

    if (!updateError) {
      // Increment campaign opened count
      const { data: campaign } = await supabaseAdmin
        .from('email_campaigns')
        .select('opened_count')
        .eq('id', campaignId)
        .single()

      if (campaign) {
        await supabaseAdmin
          .from('email_campaigns')
          .update({
            opened_count: (campaign.opened_count || 0) + 1,
          })
          .eq('id', campaignId)
      }
    }

    // Return 1x1 transparent pixel
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      ),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Track open error:', error)
    
    // Return 1x1 transparent pixel even on error
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      ),
      {
        headers: {
          'Content-Type': 'image/gif',
        },
      }
    )
  }
}
