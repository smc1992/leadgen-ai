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
    const lead_id = searchParams.get('lead_id')

    if (lead_id) {
      // Get score for specific lead
      const { data: score, error } = await supabaseAdmin
        .from('lead_scores')
        .select('*')
        .eq('lead_id', lead_id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return NextResponse.json({ score })
    } else {
      // Get all lead scores
      const { data: scores, error } = await supabaseAdmin
        .from('lead_scores')
        .select(`
          *,
          leads (
            full_name,
            email,
            company,
            score
          )
        `)
        .order('total_score', { ascending: false })

      if (error) throw error

      return NextResponse.json({ scores: scores || [] })
    }
  } catch (error) {
    console.error('Lead Scores GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lead_id, force_recalculate = false } = body

    if (!lead_id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError) throw leadError

    // Get existing score or create new one
    let { data: existingScore } = await supabaseAdmin
      .from('lead_scores')
      .select('*')
      .eq('lead_id', lead_id)
      .single()

    if (!existingScore || force_recalculate) {
      // Calculate score based on rules
      const score = await calculateLeadScore(lead)

      if (existingScore) {
        // Update existing score
        const { data, error } = await supabaseAdmin
          .from('lead_scores')
          .update({
            total_score: score.total,
            score_breakdown: score.breakdown,
            qualification_level: score.level,
            last_scored_at: new Date().toISOString()
          })
          .eq('lead_id', lead_id)
          .select()
          .single()

        if (error) throw error
        existingScore = data
      } else {
        // Create new score
        const { data, error } = await supabaseAdmin
          .from('lead_scores')
          .insert({
            lead_id,
            total_score: score.total,
            score_breakdown: score.breakdown,
            qualification_level: score.level
          })
          .select()
          .single()

        if (error) throw error
        existingScore = data
      }
    }

    return NextResponse.json({ score: existingScore })
  } catch (error) {
    console.error('Lead Scores POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Calculate lead score based on various factors
async function calculateLeadScore(lead: any) {
  let totalScore = 0
  const breakdown: any = {}

  // Basic demographic scoring
  if (lead.score) {
    totalScore += lead.score
    breakdown.demographics = lead.score
  }

  // Email validation score
  if (lead.email_status === 'valid') {
    totalScore += 20
    breakdown.email_validation = 20
  }

  // Company size scoring
  if (lead.company_size) {
    const sizeScore = getCompanySizeScore(lead.company_size)
    totalScore += sizeScore
    breakdown.company_size = sizeScore
  }

  // Industry scoring (B2B tech gets higher scores)
  if (lead.industry) {
    const industryScore = getIndustryScore(lead.industry)
    totalScore += industryScore
    breakdown.industry = industryScore
  }

  // Job title scoring
  if (lead.job_title) {
    const titleScore = getJobTitleScore(lead.job_title)
    totalScore += titleScore
    breakdown.job_title = titleScore
  }

  // Engagement scoring (based on outreach history)
  const { data: outreachHistory } = await supabaseAdmin
    .from('outreach_emails')
    .select('status')
    .eq('lead_email', lead.email)

  if (outreachHistory) {
    const engagementScore = outreachHistory.reduce((score, email) => {
      switch (email.status) {
        case 'opened': return score + 5
        case 'clicked': return score + 10
        case 'replied': return score + 25
        default: return score
      }
    }, 0)
    totalScore += Math.min(engagementScore, 50) // Cap at 50
    breakdown.engagement = Math.min(engagementScore, 50)
  }

  // Determine qualification level
  let level = 'cold'
  if (totalScore >= 80) level = 'qualified'
  else if (totalScore >= 50) level = 'hot'
  else if (totalScore >= 25) level = 'warm'

  return {
    total: totalScore,
    breakdown,
    level
  }
}

function getCompanySizeScore(size: string): number {
  const sizeMap: { [key: string]: number } = {
    '1-10': 5,
    '11-50': 15,
    '51-200': 25,
    '201-1000': 35,
    '1001-5000': 45,
    '5000+': 55
  }
  return sizeMap[size] || 0
}

function getIndustryScore(industry: string): number {
  const highValueIndustries = ['technology', 'software', 'saas', 'finance', 'healthcare', 'consulting']
  const mediumValueIndustries = ['manufacturing', 'retail', 'education', 'real estate']

  if (highValueIndustries.some(i => industry.toLowerCase().includes(i))) return 20
  if (mediumValueIndustries.some(i => industry.toLowerCase().includes(i))) return 10
  return 5
}

function getJobTitleScore(title: string): number {
  const titleLower = title.toLowerCase()
  if (titleLower.includes('ceo') || titleLower.includes('founder') || titleLower.includes('owner')) return 30
  if (titleLower.includes('cto') || titleLower.includes('cfo') || titleLower.includes('coo')) return 25
  if (titleLower.includes('vp') || titleLower.includes('director') || titleLower.includes('head')) return 20
  if (titleLower.includes('manager') || titleLower.includes('lead')) return 15
  if (titleLower.includes('senior') || titleLower.includes('sr')) return 10
  return 5
}
