import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

type Bucket = { tokens: number; updatedAt: number }
const buckets: Map<string, Bucket> = (globalThis as any).__rateBuckets || new Map();
(globalThis as any).__rateBuckets = buckets;

export function checkOrigin(req: NextRequest) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || ''
  if (!origin) return NextResponse.json({ error: 'Origin missing' }, { status: 400 })
  if (!origin.startsWith(config.appUrl)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  return null
}

export function rateLimit(identifier: string, limit = 20, windowMs = 60_000) {
  const now = Date.now()
  const bucket = buckets.get(identifier) || { tokens: limit, updatedAt: now }
  const elapsed = now - bucket.updatedAt
  const refill = Math.floor(elapsed / windowMs) * limit
  bucket.tokens = Math.min(limit, bucket.tokens + Math.max(0, refill))
  bucket.updatedAt = now
  if (bucket.tokens <= 0) {
    buckets.set(identifier, bucket)
    return false
  }
  bucket.tokens -= 1
  buckets.set(identifier, bucket)
  return true
}

export function enforceGuards(req: NextRequest, key: string, limit = 20, windowMs = 60_000) {
  const originResult = checkOrigin(req)
  if (originResult) return originResult
  const method = req.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrfHeader = req.headers.get('x-csrf-token') || ''
    const csrfCookie = req.cookies.get('csrfToken')?.value || ''
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }
  }
  const ok = rateLimit(key, limit, windowMs)
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  return null
}
