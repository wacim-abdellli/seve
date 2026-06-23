import type { ResumeData } from '../types/resume'
import ErrorBoundary from './ErrorBoundary'

import ClassicTemplate from './templates/ClassicTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutiveTemplate from './templates/ExecutiveTemplate'
import MinimalistTemplate from './templates/MinimalistTemplate'
import CreativeTemplate from './templates/CreativeTemplate'
import CompactTemplate from './templates/CompactTemplate'
import ProfessionalTemplate from './templates/ProfessionalTemplate'
import TechnicalTemplate from './templates/TechnicalTemplate'
import AcademicTemplate from './templates/AcademicTemplate'
import CleanTemplate from './templates/CleanTemplate'

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

const TEMPLATES: Record<string, React.ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  executive: ExecutiveTemplate,
  minimalist: MinimalistTemplate,
  creative: CreativeTemplate,
  compact: CompactTemplate,
  professional: ProfessionalTemplate,
  technical: TechnicalTemplate,
  academic: AcademicTemplate,
  clean: CleanTemplate,
}

export default function TemplateRenderer({ type, ...props }: TemplateRendererProps) {
  const Template = TEMPLATES[type]
  if (!Template) return null

  return (
    <ErrorBoundary fallback={<div className="p-8 text-center text-zinc-400 text-sm">This template encountered an error and could not be displayed.</div>}>
      <Template {...props} />
    </ErrorBoundary>
  )
}
