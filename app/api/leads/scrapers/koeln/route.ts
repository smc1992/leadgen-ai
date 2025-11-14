import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { scrapeKoelnExhibitors } from '@/lib/scrapers/koelnmesse'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.error('Supabase admin client not configured for Koeln import')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const body = await request.json()
    const listUrl: string | undefined = body?.listUrl
    const limit: number | undefined = body?.limit

    if (!listUrl || typeof listUrl !== 'string') {
      return NextResponse.json({ error: 'listUrl is required' }, { status: 400 })
    }

    const exhibitors = await scrapeKoelnExhibitors(listUrl, limit)

    const leadsPayload = exhibitors.map((ex) => ({
      full_name: ex.contact_person_name || ex.company_name || 'Unknown',
      job_title: ex.contact_person_role || null,
      company: ex.company_name || null,
      email: ex.company_email || null,
      email_status: 'unknown',
      score: 50,
      region: 'germany',
      channel: 'event',
      source_url: ex.exhibitor_profile_url,
      is_outreach_ready: false,
      website_url: ex.company_website || null,
      phone: ex.company_phone || null,
    }))

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leadsPayload)
      .select('*')

    if (error) {
      console.error('Koeln import insert error:', error)
      return NextResponse.json({ error: 'Failed to insert leads' }, { status: 500 })
    }

    return NextResponse.json({ imported: data?.length || 0, leads: data || [] })
  } catch (error) {
    console.error('Koeln import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}