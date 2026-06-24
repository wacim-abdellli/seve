import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { ResumeData, ResumeProfile, ResumeStylePreferences, AppState, Template } from '../types/resume'
import { DEFAULT_STYLE_PREFS } from '../types/resume'
import { clearResumeTextCache } from '../utils/atsUtils'
import { DEFAULT_SECTION_ORDER } from './constants'
import ResumeDataContextInternal from './resumeDataContextDef'

const LOCAL_STORAGE_KEY = 'seve_state'
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

function sanitizeResumeData(raw: Record<string, unknown> | null): ResumeData {
  const contact = (raw?.contact as Record<string, unknown> | undefined) || {}
  return {
    contact: {
      fullName: typeof contact.fullName === 'string' ? contact.fullName : '',
      email: typeof contact.email === 'string' ? contact.email : '',
      phone: typeof contact.phone === 'string' ? contact.phone : '',
      linkedin: typeof contact.linkedin === 'string' ? contact.linkedin : '',
      location: typeof contact.location === 'string' ? contact.location : '',
      website: typeof contact.website === 'string' ? contact.website : '',
    },
    summary: typeof raw?.summary === 'string' ? raw.summary : '',
    experience: Array.isArray(raw?.experience) ? raw.experience : [],
    education: Array.isArray(raw?.education) ? raw.education : [],
    skills: Array.isArray(raw?.skills) ? raw.skills : [],
    languages: Array.isArray(raw?.languages) ? raw.languages : [],
    projects: Array.isArray(raw?.projects) ? raw.projects : [],
    awards: Array.isArray(raw?.awards) ? raw.awards : [],
    certifications: Array.isArray(raw?.certifications) ? raw.certifications : [],
    interests: Array.isArray(raw?.interests) ? raw.interests : [],
    publications: Array.isArray(raw?.publications) ? raw.publications : [],
    references: Array.isArray(raw?.references) ? raw.references : [],
    volunteer: Array.isArray(raw?.volunteer) ? raw.volunteer : [],
  }
}

function createDefaultResume(): ResumeProfile {
  return {
    id: defaultResumeId,
    title: 'My Resume',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resumeData: sanitizeResumeData(null),
    selectedTemplate: 'classic',
    jobDescription: '',
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    themeColor: '#b91c1c',
    templateFontSize: 10,
    templateFontWeight: 400,
    stylePrefs: { ...DEFAULT_STYLE_PREFS },
    revision: 1,
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
        const migratedResumes: typeof parsed.resumes = {}
        let migratedSelectedId = parsed.selectedResumeId

        for (const [id, resume] of Object.entries(parsed.resumes)) {
          const newId = id === 'default-resume' ? defaultResumeId : id
          const raw = resume as Record<string, unknown>
          migratedResumes[newId] = {
            id: newId,
            title: typeof raw.title === 'string' ? raw.title : 'Untitled',
            createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
            updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
            revision: typeof raw.revision === 'number' ? (raw.revision as number) : 1,
            resumeData: sanitizeResumeData(raw.resumeData),
            selectedTemplate: (typeof raw.selectedTemplate === 'string' ? raw.selectedTemplate : 'classic') as Template,
            jobDescription: typeof raw.jobDescription === 'string' ? raw.jobDescription : '',
            sectionOrder: Array.isArray(raw.sectionOrder) ? raw.sectionOrder : [...DEFAULT_SECTION_ORDER],
            themeColor: typeof raw.themeColor === 'string' ? raw.themeColor : '#b91c1c',
            templateFontSize: typeof raw.templateFontSize === 'number' ? raw.templateFontSize : 10,
            templateFontWeight: typeof raw.templateFontWeight === 'number' ? raw.templateFontWeight : 400,
            stylePrefs: raw.stylePrefs && typeof raw.stylePrefs === 'object'
              ? { ...DEFAULT_STYLE_PREFS, ...(raw.stylePrefs as Record<string, unknown>) }
              : { ...DEFAULT_STYLE_PREFS },
          }
          if (parsed.selectedResumeId === id) migratedSelectedId = newId
        }

        return {
          resumes: migratedResumes,
          selectedResumeId: migratedSelectedId,
        }
      } else if (parsed.resumeData) {
        let sectionOrder = parsed.sectionOrder
        if (!sectionOrder) {
          const savedOrder = localStorage.getItem('seve_section_order') || localStorage.getItem('resumeai_section_order')
          if (savedOrder) { try { const p = JSON.parse(savedOrder); if (Array.isArray(p) && p.length > 0) sectionOrder = p } catch { /* ignore */ } }
        }
        return {
          resumes: {
            [defaultResumeId]: {
              id: defaultResumeId,
              title: 'My Resume',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              resumeData: sanitizeResumeData(parsed.resumeData),
              selectedTemplate: (parsed.selectedTemplate as Template) || 'classic' as Template,
              jobDescription: parsed.jobDescription || '',
              sectionOrder: sectionOrder || [...DEFAULT_SECTION_ORDER],
              themeColor: typeof parsed.themeColor === 'string' ? parsed.themeColor : '#b91c1c',
              templateFontSize: typeof parsed.templateFontSize === 'number' ? parsed.templateFontSize : 10,
              templateFontWeight: typeof parsed.templateFontWeight === 'number' ? parsed.templateFontWeight : 400,
              stylePrefs: parsed.stylePrefs && typeof parsed.stylePrefs === 'object'
                ? { ...DEFAULT_STYLE_PREFS, ...(parsed.stylePrefs as Record<string, unknown>) }
                : { ...DEFAULT_STYLE_PREFS },
              revision: 1,
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

export function ResumeDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadInitialState)

  const activeResumeId = state.selectedResumeId
  const activeResume = useMemo(() => state.resumes[activeResumeId] || Object.values(state.resumes)[0] || createDefaultResume(), [state.resumes, activeResumeId])
  const resumeData = activeResume.resumeData
  const selectedTemplate = activeResume.selectedTemplate
  const jobDescription = activeResume.jobDescription
  const sectionOrder = activeResume.sectionOrder

  const historyRef = useRef<ResumeData[]>([resumeData])
  const historyIndexRef = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const pushHistory = useCallback((data: ResumeData) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(data)
    if (historyRef.current.length > 30) {
      historyRef.current.shift()
      historyIndexRef.current = Math.min(historyIndexRef.current, historyRef.current.length - 1)
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

  const prevResumeIdRef = useRef(activeResume?.id)
  const resumeDataRef = useRef(resumeData)

  useEffect(() => {
    resumeDataRef.current = resumeData
    if (prevResumeIdRef.current !== activeResume?.id) {
      prevResumeIdRef.current = activeResume?.id
      historyRef.current = [resumeDataRef.current]
      historyIndexRef.current = 0
      setCanUndo(false)
      setCanRedo(false)
    }
  }, [activeResume?.id, resumeData])

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
    clearResumeTextCache()
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
          [updated.id]: { ...updated, updatedAt: new Date().toISOString(), revision: active.revision + 1 },
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
          themeColor: '#b91c1c',
          templateFontSize: 10,
          templateFontWeight: 400,
          stylePrefs: { ...DEFAULT_STYLE_PREFS },
          revision: 1,
        },
      },
      selectedResumeId: newId,
    }))
  }, [])

  const duplicateResume = useCallback((id: string) => {
    clearResumeTextCache()
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
            revision: 1,
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
          [id]: { ...target, title: newTitle, updatedAt: new Date().toISOString(), revision: target.revision + 1 },
        },
      }
    })
  }, [])

  const deleteResume = useCallback(async (id: string) => {
    clearResumeTextCache()
    setState(prev => {
      const next = { ...prev.resumes }
      delete next[id]
      if (Object.keys(next).length === 0) {
        const defaultId = crypto.randomUUID()
        const defaultProfile: ResumeProfile = {
          id: defaultId,
          title: 'My Resume',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resumeData: sanitizeResumeData(null),
          selectedTemplate: 'classic',
          jobDescription: '',
          sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills'],
          themeColor: '#b91c1c',
          templateFontSize: 10,
          templateFontWeight: 400,
          stylePrefs: { ...DEFAULT_STYLE_PREFS },
          revision: 1,
        }
        return { ...prev, resumes: { [defaultId]: defaultProfile }, selectedResumeId: defaultId }
      }
      const nextSelectedId = prev.selectedResumeId === id
        ? (Object.keys(next)[0] || '')
        : prev.selectedResumeId
      return { ...prev, resumes: next, selectedResumeId: nextSelectedId }
    })
  }, [])

  const updateResumeData = useCallback((data: ResumeData) => {
    clearResumeTextCache()
    const sanitized = sanitizeResumeData(data)
    pushHistory(sanitized)
    updateActiveResume(prev => ({ ...prev, resumeData: sanitized }))
  }, [pushHistory, updateActiveResume])

  const updateSectionOrder = useCallback((newOrder: string[]) => {
    updateActiveResume(prev => ({ ...prev, sectionOrder: newOrder }))
  }, [updateActiveResume])

  const importResumeData = useCallback((data: ResumeData) => {
    clearResumeTextCache()
    const sanitized = sanitizeResumeData(data)
    pushHistory(sanitized)
    updateActiveResume(prev => ({ ...prev, resumeData: sanitized }))
  }, [pushHistory, updateActiveResume])

  const updateStylePrefs = useCallback((updater: (prev: ResumeStylePreferences) => ResumeStylePreferences) => {
    updateActiveResume(prev => ({
      ...prev,
      stylePrefs: updater(prev.stylePrefs || { ...DEFAULT_STYLE_PREFS }),
    }))
  }, [updateActiveResume])

  const restoreFromBackup = useCallback((backup: AppState) => {
    clearResumeTextCache()
    setState(backup)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(backup))
    const active = backup.resumes[backup.selectedResumeId]
    if (active) {
      historyRef.current = [active.resumeData]
      historyIndexRef.current = 0
      const timer = setTimeout(() => { setCanUndo(false); setCanRedo(false) })
      return () => clearTimeout(timer)
    }
  }, [])

  const computeResumeHash = useCallback((resumes: AppState['resumes']): string => {
    let hash = 0
    for (const id of Object.keys(resumes).sort()) {
      const r = resumes[id]
      const content = `${r.updatedAt}|${r.revision}|${JSON.stringify(r.resumeData)}`
      for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0
      }
    }
    return hash.toString(36)
  }, [])

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
    }, 500)
    return () => clearTimeout(persistTimerRef.current)
  }, [state])

  const value = useMemo(() => ({
    state,
    setState,
    activeResume,
    resumeData,
    selectedTemplate,
    jobDescription,
    sectionOrder,
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
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    computeResumeHash,
    restoreFromBackup,
  }), [
    state,
    activeResume, resumeData, selectedTemplate, jobDescription, sectionOrder,
    selectResume, createResume, duplicateResume, renameResume, deleteResume,
    updateActiveResume, updateStylePrefs, updateResumeData, updateSectionOrder, importResumeData,
    handleUndo, handleRedo, canUndo, canRedo, computeResumeHash, restoreFromBackup,
  ])

  return (
    <ResumeDataContextInternal.Provider value={value}>
      {children}
    </ResumeDataContextInternal.Provider>
  )
}
