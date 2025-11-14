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
    const { data, error } = await supabaseAdmin
      .from('scrape_runs')
      .select('id,type,status,result_count,created_at,error_message')
      .eq('triggered_by', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) {
      return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
    return NextResponse.json({ runs: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
