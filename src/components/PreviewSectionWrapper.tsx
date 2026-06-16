import React, { useState, useEffect, useRef, useMemo } from 'react'
import { FileEdit, Info, GripVertical } from 'lucide-react'

interface PreviewSectionWrapperProps {
  sectionId: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects'
  activeSection?: string | null
  atsMode?: boolean
  atsRating?: 'safe' | 'warning' | 'danger'
  atsFeedback?: string
  onEdit?: (section: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects') => void
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  children: React.ReactNode
}

function getChildrenText(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return children.toString()
  }
  if (Array.isArray(children)) {
    return children.map(getChildrenText).join('')
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode }
    return getChildrenText(props.children)
  }
  return ''
}

export default function PreviewSectionWrapper({
  sectionId,
  activeSection,
  atsMode,
  atsRating = 'safe',
  atsFeedback = '',
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  children
}: PreviewSectionWrapperProps) {
  const isActive = activeSection === sectionId
  const [ripple, setRipple] = useState(false)

  const textContent = useMemo(() => getChildrenText(children), [children])
  const prevTextContentRef = useRef(textContent)

  useEffect(() => {
    // If the text content has changed from the initial value (or previous edit), ripple
    if (prevTextContentRef.current !== textContent) {
      setRipple(true)
      const t = setTimeout(() => setRipple(false), 800)
      prevTextContentRef.current = textContent
      return () => clearTimeout(t)
    }
  }, [textContent])

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) onEdit(sectionId)
  }

  const isDraggable = !atsMode && sectionId !== 'contact'

  return (
    <div 
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`preview-section ${ripple ? 'animate-ripple' : ''}`}
      style={{
        borderLeft: isActive ? '2px solid rgba(251,146,60,0.6)' : '2px solid transparent',
        backgroundColor: isActive ? 'rgba(251,146,60,0.03)' : undefined,
        paddingLeft: isActive ? '8px' : undefined,
        transition: 'all 150ms ease-in-out'
      }}
      onClick={handleEditClick}
    >
      {/* Rule 7: Tiny active pill badge in top-right corner of the section */}
      {isActive && (
        <div className="absolute top-1.5 right-1.5 z-30 no-print text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded px-1.5 py-0.5 uppercase font-bold tracking-wider pointer-events-none">
          {sectionId}
        </div>
      )}

      {/* Floating Controls Rail (Left margin outside page boundaries) */}
      <div 
        className="floating-rail no-print"
        style={{
          opacity: isActive ? 1 : undefined,
          pointerEvents: isActive ? 'auto' : undefined,
          transform: isActive ? 'translateY(-50%) translateX(0) scale(1)' : undefined
        }}
      >
        {/* Compact Tooltip Label REMOVED to prevent duplication & visual noise */}

        {/* Drag Handle */}
        {isDraggable && (
          <div 
            className="is-flex is-align-items-center is-justify-content-center"
            style={{ 
              width: 24, 
              height: 24, 
              borderRadius: 6, 
              background: '#12131a', 
              border: '1px solid var(--bulma-border)', 
              color: 'var(--bulma-text-weak)', 
              cursor: 'grab' 
            }}
          >
            <GripVertical size={14} />
          </div>
        )}

        {/* Edit Action Button */}
        {!atsMode && (
          <button
            onClick={handleEditClick}
            className="button is-small is-primary"
            style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={`Edit ${sectionId}`}
          >
            <FileEdit size={12} />
          </button>
        )}
      </div>
      
      {children}

      {/* ATS View Heatmap Overlay */}
      {atsMode && (
        <div 
          className="is-flex is-flex-direction-column is-justify-content-start is-align-items-end"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            borderRadius: 8,
            pointerEvents: 'none',
            border: atsRating === 'safe' ? '2px dashed #10b981' : atsRating === 'warning' ? '2px dashed #f59e0b' : '2px dashed #ef4444',
            backgroundColor: atsRating === 'safe' ? 'rgba(16, 185, 129, 0.03)' : atsRating === 'warning' ? 'rgba(245, 158, 11, 0.03)' : 'rgba(239, 68, 68, 0.03)',
            padding: '0.375rem'
          }}
        >
          <div className="is-flex is-align-items-center" style={{ gap: '0.25rem', opacity: 0.9, pointerEvents: 'auto', position: 'relative', zIndex: 20 }}>
            <span 
              className={`tag is-small ${atsRating === 'safe' ? 'is-success' : atsRating === 'warning' ? 'is-warning' : 'is-danger'}`}
              style={{ fontWeight: 'bold', display: 'inline-flex', gap: '0.25rem', cursor: 'help' }}
              title={atsFeedback}
            >
              <Info size={10} />
              {atsRating}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
