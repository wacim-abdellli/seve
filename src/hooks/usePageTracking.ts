import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const VISITOR_KEY = 'sv_visitor_id'

export function getVisitorId(): string {
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

export function usePageTracking() {
  const { user } = useAuth()
  const location = useLocation()
  const lastLoggedPath = useRef<string | null>(null)
  const lastLoggedUser = useRef<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const db = supabase

    const visitorId = getVisitorId()
    const currentPath = location.pathname
    const userId = user?.id || null
    const userEmail = user?.email || null

    // Avoid logging duplicate paths unless user state has changed (e.g. logs in/out)
    if (lastLoggedPath.current === currentPath && lastLoggedUser.current === userId) {
      return
    }

    const logView = async () => {
      try {
        const { error } = await db.rpc('log_page_view', {
          visitor_id: visitorId,
          path: currentPath,
          view_date: new Date().toISOString().slice(0, 10),
          user_id: userId,
          email: userEmail,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null
        })

        if (!error) {
          lastLoggedPath.current = currentPath
          lastLoggedUser.current = userId
        }
      } catch (err) {
        console.error('Error logging page view:', err)
      }
    }

    logView()
  }, [location.pathname, user])
}
