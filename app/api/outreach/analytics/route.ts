import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const campaignId = searchParams.get('campaignId')

    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get campaigns for this user
    let campaignsQuery = supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())

    if (campaignId) {
      campaignsQuery = campaignsQuery.eq('id', campaignId)
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery

    if (campaignsError) throw campaignsError

    // Get email statistics from outreach_emails table
    const campaignIds = campaigns?.map(c => c.id) || []
    
    const { data: emails, error: emailsError } = await supabaseAdmin
      .from('outreach_emails')
      .select('*')
      .in('campaign_id', campaignIds)
      .gte('sent_at', startDate.toISOString())

    if (emailsError) throw emailsError

    // Calculate summary statistics
    const totalSent = emails?.length || 0
    const totalDelivered = emails?.filter(e => ['sent', 'opened', 'clicked', 'replied'].includes(e.status)).length || 0
    const totalOpened = emails?.filter(e => ['opened', 'clicked', 'replied'].includes(e.status)).length || 0
    const totalClicked = emails?.filter(e => ['clicked', 'replied'].includes(e.status)).length || 0
    const totalConverted = emails?.filter(e => e.status === 'replied').length || 0

    // Calculate rates
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0'
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0.0'
    const conversionRate = totalClicked > 0 ? ((totalConverted / totalClicked) * 100).toFixed(1) : '0.0'

    // Generate daily performance data
    const performanceData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayEmails = emails?.filter(e => e.sent_at?.startsWith(dateStr)) || []
      
      performanceData.push({
        date: dateStr,
        sent: dayEmails.length,
        delivered: dayEmails.filter(e => ['sent', 'opened', 'clicked', 'replied'].includes(e.status)).length,
        opened: dayEmails.filter(e => ['opened', 'clicked', 'replied'].includes(e.status)).length,
        clicked: dayEmails.filter(e => ['clicked', 'replied'].includes(e.status)).length,
        converted: dayEmails.filter(e => e.status === 'replied').length
      })
    }

    // Get top performing campaigns
    const topCampaigns = campaigns?.map(campaign => {
      const campaignEmails = emails?.filter(e => e.campaign_id === campaign.id) || []
      const sent = campaignEmails.length
      const opened = campaignEmails.filter(e => ['opened', 'clicked', 'replied'].includes(e.status)).length
      const clicked = campaignEmails.filter(e => ['clicked', 'replied'].includes(e.status)).length
      const converted = campaignEmails.filter(e => e.status === 'replied').length

      return {
        id: campaign.id,
        name: campaign.name,
        sent,
        opened,
        clicked,
        converted,
        openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0',
        clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0.0',
        conversionRate: clicked > 0 ? ((converted / clicked) * 100).toFixed(1) : '0.0'
      }
    }).sort((a, b) => parseFloat(b.openRate) - parseFloat(a.openRate)).slice(0, 5) || []

    // Time-based analysis (group by hour)
    const timeData = Array.from({ length: 6 }, (_, i) => {
      const hour = (i * 3 + 6) % 24
      const hourStr = `${hour}:00`
      const hourEmails = emails?.filter(e => {
        const emailHour = new Date(e.sent_at).getHours()
        return emailHour >= hour && emailHour < hour + 3
      }) || []

      return {
        hour: `${hour}AM`,
        opens: hourEmails.filter(e => ['opened', 'clicked', 'replied'].includes(e.status)).length,
        clicks: hourEmails.filter(e => ['clicked', 'replied'].includes(e.status)).length
      }
    })

    const analytics = {
      summary: {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalConverted,
        avgOpenRate: openRate,
        avgClickRate: clickRate,
        avgConversionRate: conversionRate
      },
      performance: performanceData,
      topCampaigns,
      timeData,
      deviceBreakdown: [
        { name: "Desktop", value: 65, color: "#3b82f6" },
        { name: "Mobile", value: 28, color: "#10b981" },
        { name: "Tablet", value: 7, color: "#f59e0b" }
      ]
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
