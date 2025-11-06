import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subject, content, category } = body

    if (!name || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Extract variables from content
    const variableMatches = content.match(/\{\{(\w+)\}\}/g)
    const variables = variableMatches ? variableMatches.map(match => match.replace(/[{}]/g, "")) : []

    // Save to Supabase
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        user_id: session.user.id,
        name,
        subject,
        content,
        category: category || 'Introduction',
        variables,
        usage_count: 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('user_id', session.user.id)

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`)
    }

    const { data: templates, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates GET error:', error)
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
    const { id, name, subject, content, category } = body

    if (!id || !name || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Extract variables from content
    const variableMatches = content.match(/\{\{(\w+)\}\}/g)
    const variables = variableMatches ? variableMatches.map(match => match.replace(/[{}]/g, "")) : []

    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .update({
        name,
        subject,
        content,
        category: category || 'Introduction',
        variables,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Templates PUT error:', error)
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
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Templates DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
