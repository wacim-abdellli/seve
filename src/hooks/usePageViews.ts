import { useEffect, useState, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const VISITOR_KEY = 'sv_visitor_id'
const POLL_INTERVAL = 30_000
const MAX_RETRIES = 3

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    try {
      id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    } catch {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    }
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

export function usePageViews() {
  const [totalViews, setTotalViews] = useState<number | null>(null)
  const [monthlyViews, setMonthlyViews] = useState<number | null>(null)
  const logged = useRef(false)
  const retryCount = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

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
      if (ac.signal.aborted || !mountedRef.current) return
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

        if (ac.signal.aborted || !mountedRef.current) return
        const [monthlyResult, totalResult] = await Promise.allSettled([
          db.rpc('count_distinct_visitors', { since: startOfMonth.toISOString() }, { signal: ac.signal } as Record<string, unknown>),
          db.rpc('count_distinct_visitors', {}, { signal: ac.signal } as Record<string, unknown>),
        ])

        if (ac.signal.aborted || !mountedRef.current) return

        if (monthlyResult.status === 'fulfilled' && monthlyResult.value.data !== null) {
          setMonthlyViews(monthlyResult.value.data as number)
        }
        if (totalResult.status === 'fulfilled' && totalResult.value.data !== null) {
          setTotalViews(totalResult.value.data as number)
        }

        retryCount.current = 0
      } catch {
        retryCount.current++
        if (retryCount.current > MAX_RETRIES) {
          if (mountedRef.current) clearInterval(interval)
        }
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
