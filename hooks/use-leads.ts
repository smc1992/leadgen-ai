import { useState, useEffect, useCallback } from 'react'
import type { Lead } from '@/lib/supabase'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leads?limit=50')
      if (!res.ok) throw new Error('Failed to load leads')
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (err) {
      setError('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads }
}
