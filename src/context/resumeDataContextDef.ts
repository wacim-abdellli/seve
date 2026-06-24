import { createContext, useContext } from 'react'
import type { AppState, ResumeData, ResumeProfile, ResumeStylePreferences, Template } from '../types/resume'

export interface ResumeDataContextType {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  activeResume: ResumeProfile
  resumeData: ResumeData
  selectedTemplate: Template
  jobDescription: string
  sectionOrder: string[]
  selectResume: (id: string) => void
  createResume: (title: string) => void
  duplicateResume: (id: string) => void
  renameResume: (id: string, newTitle: string) => void
  deleteResume: (id: string) => Promise<void>
  updateResumeData: (data: ResumeData) => void
  updateActiveResume: (updater: (prev: ResumeProfile) => ResumeProfile) => void
  updateSectionOrder: (newOrder: string[]) => void
  importResumeData: (data: ResumeData) => void
  updateStylePrefs: (updater: (prev: ResumeStylePreferences) => ResumeStylePreferences) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  computeResumeHash: (resumes: AppState['resumes']) => string
  restoreFromBackup: (backup: AppState) => void
}

const ResumeDataContextInternal = createContext<ResumeDataContextType | undefined>(undefined)

export function useResumeDataContext(): ResumeDataContextType {
  const ctx = useContext(ResumeDataContextInternal)
  if (!ctx) throw new Error('useResumeDataContext must be used within ResumeDataProvider')
  return ctx
}

export default ResumeDataContextInternal
