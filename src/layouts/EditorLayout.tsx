import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import type { ResumeData, Template } from '../types/resume'
import { useResume } from '../hooks/useResume'
import { usePrintResume } from '../hooks/usePrintResume'
import SectionSidebar, { type SectionType } from '../components/SectionSidebar'
import ModeRail from '../components/ModeRail'
import SectionDrawer from '../components/SectionDrawer'
import ResumeManager from '../components/ResumeManager'
import ClassicTemplate from '../components/templates/ClassicTemplate'
import ModernTemplate from '../components/templates/ModernTemplate'
import ExecutiveTemplate from '../components/templates/ExecutiveTemplate'
import MinimalistTemplate from '../components/templates/MinimalistTemplate'
import CreativeTemplate from '../components/templates/CreativeTemplate'
import { Download, ArrowLeft, CheckCircle2, Settings, FolderOpen, Upload, RefreshCw, X, FileCode } from 'lucide-react'

type SectionKey = 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'languages' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer'

export interface EditorContextType {
  activeMode: 'studio' | 'preview' | 'analyze'
  setActiveMode: (mode: 'studio' | 'preview' | 'analyze') => void
  openDrawer: (section: SectionType) => void
  activeStudioSection: SectionType | null
  setActiveStudioSection: (section: SectionType | null) => void
  pageCount: number
  setPageCount: (count: number) => void
  templateFontSize: number
  onChangeFontSize: (size: number) => void
  sectionOrder: SectionKey[]
  onSectionOrderChange: (order: SectionKey[]) => void
  mobileView: 'edit' | 'preview'
  setMobileView: (view: 'edit' | 'preview') => void
  themeColor: string
  setThemeColor: (color: string) => void
  handlePrint: () => void
}

interface ExportWarningModalProps {
  warnings: string[]
  onClose: () => void
  onExportAnyway: () => void
}

interface PrintSettingsModalProps {
  onClose: () => void
  onContinue: () => void
}

function PrintSettingsModal({ onClose, onContinue }: PrintSettingsModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-[480px] max-w-full shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 text-blue-500 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 5.13-.251m-5.13.251a41.146 41.146 0 0 0-3.613.691m11.744-1.089a41.146 41.146 0 0 1 3.614.691m-11.744-1.09A41.975 41.975 0 0 1 12 12.75c2.025 0 4.248.168 6.23.42M15 8.25V6.75A2.25 2.25 0 0 0 12.75 4.5h-1.5A2.25 2.25 0 0 0 9 6.75v1.5m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">Print Settings</h3>
            <p className="text-[11px] text-zinc-400">Adjust your browser print settings for best results</p>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-[12px] leading-relaxed">
            <span className="text-emerald-400 shrink-0 font-bold">1.</span>
            <div>
              <p className="text-white font-semibold text-[13px]">Set Margins to <span className="text-amber-400">None</span></p>
              <p className="text-zinc-400 mt-0.5">In the print dialog, go to <strong>More settings → Margins → None</strong></p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-[12px] leading-relaxed">
            <span className="text-emerald-400 shrink-0 font-bold">2.</span>
            <div>
              <p className="text-white font-semibold text-[13px]">Enable Background Graphics</p>
              <p className="text-zinc-400 mt-0.5">Check <strong>More settings → Background graphics</strong></p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-[12px] leading-relaxed">
            <span className="text-emerald-400 shrink-0 font-bold">3.</span>
            <div>
              <p className="text-white font-semibold text-[13px]">Select A4 Paper Size</p>
              <p className="text-zinc-400 mt-0.5">Choose <strong>A4</strong> under <strong>Paper size</strong> (or your local standard)</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer">Cancel</button>
          <button onClick={onContinue} className="flex-1 h-10 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs shadow-lg shadow-blue-500/10 transition-colors cursor-pointer">Continue to Print</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ExportWarningModal({ warnings, onClose, onExportAnyway }: ExportWarningModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-[480px] max-w-full shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">Export Review</h3>
            <p className="text-[11px] text-zinc-400">Please review these warnings before exporting</p>
          </div>
        </div>
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto mb-6 pr-2">
          {warnings.map((warning, index) => (
            <div key={index} className="flex gap-2.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-[12px] text-zinc-350 leading-relaxed font-light font-sans">
              <span className="text-amber-500 shrink-0 select-none font-bold">•</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer">Fix Issues</button>
          <button onClick={onExportAnyway} className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/10 transition-colors cursor-pointer">Export Anyway</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

interface SimpleSettingsModalProps {
  selectedTemplate: Template
  onUpdateTemplate: (template: Template) => void
  resumeData: ResumeData
  onImportResume: (data: ResumeData) => void
  onClose: () => void
  onResetSpace: () => void
}

function SimpleSettingsModal({ selectedTemplate, onUpdateTemplate, resumeData, onImportResume, onClose, onResetSpace }: SimpleSettingsModalProps) {
  const [showPasteBox, setShowPasteBox] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)

  const handleExport = () => {
    const data = JSON.stringify(resumeData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seve-resume-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          onImportResume(data)
          onClose()
        } catch {
          alert('Invalid JSON file.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handlePasteImport = () => {
    try {
      if (!pasteValue.trim()) {
        setPasteError('Please paste some JSON code first.')
        return
      }
      const data = JSON.parse(pasteValue)
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format. Expected an object.')
      }
      onImportResume(data)
      onClose()
    } catch (err: unknown) {
      setPasteError(err instanceof Error ? err.message : 'Invalid JSON syntax.')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-[460px] max-w-full shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">Settings</h3>
              <p className="text-[11px] text-zinc-400">Manage your resume configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Default Template</label>
            <select value={selectedTemplate} onChange={(e) => onUpdateTemplate(e.target.value as Template)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-bold appearance-none cursor-pointer">
              <option value="classic">Classic (Serif)</option>
              <option value="modern">Modern (Tech/Sans)</option>
              <option value="executive">Executive (Leadership)</option>
              <option value="minimalist">Minimalist (Clean)</option>
              <option value="creative">Creative (Accented)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Data Management</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleExport} className="h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                <Download className="w-3.5 h-3.5 text-zinc-400" /> Export
              </button>
              <button onClick={handleImport} className="h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-zinc-400" /> Import File
              </button>
              <button onClick={() => { setShowPasteBox(!showPasteBox); setPasteError(null) }} className={`h-10 rounded-xl border font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer ${showPasteBox ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white'}`}>
                <FileCode className="w-3.5 h-3.5" /> Paste Code
              </button>
            </div>
            {showPasteBox && (
              <div className="space-y-2.5 pt-2.5 border-t border-zinc-900/60 animate-fade-in">
                <textarea value={pasteValue} onChange={(e) => { setPasteValue(e.target.value); setPasteError(null) }} placeholder="Paste your resume JSON code here..." className="w-full h-32 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-rose-500/50 resize-none font-mono" />
                {pasteError && <p className="text-[10px] text-red-400 font-bold">{pasteError}</p>}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowPasteBox(false); setPasteValue(''); setPasteError(null) }} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white text-[11px] font-bold transition-all cursor-pointer">Cancel</button>
                  <button onClick={handlePasteImport} className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-lg shadow-rose-600/10">Import Code</button>
                </div>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-zinc-800">
            <button onClick={() => { if (window.confirm('Reset all resume data for this version? This cannot be undone.')) { onResetSpace(); onClose() } }} className="w-full h-10 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Reset Resume Data
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function EditorLayout() {
  const navigate = useNavigate()
  const {
    resumes, selectedResumeId, activeResume, resumeData, selectedTemplate, isSaving,
    selectResume, createResume, duplicateResume, renameResume, deleteResume,
    updateActiveResume, importResumeData,
  } = useResume()

  const [activeMode, setActiveMode] = useState<'studio' | 'preview' | 'analyze'>('studio')
  const [activeStudioSection, setActiveStudioSection] = useState<SectionType | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [templateFontSize, setTemplateFontSize] = useState(10)
  const { activeWarnings, showPrintModal, handlePrint: handlePrintModal, dismissWarnings, exportAnyway, dismissPrintModal, confirmPrint } = usePrintResume()
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(() => {
    let saved = localStorage.getItem('seve_section_order')
    if (!saved) saved = localStorage.getItem('resumeai_section_order')
    if (saved) { try { const p = JSON.parse(saved); if (Array.isArray(p) && p.length > 0) return p as SectionKey[] } catch { /* invalid stored order */ } }
    return ['summary', 'experience', 'projects', 'education', 'languages', 'skills', 'awards', 'certifications', 'publications', 'volunteer', 'interests', 'references']
  })
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [themeColor, setThemeColor] = useState<string>(() => localStorage.getItem('seve_theme_color') || '#e11d48')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isResumeManagerOpen, setIsResumeManagerOpen] = useState(false)

  useEffect(() => { localStorage.setItem('seve_theme_color', themeColor) }, [themeColor])

  const openDrawer = (sec: SectionType) => setActiveStudioSection(sec)
  const closeDrawer = () => setActiveStudioSection(null)

  const handlePrint = () => handlePrintModal(resumeData, pageCount)

  const resetResume = () => {
    if (window.confirm('Are you sure you want to reset this resume version? All your current data for this version will be lost.')) {
      importResumeData({ contact: { fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' }, summary: '', experience: [], education: [], skills: [], languages: [], projects: [] })
    }
  }

  const editorContext: EditorContextType = {
    activeMode, setActiveMode, openDrawer,
    activeStudioSection, setActiveStudioSection,
    pageCount, setPageCount,
    templateFontSize, onChangeFontSize: setTemplateFontSize,
    sectionOrder, onSectionOrderChange: setSectionOrder,
    mobileView, setMobileView, themeColor, setThemeColor,
    handlePrint,
  }

  return (
    <div className="select-none h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] ambient-glow-1 rounded-full opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[900px] h-[900px] ambient-glow-2 rounded-full opacity-45" />
        <div className="absolute inset-0 premium-grid opacity-30" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <header className="relative z-40 flex items-center justify-between px-6 py-3 bg-zinc-950/80 backdrop-blur-md border-b border-border sticky top-0 no-print flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors font-semibold cursor-pointer">
            <ArrowLeft size={14} /> Landing
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex items-center select-none">
              <span className="relative font-serif text-sm font-bold text-white leading-none" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                S<span className="absolute top-0 -right-1 w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
              </span>
              <span className="font-serif text-sm font-bold text-white leading-none pl-1.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>eve</span>
            </div>
            <div className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-widest rounded">Studio v2</div>
          </div>
          <div className="w-px h-5 bg-border hidden sm:block" />
          <button onClick={() => setIsResumeManagerOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-sm hover:border-zinc-700 max-w-[180px] sm:max-w-[220px]">
            <FolderOpen size={13} className="text-rose-500 shrink-0" />
            <span className="truncate">{activeResume?.title || 'My Resume'}</span>
          </button>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 no-print">
          {pageCount > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/35 text-[9px] font-bold text-amber-400 uppercase tracking-widest animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Multi-page ({pageCount} Pages)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{isSaving ? 'Saving Changes' : 'Saved Locally'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setActiveMode('analyze')} className="inline-flex items-center gap-1.5 border border-zinc-800 text-xs font-semibold px-3 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all cursor-pointer">
            <CheckCircle2 size={13} /> ATS Audit
          </button>
          <button onClick={() => setIsSettingsOpen(true)} title="Settings" className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer inline-flex items-center justify-center h-8 w-8" type="button">
            <Settings size={15} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10 bg-transparent">
        <div className="hidden lg:block flex-shrink-0 h-full">
          <SectionSidebar activeMode={activeMode} onModeChange={(m) => { setActiveMode(m); if (m === 'studio') setMobileView('edit') }} onOpenSection={openDrawer} />
        </div>

        <ModeRail activeMode={activeMode} onChangeMode={(m) => { setActiveMode(m); if (m === 'studio') setMobileView('edit') }} onSettingsClick={() => setIsSettingsOpen(true)} />

        <div className="flex flex-1 flex-row overflow-hidden relative bg-transparent pb-16 lg:pb-0">
          <Outlet context={editorContext} />
        </div>
      </div>

      <AnimatePresence>
        {activeStudioSection && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] pointer-events-auto no-print" />
            <SectionDrawer section={activeStudioSection} onClose={closeDrawer} />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SimpleSettingsModal
            selectedTemplate={selectedTemplate}
            onUpdateTemplate={(t) => updateActiveResume(prev => ({ ...prev, selectedTemplate: t }))}
            resumeData={resumeData}
            onImportResume={importResumeData}
            onClose={() => setIsSettingsOpen(false)}
            onResetSpace={resetResume}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResumeManagerOpen && (
          <ResumeManager
            resumes={resumes} selectedResumeId={selectedResumeId}
            onSelect={selectResume} onCreate={createResume} onDuplicate={duplicateResume}
            onRename={renameResume} onDelete={deleteResume}
            onClose={() => setIsResumeManagerOpen(false)}
          />
        )}
      </AnimatePresence>

      {createPortal(
        <div className="resume-print-wrapper hidden print:block">
          <div className={`resume-template-print-wrapper template-${selectedTemplate}`}>
          <style dangerouslySetInnerHTML={{ __html: `
            .resume-template-print-wrapper, .resume-page { font-size: ${templateFontSize}pt !important; }
            .resume-template-print-wrapper .text-\\[10px\\], .resume-page .text-\\[10px\\] { font-size: ${(templateFontSize / 10) * 10}px !important; }
            .resume-template-print-wrapper .text-\\[10\\.5px\\], .resume-page .text-\\[10\\.5px\\] { font-size: ${(templateFontSize / 10) * 10.5}px !important; }
            .resume-template-print-wrapper .text-\\[9\\.5px\\], .resume-page .text-\\[9\\.5px\\] { font-size: ${(templateFontSize / 10) * 9.5}px !important; }
            .resume-template-print-wrapper .text-\\[9px\\], .resume-page .text-\\[9px\\] { font-size: ${(templateFontSize / 10) * 9}px !important; }
            .resume-template-print-wrapper .text-\\[8\\.5px\\], .resume-page .text-\\[8\\.5px\\] { font-size: ${(templateFontSize / 10) * 8.5}px !important; }
            .resume-template-print-wrapper .text-\\[8px\\], .resume-page .text-\\[8px\\] { font-size: ${(templateFontSize / 10) * 8}px !important; }
            .resume-template-print-wrapper .text-2xl, .resume-page .text-2xl { font-size: ${(templateFontSize / 10) * 24}px !important; }
            .resume-template-print-wrapper .text-xl, .resume-page .text-xl { font-size: ${(templateFontSize / 10) * 20}px !important; }
            .resume-template-print-wrapper .text-lg, .resume-page .text-lg { font-size: ${(templateFontSize / 10) * 18}px !important; }
            .resume-template-print-wrapper .text-base, .resume-page .text-base { font-size: ${(templateFontSize / 10) * 16}px !important; }
            .resume-template-print-wrapper .text-sm, .resume-page .text-sm { font-size: ${(templateFontSize / 10) * 14}px !important; }
            .resume-template-print-wrapper .text-xs, .resume-page .text-xs { font-size: ${(templateFontSize / 10) * 12}px !important; }
          ` }} />
          {selectedTemplate === 'classic' && <ClassicTemplate data={resumeData} sectionOrder={sectionOrder} themeColor={themeColor} />}
          {selectedTemplate === 'modern' && <ModernTemplate data={resumeData} sectionOrder={sectionOrder} themeColor={themeColor} />}
          {selectedTemplate === 'executive' && <ExecutiveTemplate data={resumeData} sectionOrder={sectionOrder} themeColor={themeColor} />}
          {selectedTemplate === 'minimalist' && <MinimalistTemplate data={resumeData} sectionOrder={sectionOrder} themeColor={themeColor} />}
          {selectedTemplate === 'creative' && <CreativeTemplate data={resumeData} sectionOrder={sectionOrder} themeColor={themeColor} />}
          </div>
        </div>,
        document.body
      )}

      {activeWarnings && <ExportWarningModal warnings={activeWarnings} onClose={dismissWarnings} onExportAnyway={exportAnyway} />}
      {showPrintModal && <PrintSettingsModal onClose={dismissPrintModal} onContinue={confirmPrint} />}
    </div>
  )
}
