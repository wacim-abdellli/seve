import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { ResumeData, ResumeProfile, ResumeStylePreferences, AppState } from '../types/resume'
import { DEFAULT_STYLE_PREFS } from '../types/resume'
import { useToast } from '../hooks/useToast'
import { ResumeContext } from './resumeContextDef'
import { useAuth } from './AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

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
    themeColor: '#e11d48',
    templateFontSize: 10,
    templateFontWeight: 400,
    stylePrefs: { ...DEFAULT_STYLE_PREFS },
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
              stylePrefs: { ...DEFAULT_STYLE_PREFS },
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



export type CloudStatus = 'local' | 'syncing' | 'synced' | 'error' | 'unsaved'

export function ResumeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [state, setState] = useState<AppState>(loadInitialState)
  const [lastSyncedState, setLastSyncedState] = useState<AppState>(state)
  const [isSaving, setIsSaving] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('local')
  const [cloudError, setCloudError] = useState<string | null>(null)
  const hasFetchedCloudRef = useRef(false)
  const hasMergedCloudRef = useRef(false)
  const isMergingRef = useRef(false)

  // Keep reference to prevent fetchAndMergeCloud from changing identity
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })

  // Reset cloud flags when user ID changes (handles A/B login switch)
  useEffect(() => {
    hasFetchedCloudRef.current = false
    hasMergedCloudRef.current = false
    isMergingRef.current = false
  }, [user?.id])

  // Shared cloud-sync helper (used by both auto-save effect and retrySync)
  const syncToCloud = useCallback(async (profiles: ResumeProfile[], userId: string) => {
    if (!isSupabaseConfigured || !supabase) return
    for (const p of profiles) {
      const { data: existing, error: selectError } = await supabase
        .from('resumes')
        .select('id')
        .eq('id', p.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (selectError) throw selectError

      if (existing) {
        const { error: updateError } = await supabase
          .from('resumes')
          .update({ title: p.title, resume_data: p, updated_at: new Date().toISOString() })
          .eq('id', p.id)
          .eq('user_id', userId)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('resumes')
          .insert({ id: p.id, user_id: userId, title: p.title, resume_data: p, updated_at: new Date().toISOString() })

        if (insertError) {
          if (insertError.code === '23505') {
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
            continue
          }
          throw insertError
        }
      }
    }
  }, [])

  // Shared cloud fetch & merge helper
  const fetchAndMergeCloud = useCallback(async (userId: string, signal?: AbortSignal) => {
    if (!isSupabaseConfigured || !supabase) return
    setCloudStatus('syncing')
    setCloudError(null)
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*', { signal } as Record<string, unknown>)

      if (error) throw error

      const currentState = stateRef.current
      let currentResumes = currentState.resumes

      if (data && data.length > 0) {
        const cloudResumes: Record<string, ResumeProfile> = {}
        for (const row of data) {
          cloudResumes[row.id] = row.resume_data as ResumeProfile
        }

        const merged = { ...currentState.resumes }
        let hasChanges = false
        for (const [id, cloudProfile] of Object.entries(cloudResumes)) {
          if (merged[id]) {
            if (new Date(cloudProfile.updatedAt) > new Date(merged[id].updatedAt)) {
              merged[id] = cloudProfile
              hasChanges = true
            }
          } else {
            merged[id] = cloudProfile
            hasChanges = true
          }
        }

        if (hasChanges) {
          isMergingRef.current = true
          setState(prev => ({ ...prev, resumes: merged }))
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...currentState, resumes: merged }))
          currentResumes = merged
        }
      }

      // Sync the merged state back to the cloud to ensure local-only/new resumes are uploaded
      await syncToCloud(Object.values(currentResumes), userId)

      setLastSyncedState({ resumes: currentResumes, selectedResumeId: currentState.selectedResumeId })
      setCloudStatus('synced')
      setCloudError(null)
      hasMergedCloudRef.current = true
    } catch (err: unknown) {
      if (signal?.aborted || (err as { name?: string })?.name === 'AbortError') {
        return
      }
      console.error('Cloud sync fetch failed:', err)
      throw err
    }
  }, [syncToCloud])

  // Login Merge: when user is authenticated, merge cloud resumes into local state.
  // Runs on initial mount (if user already auth'd from session cookie) AND on login.
  useEffect(() => {
    if (!user || hasFetchedCloudRef.current) return
    const userId = user.id
    hasFetchedCloudRef.current = true

    const ac = new AbortController()
    let retryAttempt = 0
    const MAX_RETRIES = 3

    async function attemptFetch() {
      try {
        await fetchAndMergeCloud(userId, ac.signal)
      } catch (err: unknown) {
        if (ac.signal.aborted) return
        if (retryAttempt < MAX_RETRIES) {
          retryAttempt++
          const delay = Math.pow(2, retryAttempt) * 1000
          setTimeout(() => {
            if (!ac.signal.aborted) {
              attemptFetch()
            }
          }, delay)
          return
        }
        const msg = err instanceof Error ? err.message : String(err)
        setCloudStatus('error')
        setCloudError(msg)
      }
    }

    attemptFetch()
    return () => ac.abort()
  }, [user, fetchAndMergeCloud])

  // ---------------------------------------------------------------------------
  // Persist to localStorage on every state change (automatic).
  // Cloud sync is manual — triggered only by explicit saveChangesToCloud().
  // ---------------------------------------------------------------------------
  const isInitialMountRef = useRef(true)
  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const isLoginEvent = user?.id !== prevUserIdRef.current
    const isMergeUpdate = isMergingRef.current

    isInitialMountRef.current = false
    prevUserIdRef.current = user?.id ?? null
    isMergingRef.current = false

    // Persist to localStorage right away
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))

    if (!user) {
      setTimeout(() => { setCloudStatus('local'); setCloudError(null) })
      return
    }

    if (isLoginEvent) {
      setLastSyncedState(state)
    }

    // Determine cloud status based on unsaved changes
    if (hasMergedCloudRef.current && !isMergeUpdate) {
      const hasChanges = JSON.stringify(state.resumes) !== JSON.stringify(lastSyncedState.resumes)
      if (hasChanges) {
        setTimeout(() => { setCloudStatus('unsaved') })
      } else {
        setTimeout(() => { setCloudStatus('synced') })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user?.id, lastSyncedState])

  const saveChangesToCloud = useCallback(async () => {
    if (!user) return
    setIsSaving(true)
    setCloudStatus('syncing')
    setCloudError(null)
    try {
      await syncToCloud(Object.values(state.resumes), user.id)
      setLastSyncedState(state)
      setCloudStatus('synced')
      setCloudError(null)
      showToast('Changes saved to cloud', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message
        : (err as { message?: string })?.message ?? 'Unknown sync error'
      console.error('[Seve] Cloud save failed:', err)
      setCloudStatus('error')
      setCloudError(msg)
      showToast('Cloud save failed', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [state, user, syncToCloud, showToast])

  const discardChanges = useCallback(() => {
    if (window.confirm('Are you sure you want to discard all unsaved changes for this session? This will revert your resume to the last saved cloud version.')) {
      setState(lastSyncedState)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lastSyncedState))
      showToast('Changes discarded', 'info')
    }
  }, [lastSyncedState, showToast])

  const hasUnsavedChanges = useMemo(() => {
    if (!user) return false
    return JSON.stringify(state.resumes) !== JSON.stringify(lastSyncedState.resumes)
  }, [state.resumes, lastSyncedState.resumes, user])


  const activeResumeId = state.selectedResumeId
  const activeResume = state.resumes[activeResumeId] || Object.values(state.resumes)[0] || createDefaultResume()
  const resumeData = activeResume.resumeData
  const selectedTemplate = activeResume.selectedTemplate
  const jobDescription = activeResume.jobDescription
  const sectionOrder = activeResume.sectionOrder

  // Undo/Redo for resume data
  // Uses ref-based history tracking with direct AppState updates — no dual-state-sync
  const historyRef = useRef<ResumeData[]>([resumeData])
  const historyIndexRef = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const pushHistory = useCallback((data: ResumeData) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(data)
    if (historyRef.current.length > 30) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current++
    }
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--
      const historicalData = historyRef.current[historyIndexRef.current]
      setState(prev => {
        const active = prev.resumes[prev.selectedResumeId]
        if (!active) return prev
        return {
          ...prev,
          resumes: {
            ...prev.resumes,
            [active.id]: { ...active, resumeData: historicalData, updatedAt: new Date().toISOString() },
          },
        }
      })
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }
  }, [])

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++
      const historicalData = historyRef.current[historyIndexRef.current]
      setState(prev => {
        const active = prev.resumes[prev.selectedResumeId]
        if (!active) return prev
        return {
          ...prev,
          resumes: {
            ...prev.resumes,
            [active.id]: { ...active, resumeData: historicalData, updatedAt: new Date().toISOString() },
          },
        }
      })
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }
  }, [])

  // Reset history on resume switch
  useEffect(() => {
    historyRef.current = [resumeData]
    historyIndexRef.current = 0
    setTimeout(() => { setCanUndo(false); setCanRedo(false) })
  }, [activeResume?.id, resumeData])

  // Keyboard shortcuts: Ctrl+Z/Y for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

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
          themeColor: '#e11d48',
          templateFontSize: 10,
          templateFontWeight: 400,
          stylePrefs: { ...DEFAULT_STYLE_PREFS },
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
    if (user && isSupabaseConfigured && supabase) {
      ;(async () => { await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id) })().catch(() => {})
    }
    setState(prev => {
      const next = { ...prev.resumes }
      delete next[id]
      const nextSelectedId = prev.selectedResumeId === id
        ? (Object.keys(next)[0] || '')
        : prev.selectedResumeId
      return { ...prev, resumes: next, selectedResumeId: nextSelectedId }
    })
  }, [user])

  const updateResumeData = useCallback((data: ResumeData) => {
    pushHistory(data)
    updateActiveResume(prev => ({ ...prev, resumeData: data }))
  }, [pushHistory, updateActiveResume])

  const updateSectionOrder = useCallback((newOrder: string[]) => {
    updateActiveResume(prev => ({ ...prev, sectionOrder: newOrder }))
  }, [updateActiveResume])

  const importResumeData = useCallback((data: ResumeData) => {
    pushHistory(data)
    updateActiveResume(prev => ({ ...prev, resumeData: data }))
  }, [pushHistory, updateActiveResume])

  const updateStylePrefs = useCallback((updater: (prev: ResumeStylePreferences) => ResumeStylePreferences) => {
    updateActiveResume(prev => ({
      ...prev,
      stylePrefs: updater(prev.stylePrefs || { ...DEFAULT_STYLE_PREFS }),
    }))
  }, [updateActiveResume])

  const retrySync = useCallback(async () => {
    if (!user) return
    setCloudStatus('syncing')
    setCloudError(null)
    try {
      if (!hasMergedCloudRef.current) {
        await fetchAndMergeCloud(user.id)
      } else {
        await saveChangesToCloud()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Unknown error'
      console.error('[Seve] RetrySync failed:', err)
      setCloudStatus('error')
      setCloudError(msg)
    }
  }, [user, fetchAndMergeCloud, saveChangesToCloud])



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
    updateStylePrefs,
    updateResumeData,
    updateSectionOrder,
    importResumeData,
    retrySync,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    saveChangesToCloud,
    discardChanges,
  }), [
    state.resumes, state.selectedResumeId, activeResume, resumeData,
    selectedTemplate, jobDescription, sectionOrder, isSaving, cloudStatus, cloudError,
    selectResume, createResume, duplicateResume, renameResume, deleteResume,
    updateActiveResume, updateStylePrefs, updateResumeData, updateSectionOrder, importResumeData, retrySync,
    handleUndo, handleRedo, canUndo, canRedo,
    hasUnsavedChanges, saveChangesToCloud, discardChanges,
  ])

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  )
}


