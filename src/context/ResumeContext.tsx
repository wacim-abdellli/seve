import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { ResumeData, ResumeProfile, AppState } from '../types/resume'
import { ResumeContext } from './resumeContextDef'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const LOCAL_STORAGE_KEY = 'seve_state'
// Fixed UUID for the default resume — must be a valid UUID because
// the Supabase `resumes` table has `id UUID`. Using a fixed deterministic
// UUID so existing users' localStorage data migrates cleanly.
const defaultResumeId = '00000000-0000-0000-0000-000000000001'

const INITIAL_RESUME_DATA: ResumeData = {
  contact: {
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    location: '',
    website: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
}

const DEFAULT_SECTION_ORDER = ['summary', 'experience', 'projects', 'education', 'languages', 'skills', 'awards', 'certifications', 'publications', 'volunteer', 'interests', 'references']

function createDefaultResume(): ResumeProfile {
  return {
    id: defaultResumeId,
    title: 'My Resume',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resumeData: { ...INITIAL_RESUME_DATA },
    selectedTemplate: 'classic',
    jobDescription: '',
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  }
}

function loadInitialState(): AppState {
  let saved = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!saved) {
    saved = localStorage.getItem('resumeai_state')
  }
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.resumes && parsed.selectedResumeId) {
        // Migrate any old string-based IDs ('default-resume') to the proper UUID.
        // This ensures Supabase upsert doesn't fail with invalid UUID type errors.
        const migratedResumes: typeof parsed.resumes = {}
        let migratedSelectedId = parsed.selectedResumeId

        for (const [id, resume] of Object.entries(parsed.resumes)) {
          const newId = id === 'default-resume' ? defaultResumeId : id
          migratedResumes[newId] = { ...(resume as ResumeProfile), id: newId }
          if (parsed.selectedResumeId === id) migratedSelectedId = newId
        }

        return {
          resumes: migratedResumes,
          selectedResumeId: migratedSelectedId,
        }
      } else if (parsed.resumeData) {
        let sectionOrder = parsed.sectionOrder
        if (!sectionOrder) {
          const saved = localStorage.getItem('seve_section_order') || localStorage.getItem('resumeai_section_order')
          if (saved) { try { const p = JSON.parse(saved); if (Array.isArray(p) && p.length > 0) sectionOrder = p } catch { /* ignore */ } }
        }
        return {
          resumes: {
            [defaultResumeId]: {
              id: defaultResumeId,
              title: 'My Resume',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              resumeData: parsed.resumeData,
              selectedTemplate: parsed.selectedTemplate || 'classic',
              jobDescription: parsed.jobDescription || '',
              sectionOrder: sectionOrder || [...DEFAULT_SECTION_ORDER],
            },
          },
          selectedResumeId: defaultResumeId,
        }
      }
    } catch (e) {
      console.error('Failed to parse saved state, resetting', e)
    }
  }
  return {
    resumes: { [defaultResumeId]: createDefaultResume() },
    selectedResumeId: defaultResumeId,
  }
}



export type CloudStatus = 'local' | 'syncing' | 'synced' | 'error'

export function ResumeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AppState>(loadInitialState)
  const [isSaving, setIsSaving] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('local')
  const [cloudError, setCloudError] = useState<string | null>(null)
  const hasFetchedCloudRef = useRef(false)

  // Login Merge: when user is authenticated, merge cloud resumes into local state.
  // Runs on initial mount (if user already auth'd from session cookie) AND on login.
  useEffect(() => {
    if (!user || hasFetchedCloudRef.current) return
    hasFetchedCloudRef.current = true

    setCloudStatus('syncing')

    supabase
      .from('resumes')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error('Cloud sync fetch failed:', error.message)
          setCloudStatus('error')
          setCloudError(error.message)
          return
        }

        if (!data || data.length === 0) {
          setCloudStatus('synced')
          return
        }

        const cloudResumes: Record<string, ResumeProfile> = {}
        for (const row of data) {
          cloudResumes[row.id] = row.resume_data as ResumeProfile
        }

        setState(prev => {
          const merged = { ...prev.resumes }

          for (const [id, cloudProfile] of Object.entries(cloudResumes)) {
            if (merged[id]) {
              if (new Date(cloudProfile.updatedAt) > new Date(merged[id].updatedAt)) {
                merged[id] = cloudProfile
              }
            } else {
              merged[id] = cloudProfile
            }
          }

          const mergedState = { ...prev, resumes: merged }
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedState))
          return mergedState
        })

        setCloudStatus('synced')
      })
  }, [user])

  // ---------------------------------------------------------------------------
  // Shared cloud-sync helper (used by both auto-save effect and retrySync)
  // ---------------------------------------------------------------------------
  const syncToCloud = useCallback(async (profiles: ResumeProfile[], userId: string) => {
    for (const p of profiles) {
      // Check whether this user's row already exists
      const { data: existing, error: selectError } = await supabase
        .from('resumes')
        .select('id')
        .eq('id', p.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (selectError) throw selectError

      if (existing) {
        // Row exists → UPDATE only the mutable columns
        const { error: updateError } = await supabase
          .from('resumes')
          .update({ title: p.title, resume_data: p, updated_at: new Date().toISOString() })
          .eq('id', p.id)
          .eq('user_id', userId)
        if (updateError) throw updateError
      } else {
        // Row missing → INSERT
        const { error: insertError } = await supabase
          .from('resumes')
          .insert({ id: p.id, user_id: userId, title: p.title, resume_data: p, updated_at: new Date().toISOString() })

        if (insertError) {
          if (insertError.code === '23505') {
            // 23505 = duplicate key: a row with this ID exists but belongs to
            // a different user (RLS hides it from SELECT, so we can't UPDATE it).
            // Self-heal: generate a fresh UUID so this user's data can sync.
            const newId = crypto.randomUUID()
            setState(prev => {
              const resume = prev.resumes[p.id]
              if (!resume) return prev
              const next = { ...prev.resumes }
              delete next[p.id]
              next[newId] = { ...resume, id: newId }
              return {
                ...prev,
                resumes: next,
                selectedResumeId: prev.selectedResumeId === p.id ? newId : prev.selectedResumeId,
              }
            })
            // State change will trigger another auto-save with the new ID
            continue
          }
          throw insertError
        }
      }
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Auto-save: persist to localStorage immediately, debounce cloud sync 800ms.
  // "Saving…" indicator is shown only for actual user edits — not on the
  // initial page load and not when only the auth state changes.
  // ---------------------------------------------------------------------------
  const isInitialMountRef = useRef(true)
  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const isInitialLoad = isInitialMountRef.current
    const isLoginEvent = user?.id !== prevUserIdRef.current

    isInitialMountRef.current = false
    prevUserIdRef.current = user?.id ?? null

    // Persist to localStorage right away — don't wait for the debounce timer.
    // This guarantees data is saved even if the tab is closed before 800ms.
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))

    // Only show "Saving…" for genuine user edits (not on mount or login).
    const isUserEdit = !isInitialLoad && !isLoginEvent
    if (isUserEdit) {
      setIsSaving(true)
      if (user) setCloudStatus('syncing')
    }

    if (!user) {
      setCloudStatus('local')
      setCloudError(null)
      setIsSaving(false)
      return
    }

    // Debounce the cloud write so rapid keystrokes only cause one round-trip.
    const handler = setTimeout(async () => {
      setIsSaving(false)
      try {
        await syncToCloud(Object.values(state.resumes), user.id)
        setCloudStatus('synced')
        setCloudError(null)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message
          : (err as { message?: string })?.message ?? 'Unknown sync error'
        console.error('[Seve] Cloud sync failed:', err)
        setCloudStatus('error')
        setCloudError(msg)
      }
    }, 800)

    // Cancel the pending write on cleanup — don't flip isSaving here to avoid flicker.
    return () => clearTimeout(handler)
  }, [state, user, syncToCloud])


  const activeResumeId = state.selectedResumeId
  const activeResume = state.resumes[activeResumeId] || Object.values(state.resumes)[0] || createDefaultResume()
  const resumeData = activeResume.resumeData
  const selectedTemplate = activeResume.selectedTemplate
  const jobDescription = activeResume.jobDescription
  const sectionOrder = activeResume.sectionOrder

  const selectResume = useCallback((id: string) => {
    setState(prev => ({ ...prev, selectedResumeId: id }))
  }, [])

  const updateActiveResume = useCallback((updater: (prev: ResumeProfile) => ResumeProfile) => {
    setState(prev => {
      const active = prev.resumes[prev.selectedResumeId] || Object.values(prev.resumes)[0]
      if (!active) return prev
      const updated = updater(active)
      return {
        ...prev,
        resumes: {
          ...prev.resumes,
          [updated.id]: { ...updated, updatedAt: new Date().toISOString() },
        },
      }
    })
  }, [])

  const createResume = useCallback((title: string) => {
    const newId = crypto.randomUUID()
    setState(prev => ({
      ...prev,
      resumes: {
        ...prev.resumes,
        [newId]: {
          id: newId,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resumeData: { ...INITIAL_RESUME_DATA },
          selectedTemplate: 'classic',
          jobDescription: '',
          sectionOrder: [...DEFAULT_SECTION_ORDER],
        },
      },
      selectedResumeId: newId,
    }))
  }, [])

  const duplicateResume = useCallback((id: string) => {
    setState(prev => {
      const source = prev.resumes[id]
      if (!source) return prev
      const newId = crypto.randomUUID()
      return {
        ...prev,
        resumes: {
          ...prev.resumes,
          [newId]: {
            ...source,
            id: newId,
            title: `${source.title} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        selectedResumeId: newId,
      }
    })
  }, [])

  const renameResume = useCallback((id: string, newTitle: string) => {
    setState(prev => {
      const target = prev.resumes[id]
      if (!target) return prev
      return {
        ...prev,
        resumes: {
          ...prev.resumes,
          [id]: { ...target, title: newTitle, updatedAt: new Date().toISOString() },
        },
      }
    })
  }, [])

  const deleteResume = useCallback((id: string) => {
    setState(prev => {
      const next = { ...prev.resumes }
      delete next[id]
      const nextSelectedId = prev.selectedResumeId === id
        ? (Object.keys(next)[0] || '')
        : prev.selectedResumeId
      return { ...prev, resumes: next, selectedResumeId: nextSelectedId }
    })
  }, [])

  const updateResumeData = useCallback((data: ResumeData) => {
    updateActiveResume(prev => ({ ...prev, resumeData: data }))
  }, [updateActiveResume])

  const updateSectionOrder = useCallback((newOrder: string[]) => {
    updateActiveResume(prev => ({ ...prev, sectionOrder: newOrder }))
  }, [updateActiveResume])

  const importResumeData = useCallback((data: ResumeData) => {
    updateActiveResume(prev => ({ ...prev, resumeData: data }))
  }, [updateActiveResume])

  const retrySync = useCallback(async () => {
    if (!user) return
    setCloudStatus('syncing')
    setCloudError(null)
    try {
      await syncToCloud(Object.values(state.resumes), user.id)
      setCloudStatus('synced')
      setCloudError(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Unknown error'
      console.error('[Seve] RetrySync failed:', err)
      setCloudStatus('error')
      setCloudError(msg)
    }
  }, [user, state.resumes, syncToCloud])



  const value = useMemo(() => ({
    resumes: state.resumes,
    selectedResumeId: state.selectedResumeId,
    activeResume,
    resumeData,
    selectedTemplate,
    jobDescription,
    sectionOrder,
    isSaving,
    cloudStatus,
    cloudError,
    selectResume,
    createResume,
    duplicateResume,
    renameResume,
    deleteResume,
    updateActiveResume,
    updateResumeData,
    updateSectionOrder,
    importResumeData,
    retrySync,
  }), [
    state.resumes, state.selectedResumeId, activeResume, resumeData,
    selectedTemplate, jobDescription, sectionOrder, isSaving, cloudStatus, cloudError,
    selectResume, createResume, duplicateResume, renameResume, deleteResume,
    updateActiveResume, updateResumeData, updateSectionOrder, importResumeData, retrySync,
  ])

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  )
}


