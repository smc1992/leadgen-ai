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

    const { data: prompts, error } = await supabaseAdmin
      .from('ai_prompts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ prompts: prompts || [] })
  } catch (error) {
    console.error('Prompts GET error:', error)
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
    const { name, description, prompt, category, variables } = body

    if (!name || !prompt) {
      return NextResponse.json(
        { error: 'Name and prompt are required' },
        { status: 400 }
      )
    }

    const { data: newPrompt, error } = await supabaseAdmin
      .from('ai_prompts')
      .insert({
        user_id: session.user.id,
        name,
        description: description || '',
        prompt,
        category: category || 'general',
        variables: variables || []
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ prompt: newPrompt }, { status: 201 })
  } catch (error) {
    console.error('Prompts POST error:', error)
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
    const { id, name, description, prompt, category, variables } = body

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    const { data: updatedPrompt, error } = await supabaseAdmin
      .from('ai_prompts')
      .update({
        name,
        description,
        prompt,
        category,
        variables,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ prompt: updatedPrompt })
  } catch (error) {
    console.error('Prompts PUT error:', error)
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
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('ai_prompts')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Prompts DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
