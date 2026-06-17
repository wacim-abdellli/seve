import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import type { ResumeData, ResumeProfile, AppState } from '../types/resume'
import { ResumeContext } from './resumeContextDef'

const LOCAL_STORAGE_KEY = 'seve_state'
const defaultResumeId = 'default-resume'

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

function createDefaultResume(): ResumeProfile {
  return {
    id: defaultResumeId,
    title: 'My Resume',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resumeData: { ...INITIAL_RESUME_DATA },
    selectedTemplate: 'classic',
    jobDescription: '',
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
        return {
          resumes: parsed.resumes,
          selectedResumeId: parsed.selectedResumeId,
        }
      } else if (parsed.resumeData) {
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



export function ResumeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadInitialState)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setIsSaving(true))
    const handler = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
      setIsSaving(false)
    }, 500)
    return () => clearTimeout(handler)
  }, [state])

  const activeResumeId = state.selectedResumeId
  const activeResume = state.resumes[activeResumeId] || Object.values(state.resumes)[0] || createDefaultResume()
  const resumeData = activeResume.resumeData
  const selectedTemplate = activeResume.selectedTemplate
  const jobDescription = activeResume.jobDescription

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

  const importResumeData = useCallback((data: ResumeData) => {
    updateActiveResume(prev => ({ ...prev, resumeData: data }))
  }, [updateActiveResume])

  const value = useMemo(() => ({
    resumes: state.resumes,
    selectedResumeId: state.selectedResumeId,
    activeResume,
    resumeData,
    selectedTemplate,
    jobDescription,
    isSaving,
    selectResume,
    createResume,
    duplicateResume,
    renameResume,
    deleteResume,
    updateActiveResume,
    updateResumeData,
    importResumeData,
  }), [
    state.resumes, state.selectedResumeId, activeResume, resumeData,
    selectedTemplate, jobDescription, isSaving, selectResume,
    createResume, duplicateResume, renameResume, deleteResume,
    updateActiveResume, updateResumeData, importResumeData,
  ])

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  )
}


