import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

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

async function fetchCounts() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [monthly, total] = await Promise.all([
    supabase.rpc('count_distinct_visitors', { since: startOfMonth.toISOString() }),
    supabase.rpc('count_distinct_visitors', {}),
  ])

  return {
    monthlyViews: monthly.data as number | null,
    totalViews: total.data as number | null,
  }
}

export function usePageViews() {
  const [totalViews, setTotalViews] = useState<number | null>(null)
  const [monthlyViews, setMonthlyViews] = useState<number | null>(null)
  const logged = useRef(false)

  useEffect(() => {
    const visitorId = getVisitorId()
    const path = window.location.pathname

    const logAndFetch = async () => {
      try {
        if (!logged.current) {
          await supabase.from('page_views').upsert(
            { visitor_id: visitorId, path, date: new Date().toISOString().slice(0, 10) },
            { onConflict: 'visitor_id,path,date' }
          )
          logged.current = true
        }

        const counts = await fetchCounts()
        if (counts.monthlyViews !== null) setMonthlyViews(counts.monthlyViews)
        if (counts.totalViews !== null) setTotalViews(counts.totalViews)
      } catch {
        // Silently fail
      }
    }

    logAndFetch()

    const interval = setInterval(logAndFetch, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  return { totalViews, monthlyViews }
}
