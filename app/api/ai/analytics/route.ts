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
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(timeRange.replace('d', '')))

    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()

    // Get AI usage analytics
    const [
      { data: conversations },
      { data: usageLogs },
      { data: insights }
    ] = await Promise.all([
      supabaseAdmin
        .from('ai_conversations')
        .select('context, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr),
      
      supabaseAdmin
        .from('ai_usage_logs')
        .select('ai_type, tokens_used, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr),
      
      supabaseAdmin
        .from('ai_insights')
        .select('insight_type, confidence_score, is_implemented, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
    ])

    // Calculate metrics
    const totalConversations = conversations?.length || 0
    const totalTokensUsed = usageLogs?.reduce((acc, log) => acc + (log.tokens_used || 0), 0) || 0
    const totalInsights = insights?.length || 0
    const implementedInsights = insights?.filter(i => i.is_implemented).length || 0

    // Context distribution
    const contextDistribution = conversations?.reduce((acc, conv) => {
      acc[conv.context] = (acc[conv.context] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // AI type distribution
    const aiTypeDistribution = usageLogs?.reduce((acc, log) => {
      acc[log.ai_type] = (acc[log.ai_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Daily usage trends
    const dailyTrends = conversations?.reduce((acc, conv) => {
      const date = new Date(conv.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Insight performance
    const insightPerformance = insights?.reduce((acc, insight) => {
      acc[insight.insight_type] = (acc[insight.insight_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const analytics = {
      overview: {
        totalConversations,
        totalTokensUsed,
        totalInsights,
        implementedInsights,
        implementationRate: totalInsights > 0 ? Math.round((implementedInsights / totalInsights) * 100) : 0
      },
      usage: {
        contextDistribution,
        aiTypeDistribution,
        dailyTrends,
        avgTokensPerConversation: totalConversations > 0 ? Math.round(totalTokensUsed / totalConversations) : 0
      },
      insights: {
        distribution: insightPerformance,
        avgConfidence: insights?.reduce((acc, i) => acc + (i.confidence_score || 0), 0) / (insights?.length || 1) || 0
      }
    }

    return NextResponse.json({
      analytics,
      timeRange,
      period: { start: startDateStr, end: endDateStr }
    })

  } catch (error) {
    console.error('AI Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch AI analytics' }, { status: 500 })
  }
}
