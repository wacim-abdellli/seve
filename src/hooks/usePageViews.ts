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

    const logAndFetch = async () => {
      try {
        if (!logged.current) {
          const { error: logError } = await db.rpc('log_page_view', {
            visitor_id: visitorId,
            path,
            view_date: new Date().toISOString().slice(0, 10),
          })
          if (logError) throw logError
          logged.current = true
        }

        const [monthly, total] = await Promise.all([
          db.rpc('count_distinct_visitors', { since: startOfMonth.toISOString() }),
          db.rpc('count_distinct_visitors', {}),
        ])
        if (monthly.data !== null) setMonthlyViews(monthly.data as number)
        if (total.data !== null) setTotalViews(total.data as number)
      } catch {
        // Supabase not available
      }
    }

    logAndFetch()

    const interval = setInterval(logAndFetch, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  return { totalViews, monthlyViews }
}
