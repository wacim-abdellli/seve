/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setTimeout(() => { setLoading(false) })
      return
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    return () => listener?.subscription.unsubscribe()
  }, [])


  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-in.')
      return
    }
    try {
      setError(null)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/editor',
          queryParams: { access_type: 'offline', prompt: 'consent' },
          skipBrowserRedirect: false,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
    }
  }


  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null)
      return
    }
    try {
      setError(null)
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out')
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
