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

    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured for setup/deal-stages POST')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    // Check if deal stages already exist
    const { data: existingStages, error: checkError } = await supabaseAdmin
      .from('deal_stages')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('Error checking deal stages:', checkError)
    }

    // If stages already exist, don't create duplicates
    if (existingStages && existingStages.length > 0) {
      return NextResponse.json({
        message: 'Deal stages already exist',
        stages: existingStages
      })
    }

    // Create default deal stages
    const defaultStages = [
      {
        name: 'Discovery',
        description: 'Initial contact and qualification',
        color: '#3b82f6',
        order_position: 1,
        probability: 10
      },
      {
        name: 'Needs Analysis',
        description: 'Understanding customer requirements',
        color: '#8b5cf6',
        order_position: 2,
        probability: 20
      },
      {
        name: 'Proposal',
        description: 'Sending proposal and pricing',
        color: '#f59e0b',
        order_position: 3,
        probability: 40
      },
      {
        name: 'Negotiation',
        description: 'Final discussions and terms',
        color: '#ef4444',
        order_position: 4,
        probability: 70
      },
      {
        name: 'Closed Won',
        description: 'Deal successfully closed',
        color: '#10b981',
        order_position: 5,
        probability: 100
      },
      {
        name: 'Closed Lost',
        description: 'Deal lost to competitor or cancelled',
        color: '#6b7280',
        order_position: 6,
        probability: 0
      }
    ]

    const { data: stages, error } = await supabaseAdmin
      .from('deal_stages')
      .insert(defaultStages)
      .select()

    if (error) throw error

    return NextResponse.json({
      message: 'Default deal stages created successfully',
      stages
    })

  } catch (error) {
    console.error('Setup deal stages error:', error)
    const message = (error as any)?.message || 'Failed to setup deal stages'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
