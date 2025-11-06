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
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('user_id', session.user.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: campaigns, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Campaigns GET error:', error)
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
    const { name, subject, templateId, leadsCount, settings } = body

    if (!name || !subject || !templateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        user_id: session.user.id,
        name,
        template_id: templateId,
        status: 'draft',
        leads_count: leadsCount || 0,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ campaign: data }, { status: 201 })
  } catch (error) {
    console.error('Campaigns POST error:', error)
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
    const { id, name, subject, templateId, status, leadsCount, sentCount, deliveredCount, openedCount, clickedCount } = body

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const { data: campaign, error } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        name,
        template_id: templateId,
        status,
        leads_count: leadsCount,
        sent_count: sentCount,
        delivered_count: deliveredCount,
        opened_count: openedCount,
        clicked_count: clickedCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Campaigns PUT error:', error)
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
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('email_campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaigns DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
