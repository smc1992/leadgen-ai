// AI Service with Fallback Algorithms
// OpenAI integration can be added later by uncommenting the relevant sections

// Types for AI services
export interface LeadData {
  id: string
  full_name: string
  job_title?: string
  company: string
  email: string
  region?: string
  channel?: string
  engagement_score?: number
  industry?: string
}

export interface EmailTemplate {
  subject: string
  content: string
  variables: string[]
}

export interface ContentRequest {
  topic: string
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram'
  tone: 'professional' | 'casual' | 'formal' | 'friendly'
  length: 'short' | 'medium' | 'long'
  target_audience?: string
}

export interface ScoringResult {
  score: number
  confidence: number
  factors: {
    job_title_match: number
    company_size: number
    industry_relevance: number
    engagement_history: number
    email_quality: number
  }
  recommendations: string[]
}

export class AIService {
  // private openai: OpenAI | null = null
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    if (apiKey) {
      this.setApiKey(apiKey)
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    // Uncomment to enable OpenAI:
    // this.initializeOpenAI(apiKey)
  }

  // Smart Lead Scoring using AI (currently using fallback algorithm)
  async scoreLead(lead: LeadData): Promise<ScoringResult> {
    // Using fallback algorithm for now
    return this.fallbackScoring(lead)
  }

  private fallbackScoring(lead: LeadData): ScoringResult {
    // Simple rule-based scoring as fallback
    let score = 50 // Base score

    // Job title relevance
    const relevantTitles = ['director', 'manager', 'vp', 'head', 'chief', 'lead', 'senior']
    const jobTitle = lead.job_title?.toLowerCase() || ''
    const jobMatch = relevantTitles.some(title => jobTitle.includes(title)) ? 20 : 0
    score += jobMatch

    // Company size indicators (rough estimation)
    const companyName = lead.company.toLowerCase()
    if (companyName.includes('inc') || companyName.includes('ltd') || companyName.includes('gmbh')) {
      score += 10
    }

    // Industry relevance for logistics/supply chain
    const relevantIndustries = ['logistics', 'supply chain', 'shipping', 'transport', 'manufacturing']
    const industry = lead.industry?.toLowerCase() || ''
    const industryMatch = relevantIndustries.some(ind => industry.includes(ind)) ? 15 : 0
    score += industryMatch

    // Region bonus for target markets
    const targetRegions = ['usa', 'germany', 'nigeria', 'uk']
    const region = lead.region?.toLowerCase() || ''
    const regionMatch = targetRegions.some(r => region.includes(r)) ? 5 : 0
    score += regionMatch

    score = Math.min(100, Math.max(0, score))

    return {
      score,
      confidence: 0.7,
      factors: {
        job_title_match: jobMatch / 20,
        company_size: companyName.includes('inc') || companyName.includes('ltd') ? 1 : 0.5,
        industry_relevance: industryMatch / 15,
        engagement_history: 0.5, // No historical data
        email_quality: lead.email.includes('@') && !lead.email.includes('gmail') ? 0.8 : 0.4
      },
      recommendations: [
        jobMatch < 10 ? 'Focus on decision-makers with titles like Director, Manager, VP' : 'Good job title match',
        industryMatch < 5 ? 'Target logistics and supply chain industries more specifically' : 'Good industry fit',
        'Send personalized outreach within 24 hours',
        'Include specific value propositions for their industry',
        'Follow up 3-5 times with different angles'
      ]
    }
  }

  // AI Email Writer for Personalization
  async generatePersonalizedEmail(
    lead: LeadData,
    template: EmailTemplate,
    tone: 'professional' | 'casual' | 'friendly' = 'professional'
  ): Promise<{ subject: string; content: string }> {
    // Using fallback algorithm
    return this.fallbackPersonalization(lead, template)
  }

  private fallbackPersonalization(lead: LeadData, template: EmailTemplate) {
    let subject = template.subject
    let content = template.content

    // Basic variable replacement
    const replacements = {
      '{{firstName}}': lead.full_name.split(' ')[0],
      '{{lastName}}': lead.full_name.split(' ').slice(1).join(' ') || '',
      '{{fullName}}': lead.full_name,
      '{{company}}': lead.company,
      '{{jobTitle}}': lead.job_title || 'Professional',
      '{{email}}': lead.email
    }

    Object.entries(replacements).forEach(([variable, value]) => {
      subject = subject.replace(new RegExp(variable, 'g'), value)
      content = content.replace(new RegExp(variable, 'g'), value)
    })

    return { subject, content }
  }

  // Content Generation Assistant
  async generateContent(request: ContentRequest): Promise<string> {
    // Fallback content generation
    const platformContent = {
      linkedin: `🚛 Supply Chain Excellence: ${request.topic}

As logistics professionals, we understand the critical importance of optimizing every aspect of your supply chain operations. ${request.topic} represents a significant opportunity for companies looking to stay competitive in today's fast-paced market.

Key considerations for implementation:
• Process efficiency improvements
• Cost reduction opportunities
• Technology integration
• Performance monitoring

#SupplyChain #Logistics #Operations`,
      twitter: `🚛 ${request.topic} - Are you optimizing your supply chain operations? Key insights for logistics professionals. #SupplyChain #Logistics`,
      facebook: `📦 Supply Chain Optimization Alert!

${request.topic} can transform your logistics operations. Here are the key benefits:

✅ Reduced operational costs
✅ Improved delivery times
✅ Better inventory management
✅ Enhanced customer satisfaction

What challenges are you facing in your supply chain? Share below!`,
      instagram: `🚛 Supply Chain Excellence 💪

${request.topic} - The key to staying competitive in logistics! 

💡 Optimize operations
📈 Reduce costs  
⚡ Improve efficiency
🎯 Better results

#SupplyChain #Logistics #Operations #BusinessExcellence`
    }

    return platformContent[request.platform] || `Generated content about ${request.topic} for ${request.platform}`
  }

  // Predictive Analytics for Campaign Optimization
  async predictCampaignPerformance(campaignData: {
    subject: string
    content_preview: string
    target_audience: string
    historical_performance?: {
      avg_open_rate: number
      avg_click_rate: number
      avg_conversion_rate: number
    }
  }): Promise<{
    predicted_open_rate: number
    predicted_click_rate: number
    predicted_conversion_rate: number
    recommendations: string[]
    confidence: number
  }> {
    // Using fallback prediction algorithm
    const baseOpenRate = 25 + Math.random() * 15
    const baseClickRate = 3 + Math.random() * 5
    const baseConversionRate = 0.5 + Math.random() * 1.5

    // Adjust based on subject line quality
    let subjectMultiplier = 1
    const subject = campaignData.subject.toLowerCase()
    if (subject.includes('free') || subject.includes('new') || subject.includes('announcement')) {
      subjectMultiplier = 1.3
    } else if (subject.includes('urgent') || subject.includes('breaking') || subject.includes('alert')) {
      subjectMultiplier = 1.2
    }

    return {
      predicted_open_rate: Math.round(baseOpenRate * subjectMultiplier),
      predicted_click_rate: Math.round(baseClickRate * subjectMultiplier * 10) / 10,
      predicted_conversion_rate: Math.round(baseConversionRate * subjectMultiplier * 10) / 10,
      recommendations: [
        'Test different subject lines for better open rates',
        'Include clear call-to-action buttons',
        'Personalize content when possible',
        'Optimize send times based on audience timezone',
        'A/B test different email designs'
      ],
      confidence: 0.7
    }
  }

  // Campaign Optimization Suggestions
  async optimizeCampaign(
    currentMetrics: {
      open_rate: number
      click_rate: number
      conversion_rate: number
      bounce_rate: number
    },
    campaignDetails: {
      subject: string
      content: string
      send_time: string
      segment: string
    }
  ): Promise<{
    optimizations: Array<{
      type: 'subject' | 'content' | 'timing' | 'segmentation'
      suggestion: string
      expected_impact: number
      confidence: number
    }>
    priority_order: string[]
  }> {
    const optimizations: Array<{
      type: 'subject' | 'content' | 'timing' | 'segmentation'
      suggestion: string
      expected_impact: number
      confidence: number
    }> = []

    // Subject line optimization
    if (currentMetrics.open_rate < 20) {
      optimizations.push({
        type: 'subject',
        suggestion: 'Try more compelling subject lines with urgency or value propositions',
        expected_impact: 25,
        confidence: 0.8
      })
    }

    // Content optimization
    if (currentMetrics.click_rate < 3) {
      optimizations.push({
        type: 'content',
        suggestion: 'Improve email content with better CTAs and value propositions',
        expected_impact: 20,
        confidence: 0.7
      })
    }

    // Timing optimization
    optimizations.push({
      type: 'timing',
      suggestion: 'Test different send times and days for better engagement',
      expected_impact: 15,
      confidence: 0.6
    })

    // Segmentation optimization
    if (currentMetrics.conversion_rate < 1) {
      optimizations.push({
        type: 'segmentation',
        suggestion: 'Refine audience segmentation for more targeted campaigns',
        expected_impact: 30,
        confidence: 0.9
      })
    }

    return {
      optimizations,
      priority_order: ['segmentation', 'subject', 'content', 'timing']
    }
  }
}

// Global AI service instance
let aiService: AIService | null = null

export function getAIService(apiKey?: string): AIService {
  if (!aiService) {
    aiService = new AIService(apiKey)
  }
  return aiService
}

export function initializeAIService(apiKey: string) {
  if (!aiService) {
    aiService = new AIService(apiKey)
  } else {
    aiService.setApiKey(apiKey)
  }
}
