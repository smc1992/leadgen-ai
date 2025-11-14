import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const statuses = status ? [status] : ['replied','bounced','out_of_office','unsubscribe']
    const { data, error } = await supabaseAdmin
      .from('outreach_emails')
      .select('id,campaign_id,lead_id,lead_email,lead_name,subject,status,sent_at,opened_at,clicked_at')
      .eq('user_id', session.user.id)
      .in('status', statuses)
      .order('sent_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return NextResponse.json({ items: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

