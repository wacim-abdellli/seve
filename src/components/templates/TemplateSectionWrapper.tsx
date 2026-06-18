import type { ReactNode } from 'react'
import PreviewSectionWrapper from '../PreviewSectionWrapper'

interface TemplateSectionWrapperProps {
  sectionId: string
  activeSection?: string | null
  atsMode?: boolean
  atsRating: string
  atsFeedback: string | undefined
  onEdit?: (section: string) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: () => void
  heading: string
  headingClass?: string
  accentClass?: string
  children: ReactNode
}

export default function TemplateSectionWrapper({
  sectionId,
  activeSection,
  atsMode,
  atsRating,
  atsFeedback,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  heading,
  headingClass = '',
  accentClass = '',
  children,
}: TemplateSectionWrapperProps) {
  return (
    <PreviewSectionWrapper
      sectionId={sectionId}
      activeSection={activeSection}
      atsMode={atsMode}
      atsRating={atsRating}
      atsFeedback={atsFeedback}
      onEdit={onEdit}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="mb-5">
        {accentClass && <div className={accentClass} />}
        <h2 className={headingClass}>
          {heading}
        </h2>
        {children}
      </div>
    </PreviewSectionWrapper>
  )
}
