import { getOpenAIClient } from '@/lib/openai'
import { config } from '@/lib/config'

export async function chat(messages: Array<{ role: 'system'|'user'|'assistant', content: string }>, maxTokens = 1000) {
  const client = getOpenAIClient()
  const completion = await client.chat.completions.create({
    model: config.openaiModel,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
    top_p: 1,
    stream: false,
  })
  return completion.choices[0]?.message?.content || ''
}

