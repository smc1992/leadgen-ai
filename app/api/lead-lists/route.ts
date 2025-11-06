import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    let session: any = null
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError) {
      // NextAuth kann JWEDecryptionFailed werfen, wenn das Cookie mit altem Secret erstellt wurde
      // Behandle dies als nicht authentifiziert statt 500
      console.warn('Session decode error, returning 401:', sessionError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validierung: user.id muss UUID sein, um Postgres 22P02 zu vermeiden
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(String(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      return NextResponse.json({ error: 'Service unavailable: Supabase not configured' }, { status: 503 })
    }

    const { data: lists, error } = await supabaseAdmin
      .from('lead_lists')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    // If the main table is missing or errors, return empty lists instead of 500
    if (error) {
      console.warn('lead_lists query failed, returning empty list:', error)
      return NextResponse.json({ lists: [] })
    }

    // Optionally get counts per list
    // Counts are optional; if the auxiliary table is missing or errors, continue without counts
    let countsArray: any[] = []
    try {
      const { data: countsData, error: countError } = await supabaseAdmin
        .from('lead_list_items')
        .select('list_id, lead_id')
      if (!countError && Array.isArray(countsData)) {
        countsArray = countsData
      }
    } catch (e) {
      // Swallow counts errors; return lists without counts
      countsArray = []
    }
    const listArray: any[] = Array.isArray(lists) ? lists : []

    const countsMap: Record<string, number> = {}
    countsArray.forEach((row: any) => {
      const key = String(row.list_id)
      countsMap[key] = (countsMap[key] || 0) + 1
    })

    const listsWithCounts = listArray.map((l: any) => {
      const idKey = String(l.id)
      return {
        ...l,
        leads_count: countsMap[idKey] || 0
      }
    })

    return NextResponse.json({ lists: listsWithCounts })
  } catch (error) {
    console.error('Lead lists GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}