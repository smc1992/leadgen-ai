import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { executeWorkflowSteps } from '@/lib/workflows'
// Normalize various date string formats to YYYY-MM-DD for Postgres DATE
function normalizeDate(input: any): string | null {
  if (!input) return null
  // Already a proper ISO date-only string
  if (typeof input === 'string') {
    const s = input.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    // Handle German-style DD.MM.YYYY (with optional spaces)
    const dotMatch = s.match(/^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})$/)
    if (dotMatch) {
      const [, dd, mm, yyyy] = dotMatch
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }
    // Handle US-style MM/DD/YYYY
    const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (slashMatch) {
      const [, mm, dd, yyyy] = slashMatch
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }
    // Fallback: Date parse
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
    return null
  }
  if (input instanceof Date && !isNaN(input.getTime())) {
    const yyyy = input.getFullYear()
    const mm = String(input.getMonth() + 1).padStart(2, '0')
    const dd = String(input.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stage_id = searchParams.get('stage_id')
    const assigned_to = searchParams.get('assigned_to')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('deals')
      .select(`
        *,
        deal_stages (*),
        assigned_user:assigned_to (email),
        created_user:created_by (email)
      `)

    // Apply filters
    if (stage_id) {
      query = query.eq('stage_id', stage_id)
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Apply user permissions
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const isAdminOrManager = teamMember && ['admin', 'manager'].includes(teamMember.role)

    if (!isAdminOrManager) {
      query = query.or(`assigned_to.eq.${session.user.id},created_by.eq.${session.user.id}`)
    }

    const { data: deals, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.warn('deals query error, returning empty list:', error)
      return NextResponse.json({ deals: [], total: 0, limit, offset }, { status: 200 })
    }

    return NextResponse.json({ deals: deals || [], total: count || 0, limit, offset })
  } catch (error) {
    console.error('Deals GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const body = await request.json()
    const {
      title,
      description,
      deal_value,
      currency,
      stage_id,
      lead_id,
      contact_name,
      contact_email,
      contact_phone,
      company_name,
      company_website,
      company_size,
      industry,
      assigned_to,
      expected_close_date,
      tags,
      custom_fields,
      notes,
      priority,
      source
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Normalize date to Postgres DATE format
    const normalizedExpectedCloseDate = normalizeDate(expected_close_date)

    // Ensure a valid stage_id
    let finalStageId = stage_id
    if (!finalStageId) {
      const { data: firstStage } = await supabaseAdmin
        .from('deal_stages')
        .select('id')
        .order('order_position', { ascending: true })
        .limit(1)
        .maybeSingle()
      finalStageId = firstStage?.id || null
      if (!finalStageId) {
        return NextResponse.json({ error: 'No deal stages available' }, { status: 400 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('deals')
      .insert({
        title,
        description,
        deal_value,
        currency: currency || 'EUR',
        stage_id: finalStageId,
        lead_id,
        contact_name,
        contact_email,
        contact_phone,
        company_name,
        company_website,
        company_size,
        industry,
        assigned_to,
        created_by: session.user.id,
        expected_close_date: normalizedExpectedCloseDate,
        tags: tags || [],
        custom_fields: custom_fields || {},
        notes,
        priority: priority || 'medium',
        source: source || 'outreach'
      })
      .select(`
        *,
        deal_stages (*),
        assigned_user:assigned_to (email),
        created_user:created_by (email)
      `)
      .single()

    if (error) {
      const message = typeof error.message === 'string' && error.message.toLowerCase().includes('date')
        ? 'Invalid date format for expected_close_date. Use YYYY-MM-DD or DD.MM.YYYY.'
        : (typeof error.message === 'string' ? error.message : 'Failed to insert deal')
      console.error('Deals POST insert error:', error)
      return NextResponse.json({ error: message, details: error }, { status: 400 })
    }

    // Log activity
    await supabaseAdmin.from('deal_activities').insert({
      deal_id: data.id,
      user_id: session.user.id,
      activity_type: 'created',
      description: `Deal "${title}" was created`,
      metadata: { stage_id }
    })

    return NextResponse.json({ deal: data }, { status: 201 })
  } catch (error) {
    console.error('Deals POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      title,
      description,
      deal_value,
      currency,
      stage_id,
      contact_name,
      contact_email,
      contact_phone,
      company_name,
      company_website,
      company_size,
      industry,
      assigned_to,
      expected_close_date,
      actual_close_date,
      tags,
      custom_fields,
      notes,
      priority,
      status
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })
    }

    // Get current deal to check for stage changes
    const { data: currentDeal } = await supabaseAdmin
      .from('deals')
      .select('stage_id, status')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('deals')
      .update({
        title,
        description,
        deal_value,
        currency,
        stage_id,
        contact_name,
        contact_email,
        contact_phone,
        company_name,
        company_website,
        company_size,
        industry,
        assigned_to,
        expected_close_date,
        actual_close_date,
        tags,
        custom_fields,
        notes,
        priority,
        status
      })
      .eq('id', id)
      .select(`
        *,
        deal_stages (*),
        assigned_user:assigned_to (email),
        created_user:created_by (email)
      `)
      .single()

    if (error) throw error

    // Log stage change activity
    if (currentDeal && currentDeal.stage_id !== stage_id) {
      await supabaseAdmin.from('deal_activities').insert({
        deal_id: id,
        user_id: session.user.id,
        activity_type: 'stage_changed',
        description: `Deal moved to ${data.deal_stages?.name || 'new stage'}`,
        metadata: {
          old_stage_id: currentDeal.stage_id,
          new_stage_id: stage_id
        }
      })
      try {
        const { data: workflows } = await supabaseAdmin
          .from('workflows')
          .select('*')
          .eq('is_active', true)
          .eq('trigger_type', 'deal_stage_changed')
          .eq('user_id', session.user.id)
        for (const wf of workflows || []) {
          await executeWorkflowSteps(wf, { deal_id: id })
        }
      } catch {}
    }

    // Log status change
    if (currentDeal && currentDeal.status !== status) {
      await supabaseAdmin.from('deal_activities').insert({
        deal_id: id,
        user_id: session.user.id,
        activity_type: 'status_changed',
        description: `Deal status changed to ${status}`,
        metadata: {
          old_status: currentDeal.status,
          new_status: status
        }
      })
      try {
        const { data: workflows } = await supabaseAdmin
          .from('workflows')
          .select('*')
          .eq('is_active', true)
          .eq('trigger_type', 'deal_status_changed')
          .eq('user_id', session.user.id)
        for (const wf of workflows || []) {
          await executeWorkflowSteps(wf, { deal_id: id })
        }
      } catch {}
    }

    return NextResponse.json({ deal: data })
  } catch (error) {
    console.error('Deals PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })
    }

    // Check permissions
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const isAdminOrManager = teamMember && ['admin', 'manager'].includes(teamMember.role)

    if (!isAdminOrManager) {
      const { data: deal } = await supabaseAdmin
        .from('deals')
        .select('created_by, assigned_to')
        .eq('id', id)
        .single()

      if (!deal || (deal.created_by !== session.user.id && deal.assigned_to !== session.user.id)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    const { error } = await supabaseAdmin
      .from('deals')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deals DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
