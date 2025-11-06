import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getOpenAIClient } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, type = 'general', data } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    let systemPrompt = ''
    let userPrompt = prompt

    switch (type) {
      case 'lead_scoring':
        systemPrompt = `You are a lead scoring expert. Analyze the provided lead data and return a JSON response with:
{
  "score": 0-100,
  "reasoning": "detailed explanation of the score",
  "recommendations": ["list of actionable recommendations"],
  "priority": "high|medium|low"
}

Consider factors like: job title relevance, company size, email quality, location, etc.`
        userPrompt = `Score this lead: ${JSON.stringify(data)}`
        break

      case 'email_subject':
        systemPrompt = `You are an email marketing expert specializing in subject lines. Generate 3 compelling subject lines for the given campaign details. Return JSON:
{
  "subjects": [
    {
      "text": "subject line",
      "score": 0-100,
      "reasoning": "why this works"
    }
  ]
}

Focus on personalization, urgency, curiosity, and relevance. Keep under 50 characters.`
        break

      case 'campaign_analysis':
        systemPrompt = `You are a campaign analytics expert. Analyze the campaign data and provide insights. Return JSON:
{
  "performance": "excellent|good|average|poor",
  "insights": ["key findings"],
  "recommendations": ["actionable improvements"],
  "next_steps": ["specific actions to take"]
}

Consider open rates, click rates, conversion metrics, and industry benchmarks.`
        break

      case 'lead_enrichment':
        systemPrompt = `You are a lead data enrichment specialist. Based on the provided lead information, suggest additional data points and research strategies. Return JSON:
{
  "enrichment_suggestions": ["data points to research"],
  "research_strategies": ["how to find this information"],
  "potential_value": "high|medium|low",
  "estimated_effort": "high|medium|low"
}`
        break

      case 'content_generation':
        systemPrompt = `You are a content creation expert for lead generation. Generate the requested content based on the provided context. Return JSON:
{
  "content": "generated content",
  "tone": "professional|casual|urgent",
          "personalization_points": ["key personalization opportunities"],
  "call_to_action": "suggested CTA"
}

Keep it concise, personalized, and action-oriented.`
        break

      default:
        systemPrompt = `You are Emex AI Assistant, providing helpful insights for lead generation and marketing. Provide clear, actionable advice.`
    }

    const client = getOpenAIClient()
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    let parsedResponse
    try {
      parsedResponse = JSON.parse(response)
    } catch (parseError) {
      // If JSON parsing fails, return raw response
      parsedResponse = { response, raw: true }
    }

    // Log AI usage for analytics
    await logAIUsage(session.user.id, type, prompt, response)

    return NextResponse.json({
      success: true,
      data: parsedResponse,
      type,
      usage: completion.usage
    })

  } catch (error) {
    console.error('AI Assist API error:', error)
    if (error instanceof Error && error.message.toLowerCase().includes('openai api key')) {
      return NextResponse.json({ error: 'AI configuration missing. Please set OPENAI_API_KEY.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}

async function logAIUsage(userId: string, type: string, prompt: string, response: string) {
  try {
    await supabaseAdmin
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        ai_type: type,
        prompt,
        response,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging AI usage:', error)
  }
}
