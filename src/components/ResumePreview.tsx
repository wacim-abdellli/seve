/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ResumeData, ResumeStylePreferences, Template } from '../types/resume'
import { stylePrefsToCssVars } from '../utils/stylePrefsToCssVars'

import TemplateRenderer from './TemplateRenderer'
import { SectionReorderProvider } from './PreviewSectionWrapper'
import { useToast } from '../hooks/useToast'
import { 
  Sparkles,
  FileText,
  UploadCloud,
  Brain,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Download,
  Minimize2
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
  hideToolbar?: boolean
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
  { value: '#b91c1c', label: 'Crimson', bgClass: 'bg-rose-500' },
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
  onTriggerImport,
  hideToolbar
}: ResumePreviewProps) {
  const { showToast } = useToast()
  const [atsMode, setAtsMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isManualZoom, setIsManualZoom] = useState(false)
  const isManualZoomRef = useRef(false)
  const [dismissed, setDismissed] = useState(false)
  
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

  // Debounce measurePageCount with rAF to prevent layout thrashing on rapid state changes
  const measureRafRef = useRef<number>(0)
  const debouncedMeasure = useCallback(() => {
    cancelAnimationFrame(measureRafRef.current)
    measureRafRef.current = requestAnimationFrame(() => {
      measurePageCount()
    })
  }, [measurePageCount])

  useEffect(() => {
    debouncedMeasure()

    const observer = new ResizeObserver(debouncedMeasure)
    if (resumeContentRef.current) {
      observer.observe(resumeContentRef.current)
    }
    return () => {
      observer.disconnect()
      cancelAnimationFrame(measureRafRef.current)
    }
  }, [resumeData, selectedTemplate, templateFontSize, debouncedMeasure])

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

    // Wait for browser to finish font re-layout before re-measuring
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        measurePageCount()
      })
    } else {
      // Fallback for older browsers
      requestAnimationFrame(() => measurePageCount())
    }

    if (targetFontSize < MIN_FONT_SIZE) {
      showToast(`Font minimized to ${MIN_FONT_SIZE}pt, but content is still too long for 1 page.`, 'warning')
    } else {
      showToast(`Font adjusted to ${newFontSize}pt to fit 1 page`, 'success')
    }
  }

  const sectionsWithData = useMemo(() => {
    const keys: SectionKey[] = [
      'summary', 'experience', 'projects', 'education', 'skills',
      'languages', 'awards', 'certifications', 'publications', 'volunteer',
      'interests', 'references'
    ]
    return keys.filter(key => {
      if (key === 'summary') return resumeData?.summary && typeof resumeData.summary === 'string' && resumeData.summary.trim() !== ''
      if (key === 'skills') return resumeData?.skills && Array.isArray(resumeData.skills) && resumeData.skills.length > 0
      const val = resumeData?.[key as keyof ResumeData]
      return Array.isArray(val) && val.length > 0
    })
  }, [resumeData])

  const sectionOrder = useMemo(() => {
    const order = [...(propsSectionOrder || [])]
    sectionsWithData.forEach(sec => {
      if (!order.includes(sec)) {
        order.push(sec)
      }
    })
    return order
  }, [propsSectionOrder, sectionsWithData])

  const [draggedSectionId, setDraggedSectionId] = useState<SectionKey | null>(null)

  // Check if resume is completely empty
  const isEmpty = 
    !(resumeData?.contact?.fullName || '').trim() &&
    !(resumeData?.summary || '').trim() &&
    (!resumeData?.experience || resumeData.experience.length === 0) &&
    (!resumeData?.education || resumeData.education.length === 0) &&
    (!resumeData?.skills || resumeData.skills.length === 0)

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

  const handleMoveSection = useCallback((sectionId: SectionKey, direction: 'up' | 'down') => {
    const idx = sectionOrder.indexOf(sectionId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sectionOrder.length) return
    const updated = [...sectionOrder]
    ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]
    if (onSectionOrderChange) {
      onSectionOrderChange(updated)
    }
  }, [sectionOrder, onSectionOrderChange])

  const reorderContextValue = useMemo(() => ({ moveSection: handleMoveSection }), [handleMoveSection])

  return (
    <div className="w-full flex flex-col gap-4 select-text relative">
      
      {/* Top Inspector Bar */}
      {!isEmpty && !hideToolbar && (
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
        className="flex-1 overflow-auto flex items-start justify-center p-2 sm:p-6 md:p-10 print-container relative rounded-b-xl"
          style={{ background: 'linear-gradient(145deg, #08080f 0%, #0d0d18 50%, #080810 100%)' }}
      >
        {/* Shadow wrapper for depth */}
        <div 
          className="relative transition-all duration-300"
          style={{
            width: zoom < 1 ? `${794 * zoom}px` : '794px',
            height: zoom < 1 ? `${contentHeight * zoom}px` : 'auto',
            filter: 'drop-shadow(0 25px 60px rgba(0,0,0,0.8)) drop-shadow(0 8px 20px rgba(0,0,0,0.6))',
          }}
        >

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



          {isEmpty && !dismissed ? (
            <div className="h-full flex flex-col items-center justify-center p-8 select-none no-print min-h-[1123px] relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-60 h-60 bg-[#b91c1c]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                className="w-full max-w-[520px] space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-[#b91c1c]/10 border border-[#b91c1c]/25 flex items-center justify-center mx-auto shadow-lg shadow-[#b91c1c]/5">
                    <Sparkles className="w-7 h-7 text-[#b91c1c]" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">Welcome to Seve</h2>
                  <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-xs mx-auto">
                    Import an existing resume or start fresh. Your data stays on your device.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={onTriggerImport}
                    className="w-full group flex items-center gap-4 p-4 bg-zinc-950/70 border border-zinc-800 hover:border-[#b91c1c]/30 hover:bg-zinc-900/80 rounded-xl text-left transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#b91c1c]/10 border border-[#b91c1c]/20 flex items-center justify-center text-[#b91c1c] shrink-0 group-hover:bg-[#b91c1c]/15 group-hover:border-[#b91c1c]/30 transition-all">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">Import Existing Resume</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Upload .txt/.json or paste your old CV text — we'll extract the details</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#b91c1c] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={onTriggerImport}
                    className="w-full group flex items-center gap-4 p-4 bg-zinc-950/70 border border-zinc-800 hover:border-purple-500/30 hover:bg-zinc-900/80 rounded-xl text-left transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-500/15 group-hover:border-purple-500/30 transition-all">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">AI Fast Fill</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Use ChatGPT/Claude to generate a structured resume from your old CV</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="w-full group flex items-center gap-4 p-4 bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 rounded-xl text-left transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-zinc-400 shrink-0 group-hover:bg-zinc-800 group-hover:border-zinc-600 transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">Start from Scratch</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Build your resume manually using the section editor on the left</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>

                <p className="text-[10px] text-zinc-600 text-center">
                  Resume editing runs locally. Anonymous usage data is recorded through Supabase. No personal data is shared.
                </p>
              </motion.div>
            </div>
          ) : (
            /* Normal Template Rendering with Drag-and-drop handlers */
            <div className="resume-template-wrapper">
              <SectionReorderProvider value={reorderContextValue}>
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
