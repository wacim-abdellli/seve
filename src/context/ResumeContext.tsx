import { type ReactNode } from 'react'
import { ResumeDataProvider } from './ResumeDataContext'
import { ResumeSyncProvider } from './ResumeSyncContext'

export function ResumeProvider({ children }: { children: ReactNode }) {
  return (
    <ResumeDataProvider>
      <ResumeSyncProvider>
        {children}
      </ResumeSyncProvider>
    </ResumeDataProvider>
  )
}
