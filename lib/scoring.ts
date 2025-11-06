import { Lead } from './supabase'

const JOB_TITLE_KEYWORDS = [
  'director',
  'manager',
  'head of',
  'supply chain',
  'logistics',
  'procurement',
  'operations',
  'ceo',
  'cto',
  'coo',
]

const GENERIC_EMAIL_PATTERNS = [
  'info@',
  'office@',
  'contact@',
  'admin@',
  'support@',
  'hello@',
]

const TARGET_REGIONS = ['usa', 'germany', 'nigeria', 'uk', 'france']

export function calculateLeadScore(lead: Partial<Lead>): number {
  let score = 0

  // Job Title Scoring (+50 points)
  if (lead.job_title) {
    const titleLower = lead.job_title.toLowerCase()
    const hasRelevantTitle = JOB_TITLE_KEYWORDS.some(keyword => 
      titleLower.includes(keyword)
    )
    if (hasRelevantTitle) {
      score += 50
    }
  }

  // Region Scoring (+20 points)
  if (lead.region) {
    const regionLower = lead.region.toLowerCase()
    const isTargetRegion = TARGET_REGIONS.some(region => 
      regionLower.includes(region)
    )
    if (isTargetRegion) {
      score += 20
    }
  }

  // Email Validation Scoring (+20 points)
  if (lead.email_status === 'valid') {
    score += 20
  }

  // Generic Email Penalty (-30 points)
  if (lead.email) {
    const emailLower = lead.email.toLowerCase()
    const isGeneric = GENERIC_EMAIL_PATTERNS.some(pattern => 
      emailLower.startsWith(pattern)
    )
    if (isGeneric) {
      score -= 30
    }
  }

  // Company Name Bonus (+10 points)
  if (lead.company && lead.company.length > 0) {
    score += 10
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score))
}

export function isOutreachReady(score: number): boolean {
  return score >= 75
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 25) return 'Poor'
  return 'Very Poor'
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 75) return 'text-blue-600'
  if (score >= 50) return 'text-yellow-600'
  if (score >= 25) return 'text-orange-600'
  return 'text-red-600'
}
