import { supabaseAdmin } from './supabase'

export interface AIContext {
  userStats: {
    totalLeads: number
    avgScore: number
    activeCampaigns: number
    totalSent: number
    avgOpenRate: number
    templatesCount: number
    knowledgeBasesCount: number
  }
  recentActivity: {
    recentLeads: any[]
    recentCampaigns: any[]
    topPerformingCampaigns: any[]
  }
  insights: {
    leadQuality: string
    campaignPerformance: string
    recommendations: string[]
  }
}

export class AIContextManager {
  static async getContext(userId: string, timeRange: string = '30d'): Promise<AIContext> {
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
    }

    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()

    try {
      // Get user stats
      const userStats = await this.getUserStats(userId, startDateStr, endDateStr)
      
      // Get recent activity
      const recentActivity = await this.getRecentActivity(userId, startDateStr, endDateStr)
      
      // Generate insights
      const insights = await this.generateInsights(userStats, recentActivity)

      return {
        userStats,
        recentActivity,
        insights
      }
    } catch (error) {
      console.error('Error getting AI context:', error)
      return this.getEmptyContext()
    }
  }

  static async getLeadContext(leadId: string, userId: string): Promise<any> {
    try {
      const { data: lead, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('user_id', userId)
        .single()

      if (error || !lead) {
        return null
      }

      // Get similar leads for comparison
      const { data: similarLeads } = await supabaseAdmin
        .from('leads')
        .select('full_name, email, score, job_title, company, region')
        .eq('user_id', userId)
        .eq('region', lead.region)
        .gte('score', lead.score - 10)
        .lte('score', lead.score + 10)
        .limit(5)

      // Get campaign history for this lead
      const { data: campaignHistory } = await supabaseAdmin
        .from('campaigns')
        .select('name, status, sent_count, opened_count, clicked_count')
        .eq('user_id', userId)
        .contains('lead_ids', [leadId])
        .limit(3)

      return {
        lead,
        similarLeads: similarLeads || [],
        campaignHistory: campaignHistory || [],
        insights: this.generateLeadInsights(lead, similarLeads || [])
      }
    } catch (error) {
      console.error('Error getting lead context:', error)
      return null
    }
  }

  static async getCampaignContext(campaignId: string, userId: string): Promise<any> {
    try {
      const { data: campaign, error } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single()

      if (error || !campaign) {
        return null
      }

      // Get campaign performance compared to others
      const { data: allCampaigns } = await supabaseAdmin
        .from('campaigns')
        .select('name, open_rate, click_rate, reply_rate, status')
        .eq('user_id', userId)
        .not('open_rate', 'is', null)

      const avgOpenRate = allCampaigns?.reduce((acc, c) => acc + (c.open_rate || 0), 0) / (allCampaigns?.length || 1)
      const avgClickRate = allCampaigns?.reduce((acc, c) => acc + (c.click_rate || 0), 0) / (allCampaigns?.length || 1)

      // Get leads in this campaign
      const { data: campaignLeads } = await supabaseAdmin
        .from('leads')
        .select('full_name, email, score, job_title, company')
        .eq('user_id', userId)
        .contains('campaign_ids', [campaignId])
        .limit(10)

      return {
        campaign,
        performance: {
          openRate: campaign.open_rate || 0,
          clickRate: campaign.click_rate || 0,
          replyRate: campaign.reply_rate || 0,
          vsAverage: {
            openRate: ((campaign.open_rate || 0) - avgOpenRate).toFixed(1),
            clickRate: ((campaign.click_rate || 0) - avgClickRate).toFixed(1)
          }
        },
        leads: campaignLeads || [],
        insights: this.generateCampaignInsights(campaign, avgOpenRate, avgClickRate)
      }
    } catch (error) {
      console.error('Error getting campaign context:', error)
      return null
    }
  }

  private static async getUserStats(userId: string, startDate: string, endDate: string) {
    const [
      { data: leadsStats },
      { data: campaignsStats },
      { count: templatesCount },
      { count: knowledgeBasesCount }
    ] = await Promise.all([
      supabaseAdmin
        .from('leads')
        .select('score, email_status, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      supabaseAdmin
        .from('campaigns')
        .select('status, sent_count, opened_count, clicked_count, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      supabaseAdmin
        .from('email_templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      supabaseAdmin
        .from('knowledge_bases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    ])

    const totalLeads = leadsStats?.length || 0
    const avgScore = totalLeads > 0 
      ? Math.round((leadsStats?.reduce((acc, l) => acc + l.score, 0) || 0) / totalLeads)
      : 0
    
    const activeCampaigns = campaignsStats?.filter(c => c.status === 'active').length || 0
    const totalSent = campaignsStats?.reduce((acc, c) => acc + c.sent_count, 0) || 0
    const totalOpened = campaignsStats?.reduce((acc, c) => acc + c.opened_count, 0) || 0
    const avgOpenRate = totalSent > 0 
      ? Math.round((totalOpened / totalSent) * 100)
      : 0

    return {
      totalLeads,
      avgScore,
      activeCampaigns,
      totalSent,
      avgOpenRate,
      templatesCount: templatesCount || 0,
      knowledgeBasesCount: knowledgeBasesCount || 0
    }
  }

  private static async getRecentActivity(userId: string, startDate: string, endDate: string) {
    const [
      { data: recentLeads },
      { data: recentCampaigns },
      { data: topCampaigns }
    ] = await Promise.all([
      supabaseAdmin
        .from('leads')
        .select('full_name, email, score, company, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(10),
      
      supabaseAdmin
        .from('campaigns')
        .select('name, status, sent_count, opened_count, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabaseAdmin
        .from('campaigns')
        .select('name, open_rate, click_rate, sent_count')
        .eq('user_id', userId)
        .not('open_rate', 'is', null)
        .order('open_rate', { ascending: false })
        .limit(3)
    ])

    return {
      recentLeads: recentLeads || [],
      recentCampaigns: recentCampaigns || [],
      topPerformingCampaigns: topCampaigns || []
    }
  }

  private static async generateInsights(userStats: any, recentActivity: any) {
    const insights = {
      leadQuality: '',
      campaignPerformance: '',
      recommendations: [] as string[]
    }

    // Lead quality insights
    if (userStats.avgScore >= 80) {
      insights.leadQuality = 'Excellent lead quality with high average scores'
      insights.recommendations.push('Focus on scaling outreach with current quality sources')
    } else if (userStats.avgScore >= 60) {
      insights.leadQuality = 'Good lead quality with room for improvement'
      insights.recommendations.push('Consider refining targeting criteria to improve scores')
    } else {
      insights.leadQuality = 'Lead quality needs improvement'
      insights.recommendations.push('Review lead sources and scoring criteria')
    }

    // Campaign performance insights
    if (userStats.avgOpenRate >= 40) {
      insights.campaignPerformance = 'Strong email engagement rates'
      insights.recommendations.push('Test more aggressive outreach strategies')
    } else if (userStats.avgOpenRate >= 25) {
      insights.campaignPerformance = 'Moderate email performance'
      insights.recommendations.push('Focus on subject line optimization and personalization')
    } else {
      insights.campaignPerformance = 'Email performance needs attention'
      insights.recommendations.push('Review email lists, subject lines, and sending times')
    }

    // Activity-based recommendations
    if (recentActivity.recentCampaigns.length === 0) {
      insights.recommendations.push('Consider launching new campaigns to engage your leads')
    }

    if (userStats.activeCampaigns === 0 && userStats.totalLeads > 50) {
      insights.recommendations.push('You have leads but no active campaigns - time to start outreach!')
    }

    return insights
  }

  private static generateLeadInsights(lead: any, similarLeads: any[]) {
    const insights = {
      quality: '',
      outreachPotential: '',
      recommendations: [] as string[]
    }

    if (lead.score >= 80) {
      insights.quality = 'High-quality lead with strong engagement potential'
      insights.outreachPotential = 'Excellent candidate for immediate outreach'
      insights.recommendations.push('Prioritize this lead for immediate contact')
    } else if (lead.score >= 60) {
      insights.quality = 'Good lead with moderate potential'
      insights.outreachPotential = 'Worth pursuing with personalized approach'
      insights.recommendations.push('Research company thoroughly before outreach')
    } else {
      insights.quality = 'Lower quality lead requiring qualification'
      insights.outreachPotential = 'Needs additional research before outreach'
      insights.recommendations.push('Verify lead information and company relevance')
    }

    if (similarLeads.length > 0) {
      const avgSimilarScore = similarLeads.reduce((acc, l) => acc + l.score, 0) / similarLeads.length
      if (lead.score > avgSimilarScore) {
        insights.recommendations.push('This lead scores above average for similar profiles in your region')
      }
    }

    return insights
  }

  private static generateCampaignInsights(campaign: any, avgOpenRate: number, avgClickRate: number) {
    const insights = {
      performance: '',
      optimization: '',
      recommendations: [] as string[]
    }

    const openRateDiff = (campaign.open_rate || 0) - avgOpenRate
    const clickRateDiff = (campaign.click_rate || 0) - avgClickRate

    if (openRateDiff > 5) {
      insights.performance = 'Above average open rate performance'
      insights.recommendations.push('Subject line strategy is working well - apply to other campaigns')
    } else if (openRateDiff < -5) {
      insights.performance = 'Below average open rate - needs improvement'
      insights.recommendations.push('Test different subject lines and sending times')
    }

    if (clickRateDiff > 2) {
      insights.optimization = 'Excellent click-through performance'
      insights.recommendations.push('Content and CTAs are resonating with audience')
    } else if (clickRateDiff < -2) {
      insights.optimization = 'Click-through rate needs optimization'
      insights.recommendations.push('Review email content and call-to-action clarity')
    }

    if (campaign.status === 'active' && campaign.sent_count < 100) {
      insights.recommendations.push('Consider scaling this campaign to reach more leads')
    }

    return insights
  }

  private static getEmptyContext(): AIContext {
    return {
      userStats: {
        totalLeads: 0,
        avgScore: 0,
        activeCampaigns: 0,
        totalSent: 0,
        avgOpenRate: 0,
        templatesCount: 0,
        knowledgeBasesCount: 0
      },
      recentActivity: {
        recentLeads: [],
        recentCampaigns: [],
        topPerformingCampaigns: []
      },
      insights: {
        leadQuality: 'No data available',
        campaignPerformance: 'No data available',
        recommendations: ['Start by importing leads and creating campaigns']
      }
    }
  }
}
