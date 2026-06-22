import { lazy, Suspense, useMemo } from 'react'
import type { ResumeData } from '../types/resume'
import ErrorBoundary from './ErrorBoundary'

interface TemplateProps {
  data: ResumeData
  activeSection?: string | null
  atsMode?: boolean
  onEditSection?: (section: string) => void
  sectionOrder?: string[]
  onDragStart?: (e: React.DragEvent, sectionId: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (sectionId: string) => void
  themeColor?: string
}

interface TemplateRendererProps extends TemplateProps {
  type: string
}

const TEMPLATES: Record<string, ReturnType<typeof lazy>> = {
  classic: lazy(() => import('./templates/ClassicTemplate')),
  modern: lazy(() => import('./templates/ModernTemplate')),
  executive: lazy(() => import('./templates/ExecutiveTemplate')),
  minimalist: lazy(() => import('./templates/MinimalistTemplate')),
  creative: lazy(() => import('./templates/CreativeTemplate')),
  compact: lazy(() => import('./templates/CompactTemplate')),
  professional: lazy(() => import('./templates/ProfessionalTemplate')),
  technical: lazy(() => import('./templates/TechnicalTemplate')),
  academic: lazy(() => import('./templates/AcademicTemplate')),
  clean: lazy(() => import('./templates/CleanTemplate')),
}

export default function TemplateRenderer({ type, ...props }: TemplateRendererProps) {
  const Template = useMemo(() => TEMPLATES[type], [type])
  if (!Template) return null

  return (
    <ErrorBoundary fallback={<div className="p-8 text-center text-zinc-400 text-sm">This template encountered an error and could not be displayed.</div>}>
      <Suspense fallback={<div className="p-8 text-center text-zinc-400 text-sm">Loading template...</div>}>
        <Template {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}
