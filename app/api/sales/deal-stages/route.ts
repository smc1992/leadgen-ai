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

    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured for deal-stages GET')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const { data: stages, error } = await supabaseAdmin
      .from('deal_stages')
      .select('*')
      .order('order_position', { ascending: true })

    if (error) throw error

    return NextResponse.json({ stages })
  } catch (error) {
    console.error('Deal Stages GET error:', error)
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
      console.error('Supabase admin client not configured for deal-stages POST')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    // Check if user is admin or manager
    const { data: teamMember, error: teamError } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (teamError || !teamMember || !['admin', 'manager'].includes(teamMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, order_position, probability } = body

    if (!name || order_position === undefined) {
      return NextResponse.json({ error: 'Name and order position are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('deal_stages')
      .insert({
        name,
        description,
        color: color || '#3b82f6',
        order_position,
        probability: probability || 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ stage: data }, { status: 201 })
  } catch (error) {
    console.error('Deal Stages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured for deal-stages PUT')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    // Check if user is admin or manager
    const { data: teamMember, error: teamError } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (teamError || !teamMember || !['admin', 'manager'].includes(teamMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, color, order_position, probability } = body

    if (!id) {
      return NextResponse.json({ error: 'Stage ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('deal_stages')
      .update({
        name,
        description,
        color,
        order_position,
        probability
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ stage: data })
  } catch (error) {
    console.error('Deal Stages PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured for deal-stages DELETE')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    // Check if user is admin or manager
    const { data: teamMember, error: teamError } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (teamError || !teamMember || !['admin', 'manager'].includes(teamMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Stage ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('deal_stages')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deal Stages DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
