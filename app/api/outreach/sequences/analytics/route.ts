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
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }

    const { data: emails } = await supabaseAdmin
      .from('outreach_emails')
      .select('template_id,status')
      .eq('user_id', session.user.id)

    const agg: Record<string, { sent: number; opened: number; clicked: number }> = {}
    for (const e of emails || []) {
      const t = e.template_id || 'unknown'
      agg[t] = agg[t] || { sent: 0, opened: 0, clicked: 0 }
      if (e.status === 'opened') agg[t].opened += 1
      else if (e.status === 'clicked') agg[t].clicked += 1
      else agg[t].sent += 1
    }

    return NextResponse.json({ byTemplate: agg })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

