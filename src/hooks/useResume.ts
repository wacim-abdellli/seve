import { useContext } from 'react'
import { ResumeContext, type ResumeContextType } from '../context/resumeContextDef'

export function useResume(): ResumeContextType {
  const ctx = useContext(ResumeContext)
  if (!ctx) {
    throw new Error('useResume must be used within a ResumeProvider')
  }
  return ctx
}
