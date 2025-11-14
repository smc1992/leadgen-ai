export function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(/(?:^|; )csrfToken=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export async function fetchWithCsrf(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getCsrfToken()
  const headers = new Headers(init.headers || {})
  if (init.method && init.method.toUpperCase() !== 'GET') {
    if (token) headers.set('X-CSRF-Token', token)
  }
  return fetch(input, { ...init, headers })
}

