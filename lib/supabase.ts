import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Treat obvious placeholders or malformed keys as "not configured"
const looksLikeJwt = (v: string) => v.includes('.') && v.length > 20
const isPlaceholder = (v: string) => /^(CHANGE_ME|YOUR_|REPLACE_ME)/.test(v)
const validAnonKey = !!(supabaseAnonKey && looksLikeJwt(supabaseAnonKey) && !isPlaceholder(supabaseAnonKey))
const validServiceRoleKey = !!(serviceRoleKey && looksLikeJwt(serviceRoleKey) && !isPlaceholder(serviceRoleKey) && serviceRoleKey !== supabaseAnonKey)

export const isSupabaseConfigured = Boolean(supabaseUrl && validAnonKey && validServiceRoleKey)

export const supabase = supabaseUrl && validAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

export const supabaseAdmin = supabaseUrl && validServiceRoleKey
  ? createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null as any

// Database Types
export interface Lead {
  id: string
  full_name: string
  job_title: string | null
  company: string | null
  email: string | null
  email_status: 'valid' | 'invalid' | 'unknown'
  score: number
  region: string | null
  channel: string
  source_url: string | null
  is_outreach_ready: boolean
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  lead_id: string
  campaign_id: string
  status: 'opened' | 'clicked' | 'bounced' | 'replied' | 'sent'
  sent_at: string
}

export interface Campaign {
  id: string
  name: string
  template: string
  domain: string
  followups: number
  created_at: string
}

export interface ScrapeRun {
  id: string
  type: 'linkedin' | 'maps' | 'validator'
  status: string
  result_count: number
  triggered_by: string
  created_at: string
}

export interface ContentItem {
  id: string
  type: 'text' | 'video' | 'carousel'
  status: 'draft' | 'scheduled' | 'published'
  platform: string[]
  schedule_at: string | null
  data: Record<string, any>
  created_at: string
}
