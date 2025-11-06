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

    const { data: rules, error } = await supabaseAdmin
      .from('content_personalization_rules')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ rules: rules || [] })
  } catch (error) {
    console.error('Personalization rules GET error:', error)
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
    const { name, description, content_type, trigger_conditions, personalization_rules, ai_enhancement } = body

    if (!name || !content_type) {
      return NextResponse.json({
        error: 'Name and content type are required'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('content_personalization_rules')
      .insert({
        user_id: session.user.id,
        name,
        description,
        content_type,
        trigger_conditions: trigger_conditions || {},
        personalization_rules: personalization_rules || {},
        ai_enhancement: ai_enhancement || true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ rule: data }, { status: 201 })
  } catch (error) {
    console.error('Personalization rules POST error:', error)
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
    const { id, name, description, content_type, trigger_conditions, personalization_rules, ai_enhancement, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('content_personalization_rules')
      .update({
        name,
        description,
        content_type,
        trigger_conditions,
        personalization_rules,
        ai_enhancement,
        is_active
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ rule: data })
  } catch (error) {
    console.error('Personalization rules PUT error:', error)
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
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('content_personalization_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Personalization rules DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
