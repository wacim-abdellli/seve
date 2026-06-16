import { useState, useEffect, useRef } from 'react'
import type { ResumeData, Template } from '../types/resume'
import { motion, AnimatePresence } from 'framer-motion'
import ClassicTemplate from './templates/ClassicTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutiveTemplate from './templates/ExecutiveTemplate'
import MinimalistTemplate from './templates/MinimalistTemplate'
import CreativeTemplate from './templates/CreativeTemplate'
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
  Layout,
  ScanLine,
  Download,
  Minimize2
} from 'lucide-react'

interface ResumePreviewProps {
  resumeData: ResumeData
  selectedTemplate: Template
  onChangeTemplate?: (template: Template) => void
  activeSection?: string | null
  onEditSection?: (section: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer') => void
  onExportPdf?: () => void
  onPageCountChange?: (count: number) => void
  sectionOrder?: ('summary' | 'experience' | 'projects' | 'education' | 'skills' | 'languages' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer')[]
  onSectionOrderChange?: (order: ('summary' | 'experience' | 'projects' | 'education' | 'skills' | 'languages' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer')[]) => void
  templateFontSize: number
  onChangeFontSize: (size: number) => void
  themeColor: string
  onChangeColor?: (color: string) => void
}

const templatesList: { id: Template; label: string; colorDot: string }[] = [
  { id: 'classic', label: 'Classic', colorDot: 'bg-zinc-400' },
  { id: 'modern', label: 'Modern', colorDot: 'bg-blue-500' },
  { id: 'executive', label: 'Executive', colorDot: 'bg-amber-500' },
  { id: 'minimalist', label: 'Minimalist', colorDot: 'bg-teal-500' },
  { id: 'creative', label: 'Creative', colorDot: 'bg-rose-500' },
]

type SectionKey = 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'languages' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer'

const themeColors = [
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
  onChangeTemplate,
  activeSection,
  onEditSection,
  onExportPdf,
  onPageCountChange,
  sectionOrder: propsSectionOrder,
  onSectionOrderChange,
  templateFontSize,
  onChangeFontSize,
  themeColor,
  onChangeColor
}: ResumePreviewProps) {
  const { showToast } = useToast()
  const [atsMode, setAtsMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [showGuides, setShowGuides] = useState(false)
  const [pageCount, setPageCount] = useState(1)
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const handleResize = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth
      const padding = 112 // 56px margin buffer on each side
      const availableWidth = containerWidth - padding
      if (availableWidth > 0 && availableWidth < 794) {
        const computedZoom = Number((availableWidth / 794).toFixed(2))
        setZoom(Math.max(0.4, Math.min(1, computedZoom)))
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

  const A4_HEIGHT_PX = 1123
  const USABLE_HEIGHT_PX = A4_HEIGHT_PX - 96 // 1027px
  const resumeContentRef = useRef<HTMLDivElement>(null)

  const onPageCountChangeRef = useRef(onPageCountChange)
  useEffect(() => {
    onPageCountChangeRef.current = onPageCountChange
  }, [onPageCountChange])

  useEffect(() => {
    const checkHeight = () => {
      if (!resumeContentRef.current) return
      const height = resumeContentRef.current.scrollHeight
      const pages = Math.ceil(height / A4_HEIGHT_PX)
      setPageCount(pages)
      if (onPageCountChangeRef.current) {
        onPageCountChangeRef.current(pages)
      }
    }
    
    checkHeight()
    
    const observer = new ResizeObserver(checkHeight)
    if (resumeContentRef.current) {
      observer.observe(resumeContentRef.current)
    }
    return () => observer.disconnect()
  }, [resumeData, selectedTemplate, templateFontSize])

  const fitToOnePage = () => {
    if (!resumeContentRef.current) return
    const contentHeight = resumeContentRef.current.scrollHeight
    
    if (contentHeight <= USABLE_HEIGHT_PX) {
      onChangeFontSize(10) // reset
      showToast('Resume already fits on 1 page', 'success')
      return
    }
    
    const scale = USABLE_HEIGHT_PX / contentHeight
    const newFontSize = Math.max(8.5, Math.floor(10 * scale * 10) / 10)
    onChangeFontSize(newFontSize)
    showToast(`Font adjusted to ${newFontSize}pt to fit 1 page`, 'info')
  }
  
  // Section Reordering State
  const [localSectionOrder, setLocalSectionOrder] = useState<SectionKey[]>(() => {
    let saved = localStorage.getItem('seve_section_order')
    if (!saved) {
      saved = localStorage.getItem('resumeai_section_order')
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as SectionKey[]
        }
      } catch {
        /* Ignore parsing errors */
      }
    }
    return ['summary', 'experience', 'projects', 'education', 'languages', 'skills', 'awards', 'certifications', 'publications', 'volunteer', 'interests', 'references']
  })

  const baseOrder = propsSectionOrder || localSectionOrder
  const activeSectionKeys: SectionKey[] = [
    'summary', 'experience', 'projects', 'education', 'skills',
    'languages', 'awards', 'certifications', 'publications', 'volunteer',
    'interests', 'references'
  ]
  const sectionsWithData = activeSectionKeys.filter(key => {
    if (key === 'summary') return resumeData.summary && resumeData.summary.trim() !== ''
    if (key === 'skills') return resumeData.skills && resumeData.skills.length > 0
    const val = resumeData[key]
    return Array.isArray(val) && val.length > 0
  })

  const sectionOrder = [...baseOrder]
  sectionsWithData.forEach(sec => {
    if (!sectionOrder.includes(sec)) {
      sectionOrder.push(sec)
    }
  })

  const setSectionOrder = (newOrder: SectionKey[]) => {
    if (onSectionOrderChange) {
      onSectionOrderChange(newOrder)
    } else {
      setLocalSectionOrder(newOrder)
    }
  }

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
      setSectionOrder(updated)
      localStorage.setItem('seve_section_order', JSON.stringify(updated))
    }
    setDraggedSectionId(null)
  }

  return (
    <div className="w-full flex flex-col gap-4 select-text">
      
      {/* Top Inspector Bar */}
      {!isEmpty && (
        <div className="flex items-center justify-between px-4 h-12 bg-zinc-950 border border-zinc-800 rounded-t-xl no-print select-none relative z-40 w-full">
          {/* LEFT GROUP (document controls - Rule 6) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[13px] text-zinc-300 font-mono w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
              type="button"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
              className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
              type="button"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Divider between Left and Center */}
          <div className="w-px h-4 bg-zinc-800 mx-2 flex-shrink-0" />

          {/* CENTER: template pill (Classic ▾) — most important (Rule 6) */}
          <div className="relative z-35 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-[12px] text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${templatesList.find(t => t.id === selectedTemplate)?.colorDot || 'bg-zinc-400'}`} />
              <span className="font-semibold">{templatesList.find(t => t.id === selectedTemplate)?.label || 'Classic'}</span>
              <span className="text-zinc-400 text-[9px]">▼</span>
            </button>
            
            <AnimatePresence>
              {isTemplateDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl w-36 z-50"
                >
                  {templatesList.map((option) => {
                    const isSelected = option.id === selectedTemplate
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          onChangeTemplate?.(option.id)
                          setIsTemplateDropdownOpen(false)
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800/60 text-white font-medium'
                            : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${option.colorDot}`} />
                          <span>{option.label}</span>
                        </div>
                        {isSelected && (
                          <span className="text-rose-400 text-[10px] font-bold">✓</span>
                        )}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Color Chooser */}
          <div className="flex items-center gap-1 ml-2 mr-1 flex-shrink-0">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mr-1 select-none hidden min-[1200px]:block">Color</span>
            {themeColors.map((color) => {
              const isSelected = themeColor === color.value
              return (
                <button
                  key={color.value}
                  onClick={() => onChangeColor?.(color.value)}
                  style={{ backgroundColor: color.value, boxShadow: isSelected ? `0 0 0 2px #18181b, 0 0 0 3.5px ${color.value}` : undefined }}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 relative cursor-pointer flex items-center justify-center hover:scale-125 active:scale-90 ${isSelected ? 'scale-110' : ''}`}
                  title={color.label}
                  type="button"
                >
                  {isSelected && (
                    <span className="w-1 h-1 rounded-full bg-white opacity-95 shadow-sm" />
                  )}
                </button>
              )
            })}
            {/* Custom color picker */}
            <label
              className="w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-600 cursor-pointer flex items-center justify-center hover:scale-125 transition-all duration-200 relative overflow-hidden"
              title="Custom color"
              style={!themeColors.find(c => c.value === themeColor) ? { boxShadow: `0 0 0 2px #18181b, 0 0 0 3.5px ${themeColor}`, backgroundColor: themeColor } : undefined}
            >
              <span className="text-[8px] font-bold text-zinc-400 leading-none pointer-events-none select-none">+</span>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => onChangeColor?.(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Pick a custom color"
              />
            </label>
          </div>

          {/* Divider between Center and Right */}
          <div className="w-px h-4 bg-zinc-800 mx-2 flex-shrink-0" />

          {/* RIGHT GROUP (view options - Rule 6) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(pageCount > 1 || templateFontSize < 10) && (
              <button 
                onClick={fitToOnePage}
                className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer font-medium"
                type="button"
                title="Fit to 1 Page"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden min-[1440px]:inline font-mono">Fit to 1 Page ({templateFontSize}pt)</span>
                <span className="inline min-[1440px]:hidden font-mono">Fit ({templateFontSize}pt)</span>
              </button>
            )}

            <button 
              onClick={() => setShowGuides(!showGuides)}
              className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                showGuides ? 'bg-rose-500/10 text-rose-400 font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-905'
              }`}
              type="button"
              title="Guides"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              <span className="hidden min-[1440px]:inline">Guides</span>
            </button>

            <button 
              onClick={() => setAtsMode(false)}
              className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                !atsMode ? 'bg-rose-500/10 text-rose-400 font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-905'
              }`}
              type="button"
              title="Live Layout"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden min-[1440px]:inline">Live Layout</span>
            </button>

            <button 
              onClick={() => setAtsMode(true)}
              className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                atsMode ? 'bg-rose-500/10 text-rose-400 font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-905'
              }`}
              type="button"
              title="ATS Heatmap"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span className="hidden min-[1440px]:inline">ATS Heatmap</span>
            </button>

            {onExportPdf && (
              <>
                <div className="w-px h-4 bg-zinc-800 mx-1 flex-shrink-0" />
                <button 
                  onClick={onExportPdf}
                  className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg bg-red-650 hover:bg-red-500 text-white font-semibold shadow-lg transition-colors cursor-pointer"
                  type="button"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden min-[1440px]:inline">Export</span>
                  <span className="inline min-[1440px]:hidden">PDF</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Aspect-ratio restricted A4 paper container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#0d0d0f] bg-[radial-gradient(ellipse_at_top,_#1a1a2e_0%,_transparent_60%)] flex items-start justify-center p-8 print-container relative rounded-b-xl border border-zinc-800/80 shadow-inner"
      >
        {/* Shadow wrapper for depth */}
        <div className="relative">
          {/* Glow effect behind paper */}
          <div className="absolute inset-0 -m-4 bg-rose-500/5 rounded-3xl blur-2xl pointer-events-none" />

          {/* The actual resume paper */}
          <div 
            id="resume-print-area" 
            ref={resumeContentRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            className="relative resume-preview shadow-[0_32px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/5 w-[794px] min-h-[1123px] bg-white text-slate-900 transition-all duration-300 print:shadow-none print:border-none print:p-0 print:w-full print:min-h-0 p-0"
          >
            <style dangerouslySetInnerHTML={{ __html: `
              #resume-print-area, .resume-print-wrapper {
                font-size: ${templateFontSize}pt !important;
              }
              #resume-print-area .text-\\[10px\\], .resume-print-wrapper .text-\\[10px\\] {
                font-size: ${(templateFontSize / 10) * 10}px !important;
              }
              #resume-print-area .text-\\[10\\.5px\\], .resume-print-wrapper .text-\\[10\\.5px\\] {
                font-size: ${(templateFontSize / 10) * 10.5}px !important;
              }
              #resume-print-area .text-\\[9\\.5px\\], .resume-print-wrapper .text-\\[9\\.5px\\] {
                font-size: ${(templateFontSize / 10) * 9.5}px !important;
              }
              #resume-print-area .text-\\[9px\\], .resume-print-wrapper .text-\\[9px\\] {
                font-size: ${(templateFontSize / 10) * 9}px !important;
              }
              #resume-print-area .text-\\[8\\.5px\\], .resume-print-wrapper .text-\\[8\\.5px\\] {
                font-size: ${(templateFontSize / 10) * 8.5}px !important;
              }
              #resume-print-area .text-\\[8px\\], .resume-print-wrapper .text-\\[8px\\] {
                font-size: ${(templateFontSize / 10) * 8}px !important;
              }
              #resume-print-area .text-2xl, .resume-print-wrapper .text-2xl {
                font-size: ${(templateFontSize / 10) * 24}px !important;
              }
              #resume-print-area .text-xl, .resume-print-wrapper .text-xl {
                font-size: ${(templateFontSize / 10) * 20}px !important;
              }
              #resume-print-area .text-lg, .resume-print-wrapper .text-lg {
                font-size: ${(templateFontSize / 10) * 18}px !important;
              }
              #resume-print-area .text-base, .resume-print-wrapper .text-base {
                font-size: ${(templateFontSize / 10) * 16}px !important;
              }
              #resume-print-area .text-sm, .resume-print-wrapper .text-sm {
                font-size: ${(templateFontSize / 10) * 14}px !important;
              }
              #resume-print-area .text-xs, .resume-print-wrapper .text-xs {
                font-size: ${(templateFontSize / 10) * 12}px !important;
              }
            ` }} />

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

            {/* Visual Page Break Lines (Screen Only) */}
            {!isEmpty && pageCount > 1 && Array.from({ length: pageCount - 1 }).map((_, idx) => (
              <div 
                key={idx}
                style={{ top: `${(idx + 1) * A4_HEIGHT_PX}px` }}
                className="absolute left-0 right-0 h-0 pointer-events-none no-print z-40 border-b-2 border-dashed border-red-500/30 flex items-center justify-end"
              >
                <span className="bg-zinc-950 border border-zinc-800/80 text-red-400 text-[9px] font-extrabold px-2 py-0.5 rounded shadow-md mr-4 -translate-y-1/2 uppercase tracking-widest">
                  Page {idx + 1} Cut-off
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
                </div>
              </div>
            </div>
          ) : (
            /* Normal Template Rendering with Drag-and-drop handlers */
            <>
              {selectedTemplate === 'classic' && (
                <ClassicTemplate 
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
              )}
              
              {selectedTemplate === 'modern' && (
                <ModernTemplate 
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
              )}

              {selectedTemplate === 'executive' && (
                <ExecutiveTemplate 
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
              )}

              {selectedTemplate === 'minimalist' && (
                <MinimalistTemplate 
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
              )}

              {selectedTemplate === 'creative' && (
                <CreativeTemplate 
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
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
