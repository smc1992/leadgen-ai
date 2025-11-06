import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateLeadScore, isOutreachReady } from '@/lib/scoring'

export async function POST(request: NextRequest) {
  try {
    // Require authenticated user; prevents RLS violations and associates data correctly
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leads } = body

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'Invalid leads data' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    // Process and score leads, and attach user_id for RLS visibility
    const nowIso = new Date().toISOString()
    const processedLeads = leads.map((lead: any) => {
      const score = calculateLeadScore(lead)
      return {
        ...lead,
        user_id: session.user.id,
        score,
        is_outreach_ready: isOutreachReady(score),
        email_status: lead.email_status || 'unknown',
        created_at: nowIso,
        updated_at: nowIso,
      }
    })

    // Deduplicate by website and company for this user (optional soft dedupe)
    // Insert into Supabase with admin client to bypass RLS safely (service role)
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(processedLeads)
      .select()

    if (error) {
      console.error('Supabase import error:', error)
      // Graceful error response without exposing DB internals
      return NextResponse.json(
        { error: 'Failed to import leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: data?.length || 0,
      leads: data || [],
    }, { status: 201 })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
