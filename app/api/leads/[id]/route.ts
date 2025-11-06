import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Calculate new score if relevant fields changed
    const updateData = { ...body, updated_at: new Date().toISOString() }
    
    if (body.job_title || body.email || body.company || body.region) {
      // Get current lead data
      const { data: currentLead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
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
      .eq('user_id', session.user.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
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
