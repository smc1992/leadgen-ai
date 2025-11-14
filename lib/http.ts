export async function fetchWithRetry(url: string, init: RequestInit = {}, maxRetries = 3, baseDelayMs = 500) {
  let lastErr: any
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init)
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text?.slice(0, 300)}`)
      }
      return res
    } catch (e) {
      lastErr = e
      if (attempt === maxRetries) break
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)))
    }
  }
  throw lastErr
}

