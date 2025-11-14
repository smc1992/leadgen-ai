import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('lead_enrichments')
      .select('id, url, markdown, summary, branding, links, created_at')
      .eq('user_id', session.user.id)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) throw error
    return NextResponse.json({ items: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}