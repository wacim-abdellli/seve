import { useState, useEffect, useRef, useCallback } from 'react'
import type { ResumeData, ResumeStylePreferences, Template } from '../types/resume'
import { stylePrefsToCssVars } from '../utils/stylePrefsToCssVars'

import TemplateRenderer from './TemplateRenderer'
import { SectionReorderProvider } from './PreviewSectionWrapper'
import { useToast } from '../hooks/useToast'
import { 
  Sparkles, 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  ZoomIn, 
  ZoomOut, 
  Grid3x3,
  Download,
  Minimize2,
  UploadCloud
} from 'lucide-react'

interface ResumePreviewProps {
  resumeData: ResumeData
  selectedTemplate: Template
  onChangeTemplate?: (template: Template) => void
  activeSection?: string | null
  onEditSection?: (section: string) => void
  onExportPdf?: () => void
  onPageCountChange?: (count: number) => void
  sectionOrder?: string[]
  onSectionOrderChange?: (order: string[]) => void
  templateFontSize: number
  onChangeFontSize: (size: number) => void
  templateFontWeight: number
  onChangeFontWeight: (weight: number) => void
  themeColor: string
  onChangeColor?: (color: string) => void
  stylePrefs?: ResumeStylePreferences
  onTriggerImport?: () => void
}

export const templatesList: { id: Template; label: string; colorDot: string }[] = [
  { id: 'classic', label: 'Classic', colorDot: 'bg-zinc-400' },
  { id: 'modern', label: 'Modern', colorDot: 'bg-blue-500' },
  { id: 'executive', label: 'Executive', colorDot: 'bg-amber-500' },
  { id: 'minimalist', label: 'Minimalist', colorDot: 'bg-teal-500' },
  { id: 'creative', label: 'Creative', colorDot: 'bg-rose-500' },
  { id: 'compact', label: 'Compact', colorDot: 'bg-sky-500' },
  { id: 'professional', label: 'Professional', colorDot: 'bg-slate-600' },
  { id: 'technical', label: 'Technical', colorDot: 'bg-emerald-500' },
  { id: 'academic', label: 'Academic', colorDot: 'bg-violet-500' },
  { id: 'clean', label: 'Clean', colorDot: 'bg-teal-400' },
]

type SectionKey = string

export const themeColors = [
  { value: '#e11d48', label: 'Crimson', bgClass: 'bg-rose-500' },
  { value: '#7c3aed', label: 'Violet', bgClass: 'bg-violet-500' },
  { value: '#2563eb', label: 'Royal Blue', bgClass: 'bg-blue-600' },
  { value: '#0f766e', label: 'Teal/Emerald', bgClass: 'bg-teal-700' },
  { value: '#b45309', label: 'Bronze/Amber', bgClass: 'bg-amber-700' },
  { value: '#334155', label: 'Graphite', bgClass: 'bg-slate-600' },
]

export default function ResumePreview({ 
  resumeData, 
  selectedTemplate,
  activeSection,
  onEditSection,
  onExportPdf,
  onPageCountChange,
  sectionOrder: propsSectionOrder,
  onSectionOrderChange,
  templateFontSize,
  onChangeFontSize,
  templateFontWeight,
  themeColor,
  stylePrefs,
  onTriggerImport
}: ResumePreviewProps) {
  const { showToast } = useToast()
  const [atsMode, setAtsMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isManualZoom, setIsManualZoom] = useState(false)
  const isManualZoomRef = useRef(false)
  
  useEffect(() => {
    isManualZoomRef.current = isManualZoom
  }, [isManualZoom])

  const lastWindowWidthRef = useRef(window.innerWidth)
  const [contentHeight, setContentHeight] = useState(1123)
  const [showGuides, setShowGuides] = useState(false)
  const [pageCount, setPageCount] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const handleResize = () => {
      if (!containerRef.current) return
      
      const currentWindowWidth = window.innerWidth
      const windowResized = currentWindowWidth !== lastWindowWidthRef.current
      lastWindowWidthRef.current = currentWindowWidth
      
      if (windowResized) {
        setIsManualZoom(false)
      } else if (isManualZoomRef.current) {
        return
      }

      const containerWidth = containerRef.current.clientWidth
      const isMobile = window.innerWidth < 640
      const padding = isMobile ? 16 : 112 // 8px margin buffer on mobile, 56px on desktop
      const availableWidth = containerWidth - padding
      if (availableWidth > 0 && availableWidth < 794) {
        const computedZoom = Number((availableWidth / 794).toFixed(2))
        setZoom(Math.max(0.25, Math.min(1, computedZoom)))
      } else {
        setZoom(1)
      }
    }

    handleResize()

    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const A4_PX = 1122
  const A4_SCREEN_THRESHOLD = 1122
  // Tracks vertical padding (top + bottom) added by templates' .resume-page div.
  // This padding does NOT scale with font-size, so fit math must exclude it.
  const TEMPLATE_VERTICAL_PADDING = 96
  const resumeContentRef = useRef<HTMLDivElement>(null)

  const onPageCountChangeRef = useRef(onPageCountChange)
  useEffect(() => {
    onPageCountChangeRef.current = onPageCountChange
  }, [onPageCountChange])

  const measurePageCount = useCallback(() => {
    if (!resumeContentRef.current) return

    const pageEls = resumeContentRef.current.querySelectorAll('.resume-page')

    let height = 0
    if (pageEls.length > 0) {
      pageEls.forEach((el) => {
        height += el.scrollHeight
      })
      height += (pageEls.length - 1) * 32 // Add gap margins between pages
    } else {
      const measureTarget =
        resumeContentRef.current.querySelector('.resume-template-wrapper') ??
        resumeContentRef.current
      height = measureTarget.scrollHeight
    }
    setContentHeight(height)

    if (pageEls.length > 1) {
      const count = pageEls.length
      setPageCount(count)
      if (onPageCountChangeRef.current) onPageCountChangeRef.current(count)
      return
    }

    const pages = Math.max(1, Math.ceil(height / A4_SCREEN_THRESHOLD))
    setPageCount(pages)
    if (onPageCountChangeRef.current) onPageCountChangeRef.current(pages)
  }, [])

  useEffect(() => {
    measurePageCount()

    const observer = new ResizeObserver(measurePageCount)
    if (resumeContentRef.current) {
      observer.observe(resumeContentRef.current)
    }
    return () => observer.disconnect()
  }, [resumeData, selectedTemplate, templateFontSize, measurePageCount])

  const fitToOnePage = () => {
    if (!resumeContentRef.current) return
    const contentEl = resumeContentRef.current.querySelector('.resume-template-wrapper')
    const scrollHeight = contentEl ? contentEl.scrollHeight : resumeContentRef.current.scrollHeight

    // Reset to default if it naturally fits (or user called it accidentally)
    if (scrollHeight <= A4_PX) {
      onChangeFontSize(10)
      showToast('Resume naturally fits on 1 page', 'success')
      return
    }

    // Padding doesn't scale with font-size, so compute content-only height
    const contentHeight = scrollHeight - TEMPLATE_VERTICAL_PADDING
    const targetContentArea = A4_PX - TEMPLATE_VERTICAL_PADDING // 1026px
    const scale = targetContentArea / contentHeight
    const targetFontSize = Math.floor(10 * scale * 10) / 10
    const MIN_FONT_SIZE = 8.5

    const newFontSize = Math.max(MIN_FONT_SIZE, targetFontSize)
    onChangeFontSize(newFontSize)

    // Double rAF to wait for font-size CSS to paint before re-measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measurePageCount()
      })
    })

    if (targetFontSize < MIN_FONT_SIZE) {
      showToast(`Font minimized to ${MIN_FONT_SIZE}pt, but content is still too long for 1 page.`, 'warning')
    } else {
      showToast(`Font adjusted to ${newFontSize}pt to fit 1 page`, 'success')
    }
  }

  // Section Order — comes from context via props
  const activeSectionKeys: SectionKey[] = [
    'summary', 'experience', 'projects', 'education', 'skills',
    'languages', 'awards', 'certifications', 'publications', 'volunteer',
    'interests', 'references'
  ]
  const sectionsWithData = activeSectionKeys.filter(key => {
    if (key === 'summary') return resumeData.summary && resumeData.summary.trim() !== ''
    if (key === 'skills') return resumeData.skills && resumeData.skills.length > 0
    const val = resumeData[key as keyof ResumeData]
    return Array.isArray(val) && val.length > 0
  })

  const sectionOrder = [...(propsSectionOrder || [])]
  sectionsWithData.forEach(sec => {
    if (!sectionOrder.includes(sec)) {
      sectionOrder.push(sec)
    }
  })

  const [draggedSectionId, setDraggedSectionId] = useState<SectionKey | null>(null)

  // Check if resume is completely empty
  const isEmpty = 
    !resumeData.contact.fullName.trim() &&
    !resumeData.summary.trim() &&
    (!resumeData.experience || resumeData.experience.length === 0) &&
    (!resumeData.education || resumeData.education.length === 0) &&
    (!resumeData.skills || resumeData.skills.length === 0)

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, sectionId: SectionKey) => {
    setDraggedSectionId(sectionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetSectionId: SectionKey) => {
    if (draggedSectionId === null || draggedSectionId === targetSectionId) return
    const updated = [...sectionOrder]
    const draggedIdx = updated.indexOf(draggedSectionId)
    const targetIdx = updated.indexOf(targetSectionId)

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const [removed] = updated.splice(draggedIdx, 1)
      updated.splice(targetIdx, 0, removed)
      if (onSectionOrderChange) {
        onSectionOrderChange(updated)
      }
    }
    setDraggedSectionId(null)
  }

  const handleMoveSection = (sectionId: SectionKey, direction: 'up' | 'down') => {
    const idx = sectionOrder.indexOf(sectionId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sectionOrder.length) return
    const updated = [...sectionOrder]
    ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]
    if (onSectionOrderChange) {
      onSectionOrderChange(updated)
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 select-text relative">
      
      {/* Top Inspector Bar */}
      {!isEmpty && (
        <div className="flex items-center justify-between px-4 h-12 bg-zinc-950 border border-zinc-800 rounded-t-xl no-print select-none relative z-40 w-full animate-fade-in">
          
          {/* LEFT GROUP: Document View Settings */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-0.5 h-8 flex-shrink-0 shadow-sm">
              <button 
                onClick={() => setAtsMode(false)}
                className={`px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer h-full flex items-center ${
                  !atsMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                type="button"
                title="Live view"
                aria-pressed={!atsMode}
              >
                Live
              </button>
              <button 
                onClick={() => setAtsMode(true)}
                className={`px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer h-full flex items-center ${
                  atsMode ? 'bg-zinc-800 text-rose-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                type="button"
                title="ATS heatmap analyzer"
                aria-pressed={atsMode}
              >
                Heatmap
              </button>
              
              <div className="w-px h-3.5 bg-zinc-800/80 mx-1 flex-shrink-0" />
              
              <button 
                onClick={() => setShowGuides(!showGuides)}
                className={`px-2 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center ${
                  showGuides ? 'bg-rose-500/10 text-rose-400' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60'
                }`}
                type="button"
                title="Toggle margins and guides"
                aria-pressed={showGuides}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* CENTER GROUP: Unified Zoom controls */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-0.5 h-8 flex-shrink-0 shadow-sm z-30">
            <button 
              onClick={() => {
                setIsManualZoom(true)
                setZoom(prev => Math.max(0.5, prev - 0.1))
              }}
              className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer h-full"
              type="button"
              title="Zoom out"
              aria-label={`Zoom out. Current: ${Math.round(zoom * 100)}%`}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsManualZoom(false)
                setTimeout(() => {
                  if (containerRef.current) {
                    const containerWidth = containerRef.current.clientWidth
                    const isMobile = window.innerWidth < 640
                    const padding = isMobile ? 16 : 112
                    const availableWidth = containerWidth - padding
                    if (availableWidth > 0 && availableWidth < 794) {
                      const computedZoom = Number((availableWidth / 794).toFixed(2))
                      setZoom(Math.max(0.25, Math.min(1, computedZoom)))
                    } else {
                      setZoom(1)
                    }
                  }
                }, 0)
              }}
              className="text-[11px] text-indigo-400 hover:text-white px-2 min-w-[38px] text-center select-none font-extrabold cursor-pointer hover:bg-zinc-800/50 rounded transition-colors"
              title="Click to reset to Auto-Fit"
              type="button"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button 
              onClick={() => {
                setIsManualZoom(true)
                setZoom(prev => Math.min(1.5, prev + 0.1))
              }}
              className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer h-full"
              type="button"
              title="Zoom in"
              aria-label={`Zoom in. Current: ${Math.round(zoom * 100)}%`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RIGHT GROUP: Style Controls & Actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0 relative z-35">
            {/* Fit to Page Action Button */}
            {pageCount > 1 && (
              <button 
                onClick={fitToOnePage}
                className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center justify-center shadow-sm flex-shrink-0"
                type="button"
                title={`Fit to 1 page (font: ${templateFontSize}pt)`}
                aria-label={`Fit to 1 page. Current font size: ${templateFontSize}pt`}
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-450" />
              </button>
            )}


            {/* Export PDF Button (opens browser print dialog) */}
            {onExportPdf && (
              <>
                <div className="w-px h-4 bg-zinc-800/80 flex-shrink-0 hidden sm:block" />
                <button 
                  onClick={onExportPdf}
                  className="h-8 w-8 sm:w-auto sm:px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center sm:gap-1.5"
                  type="button"
                  title="Open browser print dialog"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Aspect-ratio restricted A4 paper container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#0d0d0f] bg-[radial-gradient(ellipse_at_top,_#1a1a2e_0%,_transparent_60%)] flex items-start justify-center p-2 sm:p-4 md:p-8 print-container relative rounded-b-xl border border-zinc-800/80 shadow-inner"
      >
        {/* Shadow wrapper for depth */}
        <div 
          className="relative transition-all duration-300"
          style={{
            width: zoom < 1 ? `${794 * zoom}px` : '794px',
            height: zoom < 1 ? `${contentHeight * zoom}px` : 'auto',
          }}
        >
          {/* Glow effect behind paper */}
          <div className="absolute inset-0 -m-4 bg-rose-500/5 rounded-3xl blur-2xl pointer-events-none" />

          {/* The actual resume paper */}
          <div 
            id="resume-print-area" 
            ref={resumeContentRef}
            data-resume-preview
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top left', 
              width: '794px',
              position: zoom < 1 ? 'absolute' : 'relative',
              left: 0,
              top: 0,
              '--template-font-size': `${templateFontSize}px`, 
              '--template-font-weight': templateFontWeight,
              '--template-font-weight-thin': Math.max(100, templateFontWeight - 300),
              '--template-font-weight-extralight': Math.max(100, templateFontWeight - 200),
              '--template-font-weight-light': Math.max(200, templateFontWeight - 100),
              '--template-font-weight-medium': Math.min(800, templateFontWeight + 100),
              '--template-font-weight-semibold': Math.min(800, templateFontWeight + 200),
              '--template-font-weight-bold': Math.min(900, templateFontWeight + 300),
              '--template-font-weight-extrabold': Math.min(900, templateFontWeight + 400),
              '--template-font-weight-black': Math.min(900, templateFontWeight + 500),
              '--template-theme-color': themeColor,
              ...(stylePrefs ? stylePrefsToCssVars(stylePrefs) : {}),
            } as React.CSSProperties}
            className={`relative resume-preview bg-transparent text-slate-900 transition-all duration-300 print:shadow-none print:border-none print:p-0 print:w-full print:min-h-0 p-0 cut-style-${stylePrefs?.sectionCutStyle || 'none'} ${stylePrefs?.bodyFont ? 'has-custom-body-font' : ''} ${stylePrefs?.headingFont ? 'has-custom-heading-font' : ''}`}
          >

            {/* Layout Guides Overlay */}
            {showGuides && !isEmpty && (
              <div className="absolute inset-0 pointer-events-none z-50 no-print">
                <div className="absolute border border-dashed border-zinc-400/30" style={{ inset: '10.58mm' }} />
                <div className="absolute top-0 bottom-0 left-1/2 w-px border-r border-dashed border-zinc-400/10" />
                <div className="absolute top-1/2 bottom-0 left-0 right-0 h-px border-b border-dashed border-zinc-400/10" />
                <div className="absolute left-0 right-0 h-px bg-zinc-400/10" style={{ top: '10.58mm' }} />
                <div className="absolute left-0 right-0 h-px bg-zinc-400/10" style={{ bottom: '10.58mm' }} />
              </div>
            )}

            {/* Page Break Indicators (Screen-only) */}
            {!isEmpty && pageCount > 1 && Array.from({ length: pageCount - 1 }).map((_, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500/35 z-40 no-print pointer-events-none flex items-center justify-end pr-8 select-none"
                style={{ top: `${(index + 1) * A4_PX}px`, height: 0 }}
              >
                <span className="text-[8px] font-black text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200 shadow-md tracking-wider uppercase font-sans -translate-y-1/2">
                  Page Break {index + 1} / {index + 2}
                </span>
              </div>
            ))}



          {isEmpty ? (
            /* Premium Visual Empty State Mockup */
            <div className="h-full flex flex-col justify-between py-10 px-8 text-slate-400 font-sans border-2 border-dashed border-slate-200 rounded-lg relative overflow-hidden select-none no-print min-h-[1123px]">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/5 rounded-full blur-2xl" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-red-500/5 rounded-full blur-2xl" />

              {/* Header Mock */}
              <div className="space-y-4 text-center pb-8 border-b border-slate-100">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                  <User className="w-5 h-5 text-red-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-7 w-48 bg-slate-100 rounded-md mx-auto animate-pulse" />
                  <div className="h-3.5 w-64 bg-slate-50 rounded mx-auto" />
                </div>
              </div>

              {/* Body Mock */}
              <div className="flex-1 py-10 space-y-10">
                {/* Summary Mock */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-zinc-400" /> Professional Summary
                  </div>
                  <div className="space-y-2">
                    <div className="h-3.5 w-full bg-slate-100/70 rounded" />
                    <div className="h-3.5 w-[90%] bg-slate-100/70 rounded" />
                    <div className="h-3.5 w-[75%] bg-slate-100/70 rounded" />
                  </div>
                </div>

                {/* Experience Mock */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <Briefcase className="w-4 h-4 text-zinc-400" /> Work History
                  </div>
                  <div className="border-l border-slate-100 pl-4 ml-2 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="h-4 w-36 bg-slate-100 rounded" />
                        <div className="h-3 w-20 bg-slate-50 rounded" />
                      </div>
                      <div className="h-3 w-24 bg-slate-50 rounded" />
                      <div className="space-y-1.5 pt-1.5">
                        <div className="h-3 w-full bg-slate-100/70 rounded" />
                        <div className="h-3 w-[85%] bg-slate-100/70 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Education & Skills Mock */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      <GraduationCap className="w-4 h-4 text-zinc-400" /> Education
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-slate-100 rounded" />
                      <div className="h-3 w-20 bg-slate-50 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      <Wrench className="w-4 h-4 text-zinc-400" /> Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <div className="h-6 w-16 bg-slate-100 rounded-full" />
                      <div className="h-6 w-12 bg-slate-100 rounded-full" />
                      <div className="h-6 w-20 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruction Overlay */}
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1.5px] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-zinc-900 text-red-400 rounded-2xl p-6 shadow-2xl max-w-sm border border-zinc-800/80 space-y-4 animate-scale-in">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 mx-auto">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-extrabold tracking-tight">Your Resume Preview</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">
                      Start filling in the form sections or chat with the AI coach on the left panel to watch your resume build here live!
                    </p>
                  </div>

                  {onTriggerImport && (
                    <div className="pt-3 border-t border-zinc-800/60 flex flex-col gap-2 w-full">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider block">— OR —</span>
                      <button
                        type="button"
                        onClick={onTriggerImport}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-600/10 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Import PDF/Word Resume
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Normal Template Rendering with Drag-and-drop handlers */
            <div className="resume-template-wrapper">
              <SectionReorderProvider value={{ moveSection: handleMoveSection }}>
                <TemplateRenderer
                  type={selectedTemplate}
                  data={resumeData}
                  activeSection={activeSection}
                  atsMode={atsMode}
                  onEditSection={onEditSection}
                  sectionOrder={sectionOrder}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  themeColor={themeColor}
                />
              </SectionReorderProvider>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
