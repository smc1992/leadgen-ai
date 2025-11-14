import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ schedules: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { name, type, workflow_id, interval_minutes, cron_expr, active, metadata } = body
    if (!name || !type) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('schedules')
      .insert({
        user_id: session.user.id,
        name,
        type,
        workflow_id: workflow_id || null,
        interval_minutes: interval_minutes || 60,
        cron_expr: cron_expr || null,
        active: active !== false,
        metadata: metadata || {},
      })
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ schedule: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { id, name, type, workflow_id, interval_minutes, cron_expr, active, metadata, last_run_at } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('schedules')
      .update({
        name,
        type,
        workflow_id: workflow_id || null,
        interval_minutes,
        cron_expr,
        active,
        metadata,
        last_run_at,
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ schedule: data })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { error } = await supabaseAdmin
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
