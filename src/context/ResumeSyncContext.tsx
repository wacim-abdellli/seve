import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { AppState, ResumeData, ResumeProfile, Template } from '../types/resume'
import { DEFAULT_STYLE_PREFS } from '../types/resume'
import { ResumeContext, type ResumeContextType, type CloudStatus } from './resumeContextDef'
import { useResumeDataContext } from './resumeDataContextDef'
import { DEFAULT_SECTION_ORDER } from './constants'
import { useAuth } from './AuthContext'
import { useToast } from '../hooks/useToast'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const DELETED_IDS_KEY = 'seve_deleted_ids'

const parseToUtcMs = (dateStr?: string): number => {
  if (!dateStr) return 0
  let normalized = dateStr
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/)) {
    normalized = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'
  }
  const t = Date.parse(normalized)
  return isNaN(t) ? 0 : t
}

export function ResumeSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const {
    state, setState, activeResume, resumeData, selectedTemplate, jobDescription, sectionOrder,
    selectResume, createResume, duplicateResume, renameResume, deleteResume,
    updateActiveResume, updateStylePrefs, updateResumeData, updateSectionOrder, importResumeData,
    undo, redo, canUndo, canRedo,
    computeResumeHash, restoreFromBackup,
  } = useResumeDataContext()

  const [lastSyncedState, setLastSyncedState] = useState<AppState>(state)
  const [isSaving, setIsSaving] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('local')
  const [cloudError, setCloudError] = useState<string | null>(null)
  const hasFetchedCloudRef = useRef(false)
  const hasMergedCloudRef = useRef(false)
  const isMergingRef = useRef(false)

  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })
  const lastSyncedStateRef = useRef(lastSyncedState)
  useEffect(() => { lastSyncedStateRef.current = lastSyncedState })

  useEffect(() => {
    hasFetchedCloudRef.current = false
    hasMergedCloudRef.current = false
    isMergingRef.current = false
  }, [user?.id])

  const syncToCloud = useCallback(async (profiles: ResumeProfile[], userId: string) => {
    if (!isSupabaseConfigured || !supabase) return

    const rows = profiles.map(p => ({
      id: p.id,
      user_id: userId,
      title: p.title,
      resume_data: p,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('resumes')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

    if (error) {
      console.error('Batch sync failed:', error)
      throw error
    }
  }, [])

  const fetchAndMergeCloud = useCallback(async (userId: string, signal?: AbortSignal) => {
    if (!isSupabaseConfigured || !supabase) return
    setCloudStatus('syncing')
    setCloudError(null)
    try {
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]')
        if (deletedIds.length > 0) {
          for (const deletedId of deletedIds) {
            await supabase.from('resumes').delete().eq('id', deletedId).eq('user_id', userId)
          }
          localStorage.setItem(DELETED_IDS_KEY, '[]')
        }
      } catch { /* ignore */ }

      const { data, error } = await supabase
        .from('resumes')
        .select('*', { signal } as unknown as { head?: boolean; count?: 'exact' | 'planned' | 'estimated' })

      if (error) throw error

      const currentState = stateRef.current
      let currentResumes = currentState.resumes

      if (data && data.length > 0) {
        const cloudResumes: Record<string, ResumeProfile> = {}
        const validateProfile = (raw: Record<string, unknown>): ResumeProfile => ({
          id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
          title: typeof raw.title === 'string' ? raw.title : 'Untitled',
          createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
          updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
          revision: typeof raw.revision === 'number' ? raw.revision : 1,
          resumeData: null as unknown as ResumeData,
          selectedTemplate: (typeof raw.selectedTemplate === 'string' ? raw.selectedTemplate : 'classic') as Template,
          jobDescription: typeof raw.jobDescription === 'string' ? raw.jobDescription : '',
          sectionOrder: Array.isArray(raw.sectionOrder) ? raw.sectionOrder : [...DEFAULT_SECTION_ORDER],
          themeColor: typeof raw.themeColor === 'string' ? raw.themeColor : '#b91c1c',
          templateFontSize: typeof raw.templateFontSize === 'number' ? raw.templateFontSize : 10,
          templateFontWeight: typeof raw.templateFontWeight === 'number' ? raw.templateFontWeight : 400,
          stylePrefs: raw.stylePrefs && typeof raw.stylePrefs === 'object'
            ? { ...DEFAULT_STYLE_PREFS, ...(raw.stylePrefs as Record<string, unknown>) }
            : { ...DEFAULT_STYLE_PREFS },
        })
        for (const row of data) {
          cloudResumes[row.id] = validateProfile(row.resume_data as Record<string, unknown>)
        }

        const merged = { ...currentState.resumes }
        let hasChanges = false
        for (const [id, cloudProfile] of Object.entries(cloudResumes)) {
          if (merged[id]) {
            const localRev = merged[id].revision || 0
            const cloudRev = cloudProfile.revision || 0
            if (cloudRev > localRev) {
              merged[id] = cloudProfile
              hasChanges = true
            } else if (cloudRev === localRev && parseToUtcMs(cloudProfile.updatedAt) > parseToUtcMs(merged[id].updatedAt)) {
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
          localStorage.setItem('seve_state', JSON.stringify({ ...currentState, resumes: merged }))
          currentResumes = merged
        }
      }

      await syncToCloud(Object.values(currentResumes), userId)

      const latestState = stateRef.current
      setLastSyncedState({ resumes: latestState.resumes, selectedResumeId: latestState.selectedResumeId, schemaVersion: latestState.schemaVersion })
      setCloudStatus('synced')
      setCloudError(null)
      hasMergedCloudRef.current = true
      isMergingRef.current = false
    } catch (err: unknown) {
      if (signal?.aborted || (err as { name?: string })?.name === 'AbortError') {
        return
      }
      console.error('Cloud sync fetch failed:', err)
      throw err
    }
  }, [syncToCloud, setState])

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

  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const isLoginEvent = user?.id !== prevUserIdRef.current
    prevUserIdRef.current = user?.id ?? null
    const isMergeUpdate = isMergingRef.current

    if (!user) {
      queueMicrotask(() => {
        setCloudStatus('local')
        setCloudError(null)
      })
      return
    }

    if (isLoginEvent) {
      setLastSyncedState(state)
    }

    if (hasMergedCloudRef.current && !isMergeUpdate) {
      const currentHash = computeResumeHash(state.resumes)
      const syncedHash = computeResumeHash(lastSyncedState.resumes)
      const nextStatus = currentHash !== syncedHash ? 'unsaved' : 'synced'
      queueMicrotask(() => setCloudStatus(nextStatus))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user?.id, lastSyncedState])

  const saveChangesToCloud = useCallback(async () => {
    if (!user) return
    const currentState = stateRef.current
    setIsSaving(true)
    setCloudStatus('syncing')
    setCloudError(null)
    try {
      await syncToCloud(Object.values(currentState.resumes), user.id)
      setLastSyncedState(currentState)
      setCloudStatus('synced')
      setCloudError(null)
      hasMergedCloudRef.current = true
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
  }, [user, syncToCloud, showToast])

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

  const discardChanges = useCallback(() => {
    if (window.confirm('Are you sure you want to discard all unsaved changes for this session? This will revert your resume to the last saved cloud version.')) {
      const latest = lastSyncedStateRef.current
      setState(latest)
      localStorage.setItem('seve_state', JSON.stringify(latest))
      showToast('Changes discarded', 'info')
    }
  }, [setState, showToast])

  const hasUnsavedChanges = useMemo(() => {
    if (!user) return false
    return computeResumeHash(state.resumes) !== computeResumeHash(lastSyncedState.resumes)
  }, [state.resumes, lastSyncedState.resumes, user, computeResumeHash])

  const value = useMemo((): ResumeContextType => ({
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
    deleteResume: (id: string) => deleteResume(id),
    updateActiveResume,
    updateStylePrefs,
    updateResumeData,
    updateSectionOrder,
    importResumeData,
    retrySync,
    undo,
    redo,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    saveChangesToCloud,
    discardChanges,
    restoreFromBackup,
  }), [
    state.resumes, state.selectedResumeId,
    activeResume, resumeData, selectedTemplate, jobDescription, sectionOrder,
    isSaving, cloudStatus, cloudError,
    selectResume, createResume, duplicateResume, renameResume, deleteResume,
    updateActiveResume, updateStylePrefs, updateResumeData, updateSectionOrder, importResumeData,
    retrySync, undo, redo, canUndo, canRedo,
    hasUnsavedChanges, saveChangesToCloud, discardChanges, restoreFromBackup,
  ])

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  )
}
