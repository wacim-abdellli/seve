import { createContext } from 'react'
import type { AppState, ResumeData, ResumeProfile, ResumeStylePreferences, Template } from '../types/resume'
import type { CloudStatus } from './ResumeContext'

export interface ResumeContextType {
  resumes: Record<string, ResumeProfile>
  selectedResumeId: string
  activeResume: ResumeProfile
  resumeData: ResumeData
  selectedTemplate: Template
  jobDescription: string
  sectionOrder: string[]
  isSaving: boolean
  cloudStatus: CloudStatus
  cloudError: string | null
  selectResume: (id: string) => void
  createResume: (title: string) => void
  duplicateResume: (id: string) => void
  renameResume: (id: string, newTitle: string) => void
  deleteResume: (id: string) => void
  updateResumeData: (data: ResumeData) => void
  updateActiveResume: (updater: (prev: ResumeProfile) => ResumeProfile) => void
  updateStylePrefs: (updater: (prev: ResumeStylePreferences) => ResumeStylePreferences) => void
  updateSectionOrder: (newOrder: string[]) => void
  importResumeData: (data: ResumeData) => void
  retrySync: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  hasUnsavedChanges: boolean
  saveChangesToCloud: () => Promise<void>
  discardChanges: () => void
  restoreFromBackup: (backup: AppState) => void
}

export const ResumeContext = createContext<ResumeContextType | undefined>(undefined)
