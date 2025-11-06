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
    const category = searchParams.get('category')
    const isTemplate = searchParams.get('is_template') === 'true'

    let query = supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('user_id', session.user.id)

    if (category) {
      query = query.eq('category', category)
    }

    if (isTemplate !== undefined) {
      query = query.eq('is_template', isTemplate)
    }

    const { data: workflows, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ workflows: workflows || [] })
  } catch (error) {
    console.error('Workflows GET error:', error)
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
    const { name, description, trigger_type, trigger_config, category, steps } = body

    if (!name || !trigger_type) {
      return NextResponse.json({ error: 'Name and trigger type are required' }, { status: 400 })
    }

    // Create workflow
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .insert({
        user_id: session.user.id,
        name,
        description,
        trigger_type,
        trigger_config: trigger_config || {},
        category: category || 'automation'
      })
      .select()
      .single()

    if (workflowError) throw workflowError

    // Create workflow steps if provided
    if (steps && steps.length > 0) {
      const stepsData = steps.map((step: any, index: number) => ({
        workflow_id: workflow.id,
        step_order: index,
        step_type: step.step_type,
        step_config: step.step_config || {},
        conditions: step.conditions || {}
      }))

      const { error: stepsError } = await supabaseAdmin
        .from('workflow_steps')
        .insert(stepsData)

      if (stepsError) throw stepsError
    }

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error) {
    console.error('Workflows POST error:', error)
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
    const { id, name, description, trigger_type, trigger_config, is_active, steps } = body

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }

    // Update workflow
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .update({
        name,
        description,
        trigger_type,
        trigger_config,
        is_active
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (workflowError) throw workflowError

    // Update workflow steps if provided
    if (steps) {
      // Delete existing steps
      await supabaseAdmin
        .from('workflow_steps')
        .delete()
        .eq('workflow_id', id)

      // Insert new steps
      if (steps.length > 0) {
        const stepsData = steps.map((step: any, index: number) => ({
          workflow_id: id,
          step_order: index,
          step_type: step.step_type,
          step_config: step.step_config || {},
          conditions: step.conditions || {}
        }))

        const { error: stepsError } = await supabaseAdmin
          .from('workflow_steps')
          .insert(stepsData)

        if (stepsError) throw stepsError
      }
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Workflows PUT error:', error)
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
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('workflows')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Workflows DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
