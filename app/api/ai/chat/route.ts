import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { chat as llmChat } from '@/lib/llm'
import { config } from '@/lib/config'
import { enforceGuards } from '@/lib/security'
import { AiChatSchema } from '@/lib/validation'

// System prompts for different contexts
const SYSTEM_PROMPTS = {
  general: `You are Emex AI Assistant, a helpful and knowledgeable assistant for the Emex Lead Generation Platform. You are professional, friendly, and expert in lead generation, email marketing, and sales automation.

Key capabilities you can help with:
- Lead management and scoring strategies
- Email campaign optimization
- Analytics interpretation and insights
- Platform feature guidance
- Best practices for lead generation

Always provide actionable, specific advice. Use emojis occasionally to be engaging. Keep responses concise but comprehensive.`,

  leads: `You are a lead generation expert helping with the Emex platform. Focus on:
- Lead quality assessment and scoring
- Lead sourcing strategies (LinkedIn, Google Maps)
- Data validation and enrichment
- Lead segmentation and targeting
- Conversion optimization strategies

Provide specific, data-driven recommendations for improving lead quality and conversion rates.`,

  campaigns: `You are an email marketing specialist expert in:
- Campaign strategy and planning
- Subject line optimization
- Email personalization techniques
- A/B testing methodologies
- Deliverability and compliance best practices
- Performance analytics and optimization

Give actionable advice to improve open rates, click-through rates, and overall campaign effectiveness.`,

  analytics: `You are a data analyst specializing in lead generation metrics. Help users:
- Interpret campaign performance data
- Identify trends and patterns
- Calculate ROI and conversion metrics
- Optimize based on data insights
- Set meaningful KPIs and benchmarks

Provide clear explanations of what the numbers mean and how to act on them.`,

  technical: `You are a technical support specialist for the Emex platform. Assist with:
- Platform feature explanations
- Integration setup and troubleshooting
- API usage and automation
- Data import/export processes
- Account configuration and settings

Provide step-by-step guidance and troubleshooting help.`
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `ai-chat-post:${ip}`, 30, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = AiChatSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const { message, context = 'general', conversationHistory = [] } = parsed.data

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get relevant user data for context
    const userData = await getUserContext(session.user.id)
    
    // Build system message with context
    const systemMessage = buildSystemMessage(context, userData)

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user' as const, content: message }
    ]

    // Call OpenAI API
    const aiResponse = await llmChat(messages, 1000)
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Log the conversation for analytics
    await logConversation(session.user.id, message, aiResponse, context)

    return NextResponse.json({
      response: aiResponse,
      context,
      timestamp: new Date().toISOString(),
      usage: undefined
    })

  } catch (error) {
    console.error('AI Chat API error:', error)
    
    // Handle OpenAI specific errors
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes('openai api key')) {
        return NextResponse.json({ 
          error: 'AI configuration missing. Please set OPENAI_API_KEY.' 
        }, { status: 500 })
      }
      if (error.message.toLowerCase().includes('quota')) {
        return NextResponse.json({ 
          error: 'AI service temporarily unavailable. Please try again later.' 
        }, { status: 429 })
      }
    }

    return NextResponse.json({ 
      error: 'Failed to process AI request' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `ai-chat-get:${ip}`, 60, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversation history
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const { data: conversations, error } = await supabaseAdmin
      .from('ai_conversations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      conversations: conversations || [],
      count: conversations?.length || 0
    })

  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

async function getUserContext(userId: string) {
  try {
    // Get user's recent stats for context
    const [
      { data: leadsStats },
      { data: campaignsStats },
      { data: templatesCount },
      { data: knowledgeBasesCount }
    ] = await Promise.all([
      supabaseAdmin
        .from('leads')
        .select('score, email_status, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      supabaseAdmin
        .from('campaigns')
        .select('status, sent_count, opened_count, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
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
    const avgOpenRate = totalSent > 0 
      ? Math.round((campaignsStats?.reduce((acc, c) => acc + c.opened_count, 0) || 0) / totalSent * 100)
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
  } catch (error) {
    console.error('Error getting user context:', error)
    return {}
  }
}

function buildSystemMessage(context: string, userData: any): string {
  const basePrompt = SYSTEM_PROMPTS[context as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.general
  
  if (Object.keys(userData).length === 0) {
    return basePrompt
  }

  const contextInfo = `
Current User Context:
- Total leads: ${userData.totalLeads || 0}
- Average lead score: ${userData.avgScore || 0}/100
- Active campaigns: ${userData.activeCampaigns || 0}
- Emails sent: ${userData.totalSent || 0}
- Average open rate: ${userData.avgOpenRate || 0}%
- Email templates: ${userData.templatesCount || 0}
- Knowledge bases: ${userData.knowledgeBasesCount || 0}

Use this context to provide personalized advice and insights. Reference specific metrics when relevant.`

  return basePrompt + '\n\n' + contextInfo
}

async function logConversation(userId: string, userMessage: string, aiResponse: string, context: string) {
  try {
    await supabaseAdmin
      .from('ai_conversations')
      .insert({
        user_id: userId,
        user_message: userMessage,
        ai_response: aiResponse,
        context,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging conversation:', error)
    // Don't fail the request if logging fails
  }
}
