import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enforceGuards } from '@/lib/security'
import { config } from '@/lib/config'

const FUNCTION_URL = `https://ldehgluuoouisrhrsyzh.functions.supabase.co/cron-executor`

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `admin-run-cron:${ip}`, 5, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')))

    const res = await fetch(`${FUNCTION_URL}?limit=${limit}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.cronSecret ? { 'x-cron-secret': config.cronSecret } : {}),
      },
      body: JSON.stringify({})
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(json, { status: res.status })
    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to run cron', details: e?.message }, { status: 500 })
  }
}

