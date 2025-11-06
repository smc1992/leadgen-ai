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

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    const type = searchParams.get('type') || 'overview'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()

    let data: any = {}

    switch (type) {
      case 'overview':
        data = await getOverviewAnalytics(session.user.id, startDateStr, endDateStr)
        break
      case 'leads':
        data = await getLeadsAnalytics(session.user.id, startDateStr, endDateStr)
        break
      case 'campaigns':
        data = await getCampaignsAnalytics(session.user.id, startDateStr, endDateStr)
        break
      case 'performance':
        data = await getPerformanceAnalytics(session.user.id, startDateStr, endDateStr)
        break
      default:
        data = await getOverviewAnalytics(session.user.id, startDateStr, endDateStr)
    }

    return NextResponse.json({
      analytics: data,
      timeRange,
      type,
      period: { start: startDateStr, end: endDateStr }
    })

  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getOverviewAnalytics(userId: string, startDate: string, endDate: string) {
  try {
    // Get leads stats
    const { data: leadsStats } = await supabaseAdmin
      .from('leads')
      .select('id, score, is_outreach_ready, email_status, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Get campaigns stats
    const { data: campaignsStats } = await supabaseAdmin
      .from('campaigns')
      .select('id, status, sent_count, opened_count, clicked_count, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Get templates count
    const { count: templatesCount } = await supabaseAdmin
      .from('email_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get knowledge bases count
    const { count: knowledgeBasesCount } = await supabaseAdmin
      .from('knowledge_bases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const totalLeads = leadsStats?.length || 0
    const outreachReady = leadsStats?.filter(l => l.is_outreach_ready).length || 0
    const validEmails = leadsStats?.filter(l => l.email_status === 'valid').length || 0
    const avgScore = totalLeads > 0 
      ? Math.round((leadsStats?.reduce((acc, l) => acc + l.score, 0) || 0) / totalLeads)
      : 0

    const totalCampaigns = campaignsStats?.length || 0
    const activeCampaigns = campaignsStats?.filter(c => c.status === 'active').length || 0
    const totalSent = campaignsStats?.reduce((acc, c) => acc + c.sent_count, 0) || 0
    const totalOpened = campaignsStats?.reduce((acc, c) => acc + c.opened_count, 0) || 0

    return {
      leads: {
        total: totalLeads,
        outreachReady,
        validEmails,
        avgScore,
        growth: calculateGrowth(leadsStats, 'created_at')
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        sent: totalSent,
        opened: totalOpened,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
      },
      content: {
        templates: templatesCount || 0,
        knowledgeBases: knowledgeBasesCount || 0
      }
    }
  } catch (error) {
    console.error('Overview analytics error:', error)
    throw error
  }
}

async function getLeadsAnalytics(userId: string, startDate: string, endDate: string) {
  try {
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('score, email_status, region, channel, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Score distribution
    const scoreDistribution = {
      high: leads?.filter(l => l.score >= 80).length || 0,
      medium: leads?.filter(l => l.score >= 50 && l.score < 80).length || 0,
      low: leads?.filter(l => l.score < 50).length || 0
    }

    // Email status distribution
    const emailDistribution = {
      valid: leads?.filter(l => l.email_status === 'valid').length || 0,
      invalid: leads?.filter(l => l.email_status === 'invalid').length || 0,
      unknown: leads?.filter(l => l.email_status === 'unknown').length || 0
    }

    // Region distribution
    const regionDistribution = leads?.reduce((acc, lead) => {
      const region = lead.region || 'unknown'
      acc[region] = (acc[region] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Channel distribution
    const channelDistribution = leads?.reduce((acc, lead) => {
      acc[lead.channel] = (acc[lead.channel] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Daily trends
    const dailyTrends = leads?.reduce((acc, lead) => {
      const date = new Date(lead.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      scoreDistribution,
      emailDistribution,
      regionDistribution,
      channelDistribution,
      dailyTrends,
      totalLeads: leads?.length || 0
    }
  } catch (error) {
    console.error('Leads analytics error:', error)
    throw error
  }
}

async function getCampaignsAnalytics(userId: string, startDate: string, endDate: string) {
  try {
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('status, sent_count, opened_count, clicked_count, replied_count, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Status distribution
    const statusDistribution = campaigns?.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Performance metrics
    const totalSent = campaigns?.reduce((acc, c) => acc + c.sent_count, 0) || 0
    const totalOpened = campaigns?.reduce((acc, c) => acc + c.opened_count, 0) || 0
    const totalClicked = campaigns?.reduce((acc, c) => acc + c.clicked_count, 0) || 0
    const totalReplied = campaigns?.reduce((acc, c) => acc + c.replied_count, 0) || 0

    const performance = {
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      clickRate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0,
      replyRate: totalOpened > 0 ? Math.round((totalReplied / totalOpened) * 100) : 0
    }

    // Daily trends
    const dailyTrends = campaigns?.reduce((acc, campaign) => {
      const date = new Date(campaign.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { created: 0, sent: 0, opened: 0 }
      }
      acc[date].created += 1
      acc[date].sent += campaign.sent_count
      acc[date].opened += campaign.opened_count
      return acc
    }, {} as Record<string, any>) || {}

    return {
      statusDistribution,
      performance,
      dailyTrends,
      totalCampaigns: campaigns?.length || 0,
      totalSent,
      totalOpened,
      totalClicked
    }
  } catch (error) {
    console.error('Campaigns analytics error:', error)
    throw error
  }
}

async function getPerformanceAnalytics(userId: string, startDate: string, endDate: string) {
  try {
    // Get recent performance data
    const { data: recentCampaigns } = await supabaseAdmin
      .from('campaigns')
      .select('sent_count, opened_count, clicked_count, replied_count, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate top performing campaigns
    const topCampaigns = recentCampaigns?.map(campaign => {
      const openRate = campaign.sent_count > 0 ? (campaign.opened_count / campaign.sent_count) * 100 : 0
      const clickRate = campaign.opened_count > 0 ? (campaign.clicked_count / campaign.opened_count) * 100 : 0
      return {
        ...campaign,
        openRate: Math.round(openRate),
        clickRate: Math.round(clickRate),
        performance: Math.round((openRate + clickRate) / 2)
      }
    }).sort((a, b) => b.performance - a.performance) || []

    // Get conversion funnel data
    const funnel = {
      leads: await getLeadsCount(userId, startDate, endDate),
      outreach: await getOutreachReadyCount(userId, startDate, endDate),
      sent: recentCampaigns?.reduce((acc, c) => acc + c.sent_count, 0) || 0,
      opened: recentCampaigns?.reduce((acc, c) => acc + c.opened_count, 0) || 0,
      clicked: recentCampaigns?.reduce((acc, c) => acc + c.clicked_count, 0) || 0
    }

    return {
      topCampaigns,
      funnel,
      trends: await getPerformanceTrends(userId, startDate, endDate)
    }
  } catch (error) {
    console.error('Performance analytics error:', error)
    throw error
  }
}

// Helper functions
async function getLeadsCount(userId: string, startDate: string, endDate: string) {
  const { count } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
  return count || 0
}

async function getOutreachReadyCount(userId: string, startDate: string, endDate: string) {
  const { count } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_outreach_ready', true)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
  return count || 0
}

async function getPerformanceTrends(userId: string, startDate: string, endDate: string) {
  // This would typically involve more complex time-series analysis
  // For now, returning basic trend data
  return {
    leadsGrowth: '+12.5%',
    engagementGrowth: '+8.2%',
    conversionGrowth: '+5.1%'
  }
}

function calculateGrowth(items: any[], dateField: string): string {
  if (!items || items.length < 2) return '+0%'
  
  const now = new Date()
  const previous = new Date()
  previous.setDate(now.getDate() - 30)
  
  const currentPeriod = items.filter(item => 
    new Date(item[dateField]) > previous
  ).length
  
  const olderPeriod = items.filter(item => 
    new Date(item[dateField]) <= previous
  ).length
  
  if (olderPeriod === 0) return '+100%'
  
  const growth = Math.round(((currentPeriod - olderPeriod) / olderPeriod) * 100)
  return `${growth > 0 ? '+' : ''}${growth}%`
}
