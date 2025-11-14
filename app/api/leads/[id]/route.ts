import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Calculate new score if relevant fields changed
    const updateData = { ...body, updated_at: new Date().toISOString() }
    
    if (body.job_title || body.email || body.company || body.region) {
      // Get current lead data (no user_id column in leads)
      const { data: currentLead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (currentLead) {
        const mergedLead = { ...currentLead, ...body }
        updateData.score = calculateLeadScore(mergedLead)
        updateData.is_outreach_ready = isOutreachReady(updateData.score)
      }
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Lead PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Allow deletion without requiring an authenticated session.
    // This endpoint is used in an internal tool and the leads table
    // has no user_id column. We still validate ID format and Supabase config.

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Validate UUID format to avoid Postgres 22P02 errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(String(id))) {
      return NextResponse.json({ error: 'Invalid Lead ID format' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured for lead DELETE')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Lead GET by ID error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateLeadScore(lead: any): number {
  let score = 0
  
  // Job title scoring
  const jobTitles = ['CEO', 'CTO', 'CFO', 'Founder', 'Director', 'Manager', 'VP']
  if (lead.job_title) {
    const titleScore = jobTitles.find(title => 
      lead.job_title.toLowerCase().includes(title.toLowerCase())
    )
    score += titleScore ? 20 : 10
  }
  
  // Email presence
  if (lead.email) score += 15
  
  // Company presence
  if (lead.company) score += 10
  
  // Region scoring
  const highValueRegions = ['US', 'UK', 'DE', 'CA', 'AU']
  if (lead.region && highValueRegions.includes(lead.region.toUpperCase())) {
    score += 15
  }
  
  return Math.min(score, 100)
}

function isOutreachReady(score: number): boolean {
  return score >= 50
}
