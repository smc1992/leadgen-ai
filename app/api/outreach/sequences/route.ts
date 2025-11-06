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

    const { data: sequences, error } = await supabaseAdmin
      .from('email_sequences')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sequences })
  } catch (error) {
    console.error('Sequences GET error:', error)
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
    const { name, description, steps } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('email_sequences')
      .insert({
        user_id: session.user.id,
        name,
        description: description || '',
        status: 'draft',
        steps: steps || [],
        enrolled_leads: 0,
        completion_rate: 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ sequence: data }, { status: 201 })
  } catch (error) {
    console.error('Sequences POST error:', error)
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
    const { id, name, description, status, steps, enrolledLeads, completionRate } = body

    if (!id) {
      return NextResponse.json({ error: 'Sequence ID is required' }, { status: 400 })
    }

    const { data: sequence, error } = await supabaseAdmin
      .from('email_sequences')
      .update({
        name,
        description,
        status,
        steps,
        enrolled_leads: enrolledLeads,
        completion_rate: completionRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ sequence })
  } catch (error) {
    console.error('Sequences PUT error:', error)
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
      return NextResponse.json({ error: 'Sequence ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('email_sequences')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sequences DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
