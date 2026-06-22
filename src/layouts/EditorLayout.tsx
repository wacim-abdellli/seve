import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import type { ResumeData, ResumeProfile, ResumeStylePreferences, Template, AppState } from '../types/resume'
import { DEFAULT_STYLE_PREFS } from '../types/resume'
import { stylePrefsToCssVars } from '../utils/stylePrefsToCssVars'
import { useResume } from '../hooks/useResume'
import { usePrintResume } from '../hooks/usePrintResume'
import SectionSidebar, { type SectionType } from '../components/SectionSidebar'
import ModeRail from '../components/ModeRail'
import SectionDrawer from '../components/SectionDrawer'
import TemplateRenderer from '../components/TemplateRenderer'
const KeyboardShortcutsModal = lazy(() => import('../components/KeyboardShortcutsModal'))
const ResumeManager = lazy(() => import('../components/ResumeManager'))
import { Download, ArrowLeft, CheckCircle2, Settings, RefreshCw, X, FileCode, LogOut, ChevronDown, Cloud, HardDrive, AlertCircle, Copy, Sparkles, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { normalizeResumeData } from '../utils/resumeNormalizer'
const AiOnboardingModal = lazy(() => import('../components/AiOnboardingModal'))



type SectionKey = string

export interface EditorContextType {
  activeMode: 'studio' | 'design' | 'preview' | 'analyze'
  setActiveMode: (mode: 'studio' | 'design' | 'preview' | 'analyze') => void
  openDrawer: (section: SectionType) => void
  activeStudioSection: SectionType | null
  setActiveStudioSection: (section: SectionType | null) => void
  pageCount: number
  setPageCount: (count: number) => void
  templateFontSize: number
  onChangeFontSize: (size: number) => void
  templateFontWeight: number
  onChangeFontWeight: (weight: number) => void
  stylePrefs: ResumeStylePreferences
  updateStylePrefs: (updater: (prev: ResumeStylePreferences) => ResumeStylePreferences) => void
  sectionOrder: SectionKey[]
  onSectionOrderChange: (order: SectionKey[]) => void
  mobileView: 'edit' | 'preview'
  setMobileView: (view: 'edit' | 'preview') => void
  themeColor: string
  setThemeColor: (color: string) => void
  handlePrint: () => void
  showAiGuide: boolean
  setShowAiGuide: (show: boolean) => void
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print select-none">
      <div className="bg-[#0c0d12] border border-[#b91c1c]/25 rounded-2xl p-6 md:p-8 w-[640px] max-w-full shadow-2xl shadow-[#b91c1c]/5 animate-scale-in overflow-hidden relative">
        {/* Glow ambient */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#b91c1c]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 relative">
          {/* Left Side: Instructions */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 text-[#b91c1c] mb-2">
              <div className="w-10 h-10 rounded-full bg-[#b91c1c]/10 border border-[#b91c1c]/30 flex items-center justify-center text-[#b91c1c] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 5.13-.251m-5.13.251a41.146 41.146 0 0 0-3.613.691m11.744-1.089a41.146 41.146 0 0 1 3.614.691m-11.744-1.09A41.975 41.975 0 0 1 12 12.75c2.025 0 4.248.168 6.23.42M15 8.25V6.75A2.25 2.25 0 0 0 12.75 4.5h-1.5A2.25 2.25 0 0 0 9 6.75v1.5m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-white uppercase font-display">Export to PDF</h3>
                <p className="text-[11px] text-zinc-400">Configure browser settings for a perfect PDF</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 text-[11px] leading-relaxed">
                <span className="text-[#b91c1c] shrink-0 font-bold font-mono text-xs">1.</span>
                <div>
                  <p className="text-white font-bold text-xs">Set Destination to "Save as PDF"</p>
                  <p className="text-zinc-450 mt-0.5">This tells your browser to generate a high-quality PDF file instead of sending it to a physical printer.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 text-[11px] leading-relaxed">
                <span className="text-amber-450 shrink-0 font-bold font-mono text-xs">2.</span>
                <div>
                  <p className="text-white font-bold text-xs">Change Margins to "None"</p>
                  <p className="text-zinc-450 mt-0.5">Under <span className="text-zinc-300 font-semibold">More Settings</span>, set Margins to None to prevent white spacing borders.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 text-[11px] leading-relaxed">
                <span className="text-purple-400 shrink-0 font-bold font-mono text-xs">3.</span>
                <div>
                  <p className="text-white font-bold text-xs">Enable Background Graphics</p>
                  <p className="text-zinc-450 mt-0.5">Check the box for Background Graphics to preserve all template colors, accents, and custom styling.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 font-display">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer">Cancel</button>
              <button onClick={onContinue} className="flex-1 h-10 rounded-xl bg-[#b91c1c] hover:bg-[#c62828] text-white font-extrabold text-xs shadow-lg shadow-rose-950/20 transition-all cursor-pointer">Open Print Dialog</button>
            </div>
          </div>

          {/* Right Side: Visual Mockup */}
          <div className="w-full md:w-[240px] bg-zinc-950/80 border border-zinc-850 rounded-xl p-4 flex flex-col font-sans shrink-0">
            {/* Mockup Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-850 mb-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-display">Browser Print Settings</span>
            </div>

            {/* Mockup Controls */}
            <div className="space-y-3 text-[10px]">
              {/* Destination selector */}
              <div className="space-y-1">
                <label className="text-zinc-500 font-bold block">Destination</label>
                <div className="bg-zinc-900 border border-purple-500/35 rounded px-2 py-1.5 flex items-center justify-between text-purple-300 font-bold shadow-[0_0_8px_rgba(168,85,247,0.05)] animate-pulse">
                  <span className="truncate">Save as PDF</span>
                  <span className="text-purple-400 font-bold text-[8px]">▼</span>
                </div>
              </div>

              {/* Pages */}
              <div className="space-y-1">
                <label className="text-zinc-500 font-bold block">Pages</label>
                <div className="bg-zinc-900/50 border border-zinc-850 rounded px-2 py-1 flex items-center justify-between text-zinc-400">
                  <span>All</span>
                  <span className="text-zinc-700">▼</span>
                </div>
              </div>

              {/* More settings expander */}
              <div className="py-1 border-t border-b border-zinc-900 flex items-center justify-between text-zinc-450 font-semibold cursor-default">
                <span>More settings</span>
                <span>▲</span>
              </div>

              {/* Paper size */}
              <div className="space-y-1">
                <label className="text-zinc-500 font-bold block">Paper size</label>
                <div className="bg-zinc-900/50 border border-zinc-850 rounded px-2 py-1 flex items-center justify-between text-zinc-450">
                  <span>A4</span>
                  <span className="text-zinc-750">▼</span>
                </div>
              </div>

              {/* Margins selector */}
              <div className="space-y-1">
                <label className="text-zinc-500 font-bold block">Margins</label>
                <div className="bg-zinc-900 border border-[#b91c1c]/35 rounded px-2 py-1.5 flex items-center justify-between text-rose-300 font-bold shadow-[0_0_8px_rgba(185,28,28,0.05)] animate-pulse">
                  <span>None</span>
                  <span className="text-rose-450 font-bold text-[8px]">▼</span>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="text-zinc-500 font-bold block">Options</label>
                <div className="space-y-1.5 font-medium">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <div className="w-3.5 h-3.5 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0" />
                    <span>Headers and footers</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-450 font-bold animate-pulse">
                    <div className="w-3.5 h-3.5 rounded border border-emerald-500/35 bg-emerald-500/10 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                      <span className="text-[9px]">✓</span>
                    </div>
                    <span>Background graphics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ExportWarningModal({ warnings, onClose, onExportAnyway }: ExportWarningModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div className="bg-[#12131a] border border-[#b91c1c]/20 rounded-2xl p-6 w-[480px] max-w-full shadow-2xl shadow-[#b91c1c]/5 animate-scale-in">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-white uppercase font-display">Export Review</h3>
            <p className="text-[11px] text-zinc-400">Please review these warnings before exporting</p>
          </div>
        </div>
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
          {warnings.map((warning, index) => (
            <div key={index} className="flex gap-2.5 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/40 text-[12px] text-zinc-350 leading-relaxed font-light font-sans">
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

const EMPTY_RESUME_TEMPLATE: ResumeData = {
  contact: { fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' },
  summary: '',
  experience: [{ id: '', jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }],
  education: [{ id: '', degree: '', school: '', location: '', graduationDate: '', gpa: '' }],
  skills: [''],
  languages: [{ id: '', name: '', proficiency: '' }],
  projects: [{ id: '', name: '', description: '', technologies: [''] }],
  awards: [{ id: '', title: '', awarder: '', date: '', description: '' }],
  certifications: [{ id: '', title: '', issuer: '', date: '', description: '' }],
  interests: [{ id: '', name: '', keywords: [''] }],
  publications: [{ id: '', title: '', publisher: '', date: '', description: '' }],
  references: [{ id: '', name: '', position: '', phone: '', description: '' }],
  volunteer: [{ id: '', organization: '', location: '', period: '', description: '' }],
}

interface SimpleSettingsModalProps {
  selectedTemplate: Template
  onUpdateTemplate: (template: Template) => void
  onImportResume: (data: ResumeData) => void
  onClose: () => void
  onResetSpace: () => void
  resumes: Record<string, ResumeProfile>
  selectedResumeId: string
  onRestoreBackup: (backup: AppState) => void
}

function SimpleSettingsModal({ selectedTemplate, onUpdateTemplate, onImportResume, onClose, onResetSpace, resumes, selectedResumeId, onRestoreBackup }: SimpleSettingsModalProps) {
  const [showPasteBox, setShowPasteBox] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(EMPTY_RESUME_TEMPLATE, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleExport = () => {
    const backup = {
      version: 1,
      type: 'seve-full-backup',
      data: { resumes, selectedResumeId },
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seve-backup.json'
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
          const rawData = JSON.parse(ev.target?.result as string)
          if (rawData?.version === 1 && rawData?.type === 'seve-full-backup' && rawData?.data) {
            onRestoreBackup(rawData.data)
          } else if (rawData?.resumes && rawData?.selectedResumeId) {
            onRestoreBackup(rawData)
          } else {
            const data = normalizeResumeData(rawData)
            onImportResume(data)
          }
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
      const rawData = JSON.parse(pasteValue)
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid JSON format. Expected an object.')
      }
      if (rawData?.version === 1 && rawData?.type === 'seve-full-backup' && rawData?.data) {
        onRestoreBackup(rawData.data)
      } else if (rawData?.resumes && rawData?.selectedResumeId) {
        onRestoreBackup(rawData)
      } else {
        const data = normalizeResumeData(rawData)
        onImportResume(data)
      }
      onClose()
    } catch (err: unknown) {
      setPasteError(err instanceof Error ? err.message : 'Invalid JSON syntax.')
    }
  }

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div onClick={(e) => e.stopPropagation()} className="bg-[#12131a] border border-[#b91c1c]/20 rounded-2xl p-6 w-[460px] max-w-full shadow-2xl shadow-[#b91c1c]/5 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#b91c1c]/10 border border-[#b91c1c]/30 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-[#b91c1c]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-white uppercase font-display">Settings</h3>
              <p className="text-[11px] text-zinc-400">Manage your resume configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-450 uppercase tracking-wider font-display">Default Template</label>
            <select value={selectedTemplate} onChange={(e) => onUpdateTemplate(e.target.value as Template)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#b91c1c]/50 font-bold appearance-none cursor-pointer">
              <option value="classic">Classic (Serif)</option>
              <option value="modern">Modern (Tech/Sans)</option>
              <option value="executive">Executive (Leadership)</option>
              <option value="minimalist">Minimalist (Clean)</option>
              <option value="creative">Creative (Accented)</option>
              <option value="compact">Compact (Space-saving)</option>
              <option value="professional">Professional (Bold)</option>
              <option value="technical">Technical (Structured)</option>
              <option value="academic">Academic (Publications)</option>
              <option value="clean">Clean (Minimal)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-450 uppercase tracking-wider font-display">Data Management</label>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={handleExport} className="h-10 rounded-xl bg-zinc-950/40 border border-zinc-850 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                <Download className="w-3.5 h-3.5 text-zinc-400" /> Backup
              </button>
              <button onClick={handleImport} className="h-10 rounded-xl bg-zinc-950/40 border border-zinc-850 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-zinc-400" /> Import File
              </button>
              <button onClick={() => { setShowPasteBox(!showPasteBox); setPasteError(null) }} className={`h-10 rounded-xl border font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer ${showPasteBox ? 'bg-[#b91c1c]/10 border-[#b91c1c]/35 text-[#b91c1c]' : 'bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900/60 text-zinc-300 hover:text-white'}`}>
                <FileCode className="w-3.5 h-3.5" /> Paste Code
              </button>
              <button onClick={handleCopyTemplate} className="h-10 rounded-xl bg-zinc-950/40 border border-zinc-850 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                <Copy className="w-3.5 h-3.5 text-zinc-400" /> {copied ? 'Copied!' : 'Template'}
              </button>
            </div>
            {showPasteBox && (
              <div className="space-y-2.5 pt-2.5 border-t border-zinc-900/60 animate-fade-in">
                <textarea value={pasteValue} onChange={(e) => { setPasteValue(e.target.value); setPasteError(null) }} placeholder="Paste your resume JSON code here..." className="w-full h-32 bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-[#b91c1c]/50 resize-none font-mono custom-scrollbar" />
                {pasteError && <p className="text-[10px] text-red-400 font-bold">{pasteError}</p>}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowPasteBox(false); setPasteValue(''); setPasteError(null) }} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white text-[11px] font-bold transition-all cursor-pointer">Cancel</button>
                  <button onClick={handlePasteImport} className="px-3.5 py-1.5 rounded-lg bg-[#b91c1c] hover:bg-[#c62828] text-white text-[11px] font-bold transition-all cursor-pointer shadow-lg shadow-rose-950/25">Import Code</button>
                </div>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-zinc-800/80">
            <button onClick={() => { if (window.confirm('Reset all resume data for this version? This cannot be undone.')) { onResetSpace(); onClose() } }} className="w-full h-10 rounded-xl bg-red-500/5 border border-red-950/30 hover:bg-red-500/10 text-red-450 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
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
    resumes, selectedResumeId, activeResume, resumeData, selectedTemplate, isSaving, cloudStatus, cloudError, retrySync,
    selectResume, createResume, duplicateResume, renameResume, deleteResume,
    updateActiveResume, updateStylePrefs, importResumeData, sectionOrder, updateSectionOrder,
    saveChangesToCloud, restoreFromBackup,
  } = useResume()
  const { user, signInWithGoogle, signOut } = useAuth()

  const [activeMode, setActiveMode] = useState<'studio' | 'design' | 'preview' | 'analyze'>('studio')
  const [activeStudioSection, setActiveStudioSection] = useState<SectionType | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [showAiGuide, setShowAiGuide] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setShowShortcuts((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  
  const themeColor = activeResume?.themeColor || localStorage.getItem('seve_theme_color') || '#b91c1c'
  const setThemeColor = (color: string) => {
    localStorage.setItem('seve_theme_color', color)
    updateActiveResume(prev => ({ ...prev, themeColor: color }))
  }

  const templateFontSize = activeResume?.templateFontSize || 10
  const setTemplateFontSize = (size: number) => {
    updateActiveResume(prev => ({ ...prev, templateFontSize: size }))
  }

  const templateFontWeight = activeResume?.templateFontWeight || 400
  const setTemplateFontWeight = (weight: number) => {
    updateActiveResume(prev => ({ ...prev, templateFontWeight: weight }))
  }

  const stylePrefs = activeResume?.stylePrefs || { ...DEFAULT_STYLE_PREFS }

  const { activeWarnings, showPrintModal, handlePrint: handlePrintModal, dismissWarnings, exportAnyway, dismissPrintModal, confirmPrint } = usePrintResume()
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isResumeManagerOpen, setIsResumeManagerOpen] = useState(false)

  const handlePrint = useCallback(() => {
    handlePrintModal(resumeData, pageCount)
  }, [resumeData, pageCount, handlePrintModal])

  // Keyboard shortcuts: Ctrl+P -> Print / Save as PDF, Ctrl+S -> save to cloud
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        handlePrint()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (user) saveChangesToCloud()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [user, resumeData, pageCount, saveChangesToCloud, handlePrint])

  const openDrawer = (sec: SectionType) => setActiveStudioSection(sec)
  const closeDrawer = () => setActiveStudioSection(null)


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
    templateFontWeight, onChangeFontWeight: setTemplateFontWeight,
    stylePrefs, updateStylePrefs,
    sectionOrder, onSectionOrderChange: updateSectionOrder,
    mobileView, setMobileView, themeColor, setThemeColor,
    handlePrint,
    showAiGuide, setShowAiGuide,
  }

  return (
    <div className="select-none h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] ambient-glow-1 rounded-full opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[900px] h-[900px] ambient-glow-2 rounded-full opacity-45" />
        <div className="absolute inset-0 premium-grid opacity-30" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <header className="relative z-40 flex items-center justify-between gap-2 px-3 sm:px-6 h-14 bg-zinc-950/80 backdrop-blur-md border-b border-border sticky top-0 no-print flex-shrink-0 overflow-visible">
        {/* Zone 1 — Left: Navigation & Identity */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center h-8 gap-1 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-800 px-2.5 rounded-full transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft size={13} className="shrink-0" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="flex items-center select-none">
              <span className="relative font-serif text-sm font-bold text-white leading-none" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                S<span className="absolute top-0 -right-1 w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
              </span>
              <span className="font-serif text-sm font-bold text-white leading-none pl-1.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>eve</span>
            </div>
          </div>
          <button 
            onClick={() => setIsResumeManagerOpen(true)} 
            className="flex items-center h-8 gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-800 px-2.5 rounded-full transition-all cursor-pointer hover:border-zinc-700 min-w-0 shrink-0 max-w-[160px]"
          >
            <span className="truncate">{activeResume?.title || 'My Resume'}</span>
            <span className="px-1.5 py-0.5 text-[9px] bg-zinc-800/80 text-zinc-400 rounded-full border border-zinc-700 font-mono shrink-0 min-w-4 h-4 flex items-center justify-center">
              {Object.keys(resumes || {}).length}
            </span>
            <ChevronDown size={11} className="shrink-0 text-zinc-500" />
          </button>
        </div>

        {/* Zone 2 — Center: Cloud Status Pill */}
        <div className="hidden sm:flex flex-1 items-center justify-center min-w-0">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-semibold tracking-wide transition-all duration-500 w-[140px] justify-center ${
              cloudStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : isSaving || cloudStatus === 'syncing' ? 'bg-amber-500/8 border-amber-500/25 text-amber-400'
              : cloudStatus === 'synced' ? 'bg-emerald-500/8 border-emerald-500/25 text-emerald-400'
              : cloudStatus === 'unsaved' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {cloudStatus === 'error' ? (
              <AlertCircle size={11} className="shrink-0" />
            ) : isSaving || cloudStatus === 'syncing' ? (
              <RefreshCw size={11} className="shrink-0 animate-spin" />
            ) : cloudStatus === 'synced' ? (
              <Cloud size={11} className="shrink-0" />
            ) : cloudStatus === 'unsaved' ? (
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            ) : (
              <HardDrive size={11} className="shrink-0" />
            )}
            <span className="leading-none truncate" title={cloudError ?? undefined}>
              {cloudStatus === 'error'
                ? (cloudError ? 'Error' : 'Sync failed')
                : isSaving || cloudStatus === 'syncing' ? 'Saving…'
                : cloudStatus === 'synced' ? 'Cloud saved'
                : cloudStatus === 'unsaved' ? 'Unsaved'
                : 'Local'}
            </span>
            {cloudStatus === 'error' && (
              <button onClick={retrySync} className="shrink-0 underline underline-offset-2 hover:text-white transition-colors cursor-pointer">
                Retry
              </button>
            )}
            {cloudStatus === 'unsaved' && !isSaving && (
              <button onClick={saveChangesToCloud} className="shrink-0 text-white hover:text-zinc-200 transition-colors cursor-pointer font-bold ml-0.5" title="Save now">
                Save
              </button>
            )}
          </div>
        </div>

        {/* Zone 3 — Right: Primary & Secondary Actions */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile cloud indicator */}
          <div className="sm:hidden flex items-center gap-1">
            {cloudStatus === 'unsaved' && !isSaving && (
              <button onClick={saveChangesToCloud} className="h-7 px-2 rounded-full bg-[#b91c1c] hover:bg-[#c62828] text-white text-[9px] font-extrabold transition-all cursor-pointer active:scale-95">
                Save
              </button>
            )}
            <div title={cloudError || cloudStatus}>
              {cloudStatus === 'error' ? <AlertCircle size={14} className="text-red-400 animate-pulse shrink-0" />
              : isSaving || cloudStatus === 'syncing' ? <RefreshCw size={14} className="text-amber-400 animate-spin shrink-0" />
              : cloudStatus === 'synced' ? <Cloud size={14} className="text-emerald-400 shrink-0" />
              : cloudStatus === 'unsaved' ? <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              : <HardDrive size={14} className="text-zinc-500 shrink-0" />}
            </div>
          </div>

          <button 
            onClick={() => setShowAiGuide(true)} 
            className="hidden sm:flex items-center justify-center h-8 gap-1 border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold text-[11px] px-3 rounded-full transition-all cursor-pointer shrink-0"
          >
            <Sparkles size={12} className="shrink-0" />
            <span className="hidden lg:inline">AI Fill</span>
          </button>
          <button 
            onClick={() => setActiveMode('analyze')} 
            className={`hidden md:flex items-center justify-center h-8 gap-1 border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold text-[11px] px-3 rounded-full transition-all cursor-pointer shrink-0 ${activeMode === 'analyze' ? 'bg-zinc-800 border-zinc-600 text-white' : ''}`}
          >
            <CheckCircle2 size={12} className="shrink-0" />
            <span className="hidden lg:inline">ATS</span>
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="flex items-center justify-center w-8 h-8 rounded-full border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0" 
            title="Settings"
          >
            <Settings size={14} className="shrink-0" />
          </button>
          {user ? (
            <div className="relative shrink-0">
              <button 
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)} 
                onBlur={() => setTimeout(() => setShowUserMenu(false), 150)} 
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-label="Open account menu"
                className="flex items-center h-8 gap-1 border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-[11px] font-extrabold px-1.5 rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <img src={user.user_metadata?.avatar_url} alt="" className="w-5 h-5 rounded-full shrink-0" referrerPolicy="no-referrer" />
                <ChevronDown size={10} className={`transition-transform shrink-0 hidden sm:inline ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              {showUserMenu && (
                <div role="menu" className="absolute right-0 top-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2 shadow-2xl z-50 min-w-[180px] animate-fade-in">
                  <div className="px-3 py-2 text-[11px] text-zinc-400 border-b border-zinc-800 truncate">{user.email}</div>
                  <button type="button" role="menuitem" onClick={() => { signOut(); setShowUserMenu(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex items-center h-8 gap-1 border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-[11px] font-extrabold px-2.5 rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0"
              aria-label="Sign in with Google"
            >
              <Cloud size={12} className="shrink-0" />
            </button>
          )}
          <button 
            onClick={handlePrint} 
            className="flex items-center justify-center h-9 gap-1.5 bg-[#b91c1c] hover:bg-[#c62828] text-white font-extrabold text-[11px] px-4 rounded-full transition-all cursor-pointer shadow-md shadow-rose-950/20 whitespace-nowrap shrink-0 active:scale-95"
          >
            <Download size={13} className="shrink-0" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10 bg-transparent">
        <div className="hidden lg:block flex-shrink-0 h-full">
          <SectionSidebar activeMode={activeMode} onModeChange={(m) => { setActiveMode(m); if (m === 'studio' || m === 'design') setMobileView('edit') }} onOpenSection={openDrawer} />
        </div>

        <ModeRail activeMode={activeMode} onChangeMode={(m) => { setActiveMode(m); if (m === 'studio' || m === 'design') setMobileView('edit') }} onSettingsClick={() => setIsSettingsOpen(true)} themeColor={themeColor} />

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
            onImportResume={importResumeData}
            onClose={() => setIsSettingsOpen(false)}
            onResetSpace={resetResume}
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onRestoreBackup={restoreFromBackup}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResumeManagerOpen && (
          <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="w-6 h-6 border-2 border-zinc-600 border-t-red-400 rounded-full splash-spinner" /></div>}>
            <ResumeManager
              resumes={resumes} selectedResumeId={selectedResumeId} cloudStatus={cloudStatus}
              onSelect={selectResume} onCreate={createResume} onDuplicate={duplicateResume}
              onRename={renameResume} onDelete={deleteResume}
              onClose={() => setIsResumeManagerOpen(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {createPortal(
        <div className="resume-print-wrapper hidden print:block">
          <div className={`resume-template-print-wrapper template-${selectedTemplate} cut-style-${stylePrefs?.sectionCutStyle || 'none'} ${stylePrefs?.bodyFont ? 'has-custom-body-font' : ''} ${stylePrefs?.headingFont ? 'has-custom-heading-font' : ''}`}
               style={{
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
                 ...stylePrefsToCssVars(stylePrefs),
               } as React.CSSProperties}>
          <TemplateRenderer type={selectedTemplate} data={resumeData} sectionOrder={sectionOrder} themeColor={themeColor} />
          </div>
        </div>,
        document.body
      )}

      {activeWarnings && <ExportWarningModal warnings={activeWarnings} onClose={dismissWarnings} onExportAnyway={exportAnyway} />}
      {showPrintModal && <PrintSettingsModal onClose={dismissPrintModal} onContinue={confirmPrint} />}
      <AnimatePresence>
        {showAiGuide && (
          <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="w-6 h-6 border-2 border-zinc-600 border-t-red-400 rounded-full splash-spinner" /></div>}>
            <AiOnboardingModal
              onClose={() => setShowAiGuide(false)}
              onImport={(data) => importResumeData(data)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcuts && (
          <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="w-6 h-6 border-2 border-zinc-600 border-t-red-400 rounded-full splash-spinner" /></div>}>
            <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}
