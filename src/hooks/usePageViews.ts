import { useEffect, useState, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const VISITOR_KEY = 'sv_visitor_id'
const POLL_INTERVAL = 30_000

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

export function usePageViews() {
  const [totalViews, setTotalViews] = useState<number | null>(null)
  const [monthlyViews, setMonthlyViews] = useState<number | null>(null)
  const logged = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const db = supabase

    const visitorId = getVisitorId()
    const path = window.location.pathname
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const ac = new AbortController()

    const logAndFetch = async () => {
      if (ac.signal.aborted) return
      try {
        if (!logged.current) {
          const { error: logError } = await db.rpc('log_page_view', {
            visitor_id: visitorId,
            path,
            view_date: new Date().toISOString().slice(0, 10),
          }, { signal: ac.signal } as Record<string, unknown>)
          if (logError) throw logError
          logged.current = true
        }

        if (ac.signal.aborted) return
        const [monthly, total] = await Promise.all([
          db.rpc('count_distinct_visitors', { since: startOfMonth.toISOString() }, { signal: ac.signal } as Record<string, unknown>),
          db.rpc('count_distinct_visitors', {}, { signal: ac.signal } as Record<string, unknown>),
        ])
        if (monthly.data !== null) setMonthlyViews(monthly.data as number)
        if (total.data !== null) setTotalViews(total.data as number)
      } catch {
        // Supabase not available or aborted
      }
    }

    logAndFetch()

    const interval = setInterval(logAndFetch, POLL_INTERVAL)
    return () => {
      ac.abort()
      clearInterval(interval)
    }
  }, [])

  return { totalViews, monthlyViews }
}
