import { createContext } from 'react'
import type { ResumeData, ResumeProfile, Template } from '../types/resume'

export interface ResumeContextType {
  resumes: Record<string, ResumeProfile>
  selectedResumeId: string
  activeResume: ResumeProfile
  resumeData: ResumeData
  selectedTemplate: Template
  jobDescription: string
  isSaving: boolean
  selectResume: (id: string) => void
  createResume: (title: string) => void
  duplicateResume: (id: string) => void
  renameResume: (id: string, newTitle: string) => void
  deleteResume: (id: string) => void
  updateResumeData: (data: ResumeData) => void
  updateActiveResume: (updater: (prev: ResumeProfile) => ResumeProfile) => void
  importResumeData: (data: ResumeData) => void
}

export const ResumeContext = createContext<ResumeContextType | undefined>(undefined)
