import OpenAI from 'openai'

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }
    openai = new OpenAI({
      apiKey,
    })
  }
  return openai
}

export interface EmailGenerationParams {
  purpose: string // e.g., "introduction", "follow-up", "promotion"
  targetAudience: string
  companyInfo?: string
  keyPoints?: string[]
  tone?: 'professional' | 'casual' | 'friendly' | 'formal'
  length?: 'short' | 'medium' | 'long'
  constraints?: string[]
}

export interface CampaignGenerationParams {
  goal: string
  targetAudience: string
  companyInfo?: string
  numberOfEmails?: number
  duration?: string
  tone?: 'professional' | 'casual' | 'friendly' | 'formal'
  intentHints?: string[]
}

/**
 * Generate email content using OpenAI
 */
export async function generateEmailContent(
  params: EmailGenerationParams,
  knowledgeBase?: string
): Promise<{ subject: string; content: string }> {
  const systemPrompt = `You are an expert email marketing copywriter. Generate compelling, personalized email content that drives engagement and conversions.

${knowledgeBase ? `Company Knowledge Base:\n${knowledgeBase}\n\n` : ''}

Guidelines:
- Use the company knowledge base to personalize content
- Include relevant variables in {{variableName}} format (e.g., {{firstName}}, {{company}})
- Keep the tone ${params.tone || 'professional'}
- Make it ${params.length || 'medium'} length
- Focus on value proposition and clear call-to-action
- Avoid spam trigger words`

  const userPrompt = `Create an email for the following:

Purpose: ${params.purpose}
Target Audience: ${params.targetAudience}
${params.companyInfo ? `Company Info: ${params.companyInfo}` : ''}
${params.keyPoints?.length ? `Key Points:\n${params.keyPoints.map(p => `- ${p}`).join('\n')}` : ''}
${params.constraints?.length ? `Constraints:\n${params.constraints.map(c => `- ${c}`).join('\n')}` : ''}

Generate:
1. A compelling subject line
2. Email body with personalization variables

Format the response as JSON:
{
  "subject": "subject line here",
  "content": "email body here with {{variables}}"
}`

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      subject: response.subject || 'Your Subject Line',
      content: response.content || 'Your email content here'
    }
  } catch (error) {
    console.error('OpenAI email generation error:', error)
    throw new Error('Failed to generate email content')
  }
}

/**
 * Generate email sequence using OpenAI
 */
export async function generateEmailSequence(
  params: CampaignGenerationParams,
  knowledgeBase?: string
): Promise<Array<{ subject: string; content: string; delayDays: number }>> {
  const numberOfEmails = params.numberOfEmails || 3

  const systemPrompt = `You are an expert email marketing strategist. Create a cohesive email sequence that nurtures leads through a journey.

${knowledgeBase ? `Company Knowledge Base:\n${knowledgeBase}\n\n` : ''}

Guidelines:
- Create a logical progression from awareness to conversion
- Each email should build on the previous one
- Include personalization variables in {{variableName}} format
- Vary the content and approach in each email
- Include clear CTAs that match the stage of the journey`

  const userPrompt = `Create an email sequence with ${numberOfEmails} emails:

Campaign Goal: ${params.goal}
Target Audience: ${params.targetAudience}
${params.companyInfo ? `Company Info: ${params.companyInfo}` : ''}
Duration: ${params.duration || 'over 2 weeks'}
Tone: ${params.tone || 'professional'}
${params.intentHints?.length ? `Intent Hints:\n${params.intentHints.map(i => `- ${i}`).join('\n')}` : ''}

For each email, provide:
1. Subject line
2. Email content with {{variables}}
3. Recommended delay in days from previous email

Format as JSON array:
[
  {
    "subject": "email 1 subject",
    "content": "email 1 content with {{variables}}",
    "delayDays": 0
  },
  ...
]`

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{"emails":[]}')
    return response.emails || []
  } catch (error) {
    console.error('OpenAI sequence generation error:', error)
    throw new Error('Failed to generate email sequence')
  }
}

/**
 * Improve existing email content
 */
export async function improveEmailContent(
  subject: string,
  content: string,
  improvements: string[]
): Promise<{ subject: string; content: string }> {
  const prompt = `Improve this email based on the following requirements:

Current Subject: ${subject}
Current Content: ${content}

Improvements needed:
${improvements.map(i => `- ${i}`).join('\n')}

Maintain any existing {{variables}} and add new ones where appropriate.

Return improved version as JSON:
{
  "subject": "improved subject",
  "content": "improved content"
}`

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert email copywriter focused on improving conversion rates.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      subject: response.subject || subject,
      content: response.content || content
    }
  } catch (error) {
    console.error('OpenAI improvement error:', error)
    throw new Error('Failed to improve email content')
  }
}

/**
 * Generate campaign strategy
 */
export async function generateCampaignStrategy(
  goal: string,
  targetAudience: string,
  knowledgeBase?: string
): Promise<{
  strategy: string
  recommendedEmails: number
  timeline: string
  keyMessages: string[]
}> {
  const prompt = `Create a comprehensive email campaign strategy:

Goal: ${goal}
Target Audience: ${targetAudience}
${knowledgeBase ? `\nCompany Context:\n${knowledgeBase}` : ''}

Provide:
1. Overall strategy and approach
2. Recommended number of emails
3. Suggested timeline
4. Key messages to communicate

Format as JSON:
{
  "strategy": "detailed strategy description",
  "recommendedEmails": 3,
  "timeline": "2 weeks",
  "keyMessages": ["message 1", "message 2", ...]
}`

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert email marketing strategist.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  } catch (error) {
    console.error('OpenAI strategy generation error:', error)
    throw new Error('Failed to generate campaign strategy')
  }
}

// Export the client getter function for advanced usage
export { getOpenAIClient }

export async function llmScoreLead(
  lead: any,
  outreachHistory: Array<{ status: string }>
): Promise<{ adjust: number; rationale: string }> {
  const prompt = `Evaluate lead potential and propose a score adjustment (-20 to +20) with rationale.

Lead:
${JSON.stringify({ full_name: lead.full_name, email: lead.email, company: lead.company, job_title: lead.job_title, industry: lead.industry, company_size: lead.company_size }, null, 2)}

Engagement:
${JSON.stringify(outreachHistory || [], null, 2)}

Return JSON { "adjust": number, "rationale": string }.`
  const completion = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a B2B sales analyst. Be concise and numeric.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  })
  const response = JSON.parse(completion.choices[0].message.content || '{"adjust":0,"rationale":""}')
  let adjust = Number(response.adjust || 0)
  if (!Number.isFinite(adjust)) adjust = 0
  adjust = Math.max(-20, Math.min(20, adjust))
  return { adjust, rationale: String(response.rationale || '') }
}

export async function classifyReply(
  body: string
): Promise<{ status: 'replied'|'bounced'|'out_of_office'|'unsubscribe'|'unknown'; intent?: string; sentiment?: 'positive'|'neutral'|'negative' }> {
  const prompt = `Classify this email message.

Return JSON with fields: status in [replied,bounced,out_of_office,unsubscribe,unknown], intent (short), sentiment in [positive,neutral,negative].

Message:
${body}`
  const completion = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an email triage assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  })
  const response = JSON.parse(completion.choices[0].message.content || '{"status":"unknown"}')
  const status = ['replied','bounced','out_of_office','unsubscribe','unknown'].includes(response.status) ? response.status : 'unknown'
  const sentiment = ['positive','neutral','negative'].includes(response.sentiment) ? response.sentiment : undefined
  return { status, intent: response.intent, sentiment }
}
export async function generateEmailVariants(
  params: EmailGenerationParams,
  count: number,
  knowledgeBase?: string
): Promise<Array<{ subject: string; content: string }>> {
  const systemPrompt = `You are an expert email marketing copywriter. Generate multiple distinct variants that comply with constraints and avoid spam triggers.

${knowledgeBase ? `Company Knowledge Base:\n${knowledgeBase}\n\n` : ''}

Tone: ${params.tone || 'professional'}
Length: ${params.length || 'medium'}`

  const userPrompt = `Create ${count} variants for:

Purpose: ${params.purpose}
Target Audience: ${params.targetAudience}
${params.companyInfo ? `Company Info: ${params.companyInfo}` : ''}
${params.keyPoints?.length ? `Key Points:\n${params.keyPoints.map(p => `- ${p}`).join('\n')}` : ''}
${params.constraints?.length ? `Constraints:\n${params.constraints.map(c => `- ${c}`).join('\n')}` : ''}

Return JSON:
{
  "variants": [
    { "subject": "...", "content": "..." },
    { "subject": "...", "content": "..." }
  ]
}`

  const completion = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  })

  const response = JSON.parse(completion.choices[0].message.content || '{"variants":[]}')
  return Array.isArray(response.variants) ? response.variants : []
}
