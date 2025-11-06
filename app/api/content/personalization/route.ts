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

    const body = await request.json()
    const { lead_id, content_type, content_id, content_template } = body

    if (!lead_id || !content_type || !content_template) {
      return NextResponse.json({
        error: 'Lead ID, content type, and content template are required'
      }, { status: 400 })
    }

    // Get lead data for personalization
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get lead score for additional context
    const { data: leadScore } = await supabaseAdmin
      .from('lead_scores')
      .select('*')
      .eq('lead_id', lead_id)
      .single()

    // Get applicable personalization rules
    const { data: rules } = await supabaseAdmin
      .from('content_personalization_rules')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('content_type', content_type)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    // Check if personalized content is cached
    const { data: cachedContent } = await supabaseAdmin
      .from('personalized_content_cache')
      .select('*')
      .eq('lead_id', lead_id)
      .eq('content_type', content_type)
      .eq('original_content_id', content_id)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cachedContent) {
      return NextResponse.json({
        personalized_content: cachedContent.personalized_content,
        metadata: cachedContent.personalization_metadata,
        cached: true
      })
    }

    // Apply personalization rules
    let personalizedContent = content_template
    const appliedRules = []
    const personalizationMetadata = {
      lead_data: {
        name: lead.full_name,
        company: lead.company,
        industry: lead.industry,
        job_title: lead.job_title,
        company_size: lead.company_size,
        score: leadScore?.total_score || lead.score || 0
      },
      applied_rules: [],
      ai_enhancements: []
    }

    for (const rule of rules || []) {
      if (matchesConditions(lead, leadScore, rule.trigger_conditions)) {
        personalizedContent = applyPersonalizationRule(personalizedContent, rule.personalization_rules, lead, leadScore)
        appliedRules.push(rule.name)

        personalizationMetadata.applied_rules.push({
          rule_name: rule.name,
          rule_id: rule.id,
          conditions: rule.trigger_conditions,
          actions: rule.personalization_rules
        })

        // Update rule usage
        await supabaseAdmin
          .from('content_personalization_rules')
          .update({
            usage_count: (rule.usage_count || 0) + 1
          })
          .eq('id', rule.id)
      }
    }

    // Apply AI enhancements if enabled
    const aiEnabledRules = rules?.filter(rule => rule.ai_enhancement) || []
    if (aiEnabledRules.length > 0) {
      personalizedContent = await applyAIEnhancements(personalizedContent, lead, leadScore, content_type)
      personalizationMetadata.ai_enhancements.push({
        type: 'content_optimization',
        timestamp: new Date().toISOString()
      })
    }

    // Cache the personalized content (expires in 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await supabaseAdmin
      .from('personalized_content_cache')
      .insert({
        user_id: session.user.id,
        lead_id: lead_id,
        content_type,
        original_content_id: content_id,
        personalized_content: personalizedContent,
        personalization_metadata: personalizationMetadata,
        expires_at: expiresAt
      })

    return NextResponse.json({
      personalized_content: personalizedContent,
      metadata: personalizationMetadata,
      cached: false,
      applied_rules: appliedRules
    })

  } catch (error) {
    console.error('Content personalization error:', error)
    return NextResponse.json({ error: 'Personalization failed' }, { status: 500 })
  }
}

function matchesConditions(lead: any, leadScore: any, conditions: any): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case 'company_size':
        if (Array.isArray(value) && !value.includes(lead.company_size)) return false
        break
      case 'industry':
        if (Array.isArray(value) && !value.some((industry: string) => lead.industry?.toLowerCase().includes(industry.toLowerCase()))) return false
        break
      case 'lead_score':
        const score = leadScore?.total_score || lead.score || 0
        if (value.min && score < value.min) return false
        if (value.max && score > value.max) return false
        break
      case 'job_title':
        if (Array.isArray(value) && !value.some((title: string) => lead.job_title?.toLowerCase().includes(title.toLowerCase()))) return false
        break
      default:
        // Custom field matching
        if (lead[key] !== value) return false
    }
  }
  return true
}

function applyPersonalizationRule(content: string, rules: any, lead: any, leadScore: any): string {
  let personalizedContent = content

  // Replace standard variables
  const variables = {
    contact_name: lead.full_name?.split(' ')[0] || 'there',
    full_name: lead.full_name || 'there',
    company_name: lead.company || 'your company',
    job_title: lead.job_title || 'your role',
    industry: lead.industry || 'your industry',
    company_size: lead.company_size || 'your organization',
    lead_score: leadScore?.total_score || lead.score || 0
  }

  // Apply personalization rules
  for (const [key, value] of Object.entries(rules)) {
    switch (key) {
      case 'greeting':
        personalizedContent = personalizedContent.replace(/\{\{greeting\}\}/g, value as string)
        break
      case 'tone':
        // Adjust tone based on rule
        if (value === 'casual') {
          personalizedContent = personalizedContent.replace(/\b(we|our|us)\b/gi, 'we')
        }
        break
      case 'value_prop':
        // Customize value proposition
        if (value === 'enterprise_solutions') {
          personalizedContent = personalizedContent.replace(
            /\{\{value_prop\}\}/g,
            'enterprise-grade solutions designed for scale and compliance'
          )
        }
        break
      case 'urgency':
        if (value === 'high') {
          personalizedContent = personalizedContent.replace(
            /\{\{cta\}\}/g,
            'Schedule your personalized demo today'
          )
        }
        break
    }
  }

  // Replace standard variables
  for (const [key, value] of Object.entries(variables)) {
    personalizedContent = personalizedContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string)
  }

  return personalizedContent
}

async function applyAIEnhancements(content: string, lead: any, leadScore: any, contentType: string): Promise<string> {
  try {
    const prompt = `Enhance this ${contentType} content for a lead with the following profile:
- Name: ${lead.full_name}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Job Title: ${lead.job_title}
- Company Size: ${lead.company_size}
- Lead Score: ${leadScore?.total_score || lead.score || 0}

Original content:
${content}

Please enhance this content to be more personalized and engaging while maintaining the core message. Focus on:
1. More personal greeting
2. Industry-specific insights
3. Relevant pain points for their role/company size
4. Stronger call-to-action

Return only the enhanced content, no explanations.`

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing copywriter specializing in personalized content. Make content more engaging and relevant while keeping the original intent.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    return completion.choices[0].message.content || content
  } catch (error) {
    console.error('AI enhancement error:', error)
    return content // Return original content if AI fails
  }
}
