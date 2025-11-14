import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enforceGuards } from '@/lib/security'
import { config } from '@/lib/config'

const FUNCTION_URL = `https://ldehgluuoouisrhrsyzh.functions.supabase.co/automation-trigger`

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const guard = enforceGuards(request, `admin-trigger-automation:${ip}`, 10, 60_000)
    if (guard) return guard
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const payload = {
      trigger_type: body?.trigger_type,
      user_id: session.user.id,
      context: body?.context || {}
    }
    if (!payload.trigger_type) return NextResponse.json({ error: 'trigger_type required' }, { status: 400 })

    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.cronSecret ? { 'x-cron-secret': config.cronSecret } : {}),
      },
      body: JSON.stringify(payload)
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(json, { status: res.status })
    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to trigger automation', details: e?.message }, { status: 500 })
  }
}

