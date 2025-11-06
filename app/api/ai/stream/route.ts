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

    const { messages, leadData = null, campaignData = null } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Build contextual system prompt
    const systemPrompt = buildContextualPrompt(leadData, campaignData)

    // Prepare messages with system prompt
    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ]

    // Create streaming completion
    const client = getOpenAIClient()
    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    })

    // Convert the stream to a readable stream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`)
            }
          }
          controller.enqueue('data: [DONE]\n\n')
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    // Log the conversation
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
    if (lastUserMessage) {
      await logStreamingConversation(session.user.id, lastUserMessage.content, leadData, campaignData)
    }

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('AI Stream API error:', error)
    if (error instanceof Error && error.message.toLowerCase().includes('openai api key')) {
      return NextResponse.json({ error: 'AI configuration missing. Please set OPENAI_API_KEY.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to start streaming' }, { status: 500 })
  }
}

function buildContextualPrompt(leadData: any, campaignData: any): string {
  let prompt = `You are Emex AI Assistant, a helpful expert in lead generation and email marketing. You have access to the user's current data and context. Provide personalized, actionable advice based on the specific information available.`

  if (leadData) {
    prompt += `\n\nCurrent Lead Context:\n${JSON.stringify(leadData, null, 2)}\n\nUse this lead information to provide specific advice about this particular lead - scoring, outreach strategy, personalization opportunities, etc.`
  }

  if (campaignData) {
    prompt += `\n\nCurrent Campaign Context:\n${JSON.stringify(campaignData, null, 2)}\n\nUse this campaign data to provide specific insights about performance, optimization opportunities, and next steps.`
  }

  prompt += `\n\nGuidelines:
- Be specific and actionable
- Reference the actual data when relevant
- Provide step-by-step recommendations when helpful
- Keep responses concise but comprehensive
- Use emojis occasionally for engagement
- Focus on practical advice that can be implemented immediately`

  return prompt
}

async function logStreamingConversation(userId: string, message: string, leadData: any, campaignData: any) {
  try {
    await supabaseAdmin
      .from('ai_conversations')
      .insert({
        user_id: userId,
        user_message: message,
        context: 'streaming',
        lead_data: leadData,
        campaign_data: campaignData,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging streaming conversation:', error)
  }
}
