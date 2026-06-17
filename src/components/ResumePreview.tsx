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
  Download,
  Minimize2,
  ChevronDown,
  UploadCloud,
  Type,
  Sliders
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
  onTriggerImport?: () => void
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
  onChangeColor,
  onTriggerImport
}: ResumePreviewProps) {
  const { showToast } = useToast()
  const [atsMode, setAtsMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [showGuides, setShowGuides] = useState(false)
  const [pageCount, setPageCount] = useState(1)
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false)
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
      const contentEl = resumeContentRef.current.querySelector('.resume-template-wrapper')
      const height = contentEl ? contentEl.scrollHeight : resumeContentRef.current.scrollHeight
      const pages = Math.ceil((height - 10) / A4_HEIGHT_PX)
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
    const contentEl = resumeContentRef.current.querySelector('.resume-template-wrapper')
    const contentHeight = contentEl ? contentEl.scrollHeight : resumeContentRef.current.scrollHeight
    
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
                title="Live Layout View"
              >
                Live
              </button>
              <button 
                onClick={() => setAtsMode(true)}
                className={`px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer h-full flex items-center ${
                  atsMode ? 'bg-zinc-800 text-rose-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                type="button"
                title="ATS Heatmap Analyzer"
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
                title="Toggle Margins & Guides"
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CENTER GROUP: Unified Zoom controls */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-0.5 h-8 flex-shrink-0 shadow-sm z-30">
            <button 
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer h-full"
              type="button"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-zinc-300 font-mono px-2 min-w-[38px] text-center select-none font-extrabold">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
              className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer h-full"
              type="button"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RIGHT GROUP: Style Controls & Actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0 relative z-35">
            {/* Fit to Page Action Button */}
            {(pageCount > 1 || templateFontSize < 10) && (
              <button 
                onClick={fitToOnePage}
                className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center justify-center shadow-sm flex-shrink-0"
                type="button"
                title={`Fit to 1 Page (Current font size: ${templateFontSize}pt)`}
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-450" />
              </button>
            )}

            {/* Combined Style Menu Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
                className={`flex items-center gap-1.5 px-3 h-8 text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                  isStyleMenuOpen 
                    ? 'bg-rose-500/10 border-rose-500/35 text-rose-400 shadow-sm' 
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                }`}
                title="Design Styles & Formatting"
              >
                <Sliders className="w-3.5 h-3.5 text-rose-450" />
                <span>Style</span>
                <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
              </button>

              <AnimatePresence>
                {isStyleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 bg-zinc-950 border border-zinc-850 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)] w-56 z-50 flex flex-col gap-4"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 select-none">Design & Style</span>
                      <button 
                        type="button" 
                        onClick={() => setIsStyleMenuOpen(false)} 
                        className="text-[9px] font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        Done
                      </button>
                    </div>

                    {/* Section 1: Template Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-550 block select-none">Layout Template</label>
                      <div className="relative">
                        <select
                          value={selectedTemplate}
                          onChange={(e) => onChangeTemplate?.(e.target.value as Template)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-rose-500/50 font-bold appearance-none cursor-pointer"
                        >
                          {templatesList.map(t => (
                            <option key={t.id} value={t.id} className="bg-zinc-950 text-zinc-200 font-bold">{t.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Section 2: Accent Color */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-550 block select-none">Theme Accent</label>
                      <div className="grid grid-cols-4 gap-2">
                        {themeColors.map((color) => {
                          const isSelected = themeColor === color.value
                          return (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => onChangeColor?.(color.value)}
                              style={{ backgroundColor: color.value }}
                              className={`w-5 h-5 rounded-full transition-all duration-150 relative cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 ${
                                isSelected ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-zinc-950' : 'border border-white/5'
                              }`}
                              title={color.label}
                            />
                          )
                        })}
                        {/* Custom color picker */}
                        <label
                          className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 cursor-pointer flex items-center justify-center hover:scale-110 hover:border-zinc-700 transition-all duration-150 relative overflow-hidden"
                          title="Custom color"
                          style={!themeColors.find(c => c.value === themeColor) ? { 
                            backgroundColor: themeColor,
                            border: 'none',
                            boxShadow: '0 0 0 2px #f43f5e'
                          } : undefined}
                        >
                          <span className="text-[10px] font-extrabold text-zinc-300 leading-none pointer-events-none select-none">+</span>
                          <input
                            type="color"
                            value={themeColor}
                            onChange={(e) => onChangeColor?.(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Section 3: Font Size */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-550 block select-none">Base Font Size</label>
                      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 h-8 w-full justify-between">
                        <button 
                          onClick={() => onChangeFontSize(Math.max(6, Number((templateFontSize - 0.5).toFixed(1))))}
                          className="px-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center"
                          type="button"
                          title="Decrease Font Size"
                        >
                          <span className="text-[10px] font-extrabold select-none">A-</span>
                        </button>
                        
                        <div className="flex items-center gap-1 px-1 text-zinc-300 font-mono select-none">
                          <Type className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[10px] font-extrabold">{templateFontSize}pt</span>
                        </div>
                        
                        <button 
                          onClick={() => onChangeFontSize(Math.min(16, Number((templateFontSize + 0.5).toFixed(1))))}
                          className="px-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center"
                          type="button"
                          title="Increase Font Size"
                        >
                          <span className="text-[10px] font-extrabold select-none">A+</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export PDF Button */}
            {onExportPdf && (
              <>
                <div className="w-px h-4 bg-zinc-800/80 flex-shrink-0" />
                <button 
                  onClick={onExportPdf}
                  className="h-8 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-600/10 flex items-center gap-1.5"
                  type="button"
                  title="Export PDF Document"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
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
            className="relative resume-preview w-[794px] bg-transparent text-slate-900 transition-all duration-300 print:shadow-none print:border-none print:p-0 print:w-full print:min-h-0 p-0"
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
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
