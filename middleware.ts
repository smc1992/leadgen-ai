import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function genToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const csrfCookie = req.cookies.get('csrfToken')?.value
  if (!csrfCookie) {
    res.cookies.set('csrfToken', genToken(), { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}

