import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import type { ResumeData, ResumeProfile, ResumeStylePreferences, Template, AppState } from '../types/resume'
import { DEFAULT_STYLE_PREFS } from '../types/resume'
import { stylePrefsToCssVars } from '../utils/stylePrefsToCssVars'
import { useResume } from '../hooks/useResume'
import { usePrintResume } from '../hooks/usePrintResume'
import type { SectionType } from '../components/SectionSidebar'
import ModeRail from '../components/ModeRail'
import SectionDrawer from '../components/SectionDrawer'
import TemplateRenderer from '../components/TemplateRenderer'
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal'
import ResumeManager from '../components/ResumeManager'
import { Download, ArrowLeft, CheckCircle2, Settings, RefreshCw, X, FileCode, LogOut, LogIn, ChevronDown, Cloud, HardDrive, AlertCircle, Sparkles, Upload, Undo, Redo, MoreVertical } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { normalizeResumeData } from '../utils/resumeNormalizer'
import AiOnboardingModal from '../components/AiOnboardingModal'
import AiSettingsModal from '../components/ai/AiSettingsModal'
import ConfirmDialog from '../components/ConfirmDialog'



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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const firstFocusable = containerRef.current?.querySelector('button, textarea, input, select') as HTMLElement
    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll('button, textarea, input, select, [tabindex="0"]')
        if (focusables.length === 0) return
        const first = focusables[0] as HTMLElement
        const last = focusables[focusables.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div role="dialog" aria-labelledby="export-dialog-heading" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print select-none">
      <div className="absolute inset-0" onClick={onClose} />
      <div ref={containerRef} className="bg-[#0c0d12] border border-[#b91c1c]/25 rounded-2xl p-6 md:p-8 w-[640px] max-w-full shadow-2xl shadow-[#b91c1c]/5 animate-scale-in overflow-hidden relative">
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
                <h3 id="export-dialog-heading" className="text-sm font-extrabold tracking-tight text-white uppercase font-display">Export to PDF</h3>
                <p className="text-[11px] text-zinc-400">Configure browser settings for a perfect PDF</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] leading-relaxed">
                <span className="text-[#b91c1c] shrink-0 font-bold font-mono text-xs">1.</span>
                <div>
                  <p className="text-white font-bold text-xs">Set Destination to "Save as PDF"</p>
                  <p className="text-zinc-400 mt-0.5">This tells your browser to generate a high-quality PDF file instead of sending it to a physical printer.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] leading-relaxed">
                <span className="text-amber-450 shrink-0 font-bold font-mono text-xs">2.</span>
                <div>
                  <p className="text-white font-bold text-xs">Change Margins to "None"</p>
                  <p className="text-zinc-400 mt-0.5">Under <span className="text-zinc-300 font-semibold">More Settings</span>, set Margins to None to prevent white spacing borders.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] leading-relaxed">
                <span className="text-purple-400 shrink-0 font-bold font-mono text-xs">3.</span>
                <div>
                  <p className="text-white font-bold text-xs">Enable Background Graphics</p>
                  <p className="text-zinc-400 mt-0.5">Check the box for Background Graphics to preserve all template colors, accents, and custom styling.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 font-display">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer">Cancel</button>
              <button onClick={onContinue} className="flex-1 h-10 rounded-xl bg-[#b91c1c] hover:bg-[#c62828] text-white font-extrabold text-xs shadow-lg shadow-rose-950/20 transition-all cursor-pointer">Open Print Dialog</button>
            </div>
          </div>

          {/* Right Side: Visual Mockup */}
          <div className="w-full md:w-[240px] bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col font-sans shrink-0">
            {/* Mockup Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-display">Browser Print Settings</span>
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
                <div className="bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1 flex items-center justify-between text-zinc-400">
                  <span>All</span>
                  <span className="text-zinc-700">▼</span>
                </div>
              </div>

              {/* More settings expander */}
              <div className="py-1 border-t border-b border-zinc-900 flex items-center justify-between text-zinc-400 font-semibold cursor-default">
                <span>More settings</span>
                <span>▲</span>
              </div>

              {/* Paper size */}
              <div className="space-y-1">
                <label className="text-zinc-500 font-bold block">Paper size</label>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1 flex items-center justify-between text-zinc-400">
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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const firstFocusable = containerRef.current?.querySelector('button, textarea, input, select') as HTMLElement
    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll('button, textarea, input, select, [tabindex="0"]')
        if (focusables.length === 0) return
        const first = focusables[0] as HTMLElement
        const last = focusables[focusables.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div role="dialog" aria-labelledby="review-dialog-heading" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
      <div className="absolute inset-0" onClick={onClose} />
      <div ref={containerRef} className="bg-[#12131a] border border-[#b91c1c]/20 rounded-2xl p-4 sm:p-6 w-[480px] max-w-full shadow-2xl shadow-[#b91c1c]/5 animate-scale-in relative">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 id="review-dialog-heading" className="text-sm font-extrabold tracking-tight text-white uppercase font-display">Export Review</h3>
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

interface SimpleSettingsModalProps {
  selectedTemplate: Template
  onUpdateTemplate: (template: Template) => void
  onImportResume: (data: ResumeData) => void
  onClose: () => void
  onRequestReset?: () => void
  resumes: Record<string, ResumeProfile>
  selectedResumeId: string
  onRestoreBackup: (backup: AppState) => void
  onOpenJsonPaste: () => void
}

function SimpleSettingsModal({ selectedTemplate, onUpdateTemplate, onImportResume, onClose, onRequestReset, resumes, selectedResumeId, onRestoreBackup, onOpenJsonPaste }: SimpleSettingsModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const firstFocusable = containerRef.current?.querySelector('button, textarea, input, select') as HTMLElement
    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll('button, textarea, input, select, [tabindex="0"]')
        if (focusables.length === 0) return
        const first = focusables[0] as HTMLElement
        const last = focusables[focusables.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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
    setTimeout(() => URL.revokeObjectURL(url), 1000)
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
          } else if (rawData?.resumeData) {
            const data = normalizeResumeData(rawData.resumeData)
            onImportResume(data)
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

  return createPortal(
    <div role="dialog" aria-labelledby="settings-dialog-heading" aria-modal="true" onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
      <div ref={containerRef} onClick={(e) => e.stopPropagation()} className="bg-[#12131a] border border-[#b91c1c]/20 rounded-2xl p-5 sm:p-6 w-full max-w-[460px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-[#b91c1c]/5 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#b91c1c]/10 border border-[#b91c1c]/30 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-[#b91c1c]" />
            </div>
            <div>
              <h3 id="settings-dialog-heading" className="text-sm font-extrabold tracking-tight text-white uppercase font-display">Settings</h3>
              <p className="text-[11px] text-zinc-400">Manage your resume configuration</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close settings" className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer active:scale-95">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-display">Default Template</label>
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
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-display">Data Management</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleExport} className="h-10 rounded-xl bg-zinc-950/40 border border-zinc-800 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                <Download className="w-3.5 h-3.5 text-zinc-400" /> Backup
              </button>
              <button onClick={handleImport} className="h-10 rounded-xl bg-zinc-950/40 border border-zinc-800 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-zinc-400" /> Import File
              </button>
              <button onClick={onOpenJsonPaste} className="h-10 rounded-xl bg-zinc-950/40 border border-zinc-800 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                <FileCode className="w-3.5 h-3.5 text-zinc-400" /> Paste JSON
              </button>
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/80">
            <button onClick={() => { onRequestReset?.() }} className="w-full h-10 rounded-xl bg-red-500/5 border border-red-950/30 hover:bg-red-500/10 text-red-450 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Reset Resume Data
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

declare global {
  interface Window {
    google?: any
  }
}

interface GoogleSignInModalProps {
  onClose: () => void
  onSuccess: (idToken: string) => Promise<void>
}

function GoogleSignInModal({ onClose, onSuccess }: GoogleSignInModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'your-google-client-id-here.apps.googleusercontent.com') {
      setError('Google Client ID is not configured in the environment (.env file).')
      return
    }

    let isMounted = true;
    const initGoogle = () => {
      if (window.google) {
        if (!isMounted) return;
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              setIsLoading(true)
              setError(null)
              try {
                await onSuccess(response.credential)
                onClose()
              } catch (err: any) {
                setError(err?.message || 'Authentication failed. Please try again.')
              } finally {
                setIsLoading(false)
              }
            },
          })

          const btnElement = document.getElementById('google-signin-btn-container');
          if (btnElement) {
            window.google.accounts.id.renderButton(btnElement, {
              theme: 'filled_blue',
              size: 'large',
              width: 320,
              shape: 'pill',
              locale: 'en',
            })
          }
        } catch (err: any) {
          setError('Failed to initialize Google Sign-in.')
        }
      } else {
        setTimeout(initGoogle, 100)
      }
    }

    initGoogle()
    return () => {
      isMounted = false;
    }
  }, [onSuccess, onClose])

  return createPortal(
    <div role="dialog" aria-labelledby="signin-dialog-heading" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
      <div className="absolute inset-0" onClick={onClose} />
      <div ref={containerRef} className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 w-[420px] max-w-full shadow-2xl shadow-rose-950/10 animate-scale-in relative overflow-hidden text-center" onClick={(e) => e.stopPropagation()}>
        {/* Glow ambient */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#b91c1c]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-end mb-2 relative z-10">
          <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 pb-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#b91c1c]/10 border border-[#b91c1c]/30 flex items-center justify-center text-[#b91c1c] shrink-0 mb-2">
            <Cloud className="w-6 h-6 animate-pulse" />
          </div>
          
          <div>
            <h3 id="signin-dialog-heading" className="text-base font-extrabold tracking-tight text-white uppercase font-display">Sync with Cloud</h3>
            <p className="text-[12px] text-zinc-400 mt-1.5 max-w-[320px] mx-auto font-sans leading-relaxed">
              Sign in with Google to automatically backup your resumes and access them across all of your devices.
            </p>
          </div>

          <div className="w-full flex justify-center py-4 relative min-h-[44px]">
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 animate-pulse">
                <RefreshCw size={14} className="animate-spin text-[#b91c1c]" /> Authenticating...
              </div>
            ) : (
              <div id="google-signin-btn-container" className="w-[320px] flex justify-center select-none" />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/5 border border-red-950/30 text-[11px] text-red-400 font-bold max-w-[320px] text-left">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-[10px] text-zinc-500 max-w-[280px] font-sans leading-normal">
            By signing in, you agree to our Privacy Policy. We only store your public profile and email.
          </p>
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
    undo, redo, canUndo, canRedo,
  } = useResume()
  const { user, signInWithGoogleToken, signOut } = useAuth()
  const [isGoogleSignInOpen, setIsGoogleSignInOpen] = useState(false)

  // Attempt Google One Tap prompt on mount if user is not authenticated
  useEffect(() => {
    if (user) return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'your-google-client-id-here.apps.googleusercontent.com') return

    let isMounted = true
    const initOneTap = () => {
      if (window.google) {
        if (!isMounted) return
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              try {
                await signInWithGoogleToken(response.credential)
              } catch (err) {
                console.error('One Tap authentication failed:', err)
              }
            },
          })
          window.google.accounts.id.prompt()
        } catch (err) {
          console.error('Failed to initialize Google One Tap:', err)
        }
      } else {
        setTimeout(initOneTap, 100)
      }
    }

    initOneTap()
    return () => {
      isMounted = false
    }
  }, [user, signInWithGoogleToken])

  useEffect(() => {
    if (!localStorage.getItem('seve_mobile_onboarded')) {
      localStorage.setItem('seve_mobile_onboarded', '1')
      if (window.innerWidth < 1024) {
        setTimeout(() => setShowAiGuide(true), 800)
      }
    }
  }, [])


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

  
  const themeColor = activeResume?.themeColor ?? '#b91c1c'
  const setThemeColor = useCallback((color: string) => {
    updateActiveResume(prev => ({ ...prev, themeColor: color }))
  }, [updateActiveResume])

  const templateFontSize = activeResume?.templateFontSize || 10
  const setTemplateFontSize = useCallback((size: number) => {
    updateActiveResume(prev => ({ ...prev, templateFontSize: size }))
  }, [updateActiveResume])

  const templateFontWeight = activeResume?.templateFontWeight || 400
  const setTemplateFontWeight = useCallback((weight: number) => {
    updateActiveResume(prev => ({ ...prev, templateFontWeight: weight }))
  }, [updateActiveResume])

  const stylePrefs = useMemo(
    () => activeResume?.stylePrefs ?? { ...DEFAULT_STYLE_PREFS },
    [activeResume?.stylePrefs]
  )

  const resumeDataRef = useRef(resumeData)
  const pageCountRef = useRef(pageCount)
  useEffect(() => {
    resumeDataRef.current = resumeData
    pageCountRef.current = pageCount
  })

  const { activeWarnings, showPrintModal, handlePrint: handlePrintModal, dismissWarnings, exportAnyway, dismissPrintModal, confirmPrint } = usePrintResume()
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const [isResumeManagerOpen, setIsResumeManagerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [aiOnboardingTab, setAiOnboardingTab] = useState<'wizard' | 'json'>('wizard')
  const [showMobileAiSettings, setShowMobileAiSettings] = useState(false)
  const [confirmReset1, setConfirmReset1] = useState(false)
  const [confirmReset2, setConfirmReset2] = useState(false)

  const handlePrint = useCallback(() => {
    handlePrintModal(resumeDataRef.current, pageCountRef.current)
  }, [handlePrintModal])

  const handlePrintRef = useRef(handlePrint)
  const saveChangesRef = useRef(saveChangesToCloud)
  useEffect(() => {
    handlePrintRef.current = handlePrint
    saveChangesRef.current = saveChangesToCloud
  })

  // Keyboard shortcuts: Ctrl+P -> Print / Save as PDF, Ctrl+S -> save to cloud
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        handlePrintRef.current()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (user) saveChangesRef.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [user])

  const openDrawer = useCallback((sec: SectionType) => setActiveStudioSection(sec), [])
  const closeDrawer = () => setActiveStudioSection(null)


  const resetResume = () => {
    setConfirmReset2(true)
  }

  const executeResetResume = () => {
    importResumeData({ contact: { fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' }, summary: '', experience: [], education: [], skills: [], languages: [], projects: [] })
    setConfirmReset2(false)
  }

  const editorContext = useMemo<EditorContextType>(() => ({
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
  }), [
    activeMode, openDrawer, activeStudioSection, pageCount, templateFontSize,
    templateFontWeight, stylePrefs, sectionOrder, mobileView, themeColor,
    handlePrint, showAiGuide, setActiveMode, setActiveStudioSection, setPageCount,
    setTemplateFontSize, setTemplateFontWeight, updateStylePrefs, updateSectionOrder,
    setMobileView, setThemeColor, setShowAiGuide,
  ])

  return (
    <div 
      className="select-none h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute inset-0 premium-grid opacity-30" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <header className="relative z-40 flex items-center justify-between gap-2 px-2 sm:px-5 h-[52px] sm:h-14 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.06] no-print flex-shrink-0 overflow-visible">
        {/* Zone 1 — Left: Navigation & Identity */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
          {/* Back button */}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center justify-center w-9 h-9 sm:h-8 sm:w-auto sm:gap-1 text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] sm:px-2.5 rounded-full transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <ArrowLeft size={15} className="shrink-0" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Logo — desktop only */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 min-w-0">
            <div className="flex items-center select-none">
              <span className="relative font-serif text-sm font-bold text-white leading-none" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                S<span className="absolute top-0 -right-1 w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
              </span>
              <span className="font-serif text-sm font-bold text-white leading-none pl-1.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>eve</span>
            </div>
          </div>

          {/* Resume name pill */}
          <button 
            onClick={() => setIsResumeManagerOpen(true)} 
            className="flex items-center h-9 sm:h-8 gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-2.5 sm:px-3 rounded-full transition-all cursor-pointer hover:border-white/[0.1] min-w-0 shrink-0 max-w-[140px] sm:max-w-[200px] active:scale-[0.98]"
          >
            <span className="truncate">{activeResume?.title || 'My Resume'}</span>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[9px] bg-white/[0.06] text-zinc-400 rounded-full border border-white/[0.06] font-mono shrink-0 min-w-4 h-4 items-center justify-center">
              {Object.keys(resumes || {}).length}
            </span>
            <ChevronDown size={11} className="shrink-0 text-zinc-500" />
          </button>
        </div>

        {/* Zone 2 — Center: Cloud Status (Desktop: pill, Mobile: icon) */}
        <div className="flex flex-1 items-center justify-center sm:gap-3 min-w-0">
          {/* Desktop: Undo/Redo + Cloud Pill */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.06] rounded-full p-0.5">
              <button
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo"
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white disabled:text-zinc-700 hover:bg-white/[0.06] disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <Undo size={13} />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo"
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white disabled:text-zinc-700 hover:bg-white/[0.06] disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <Redo size={13} />
              </button>
            </div>
            <div
              className={`flex items-center gap-2 px-3.5 h-8 rounded-full border text-[10px] font-semibold tracking-wide transition-all duration-500 w-[140px] justify-center ${
                cloudStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : isSaving || cloudStatus === 'syncing' ? 'bg-amber-500/8 border-amber-500/20 text-amber-400'
                : cloudStatus === 'synced' ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
                : cloudStatus === 'unsaved' ? 'bg-amber-500/8 border-amber-500/20 text-amber-400'
                : 'bg-white/[0.03] border-white/[0.06] text-zinc-500'
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
                <button onClick={saveChangesToCloud} className="shrink-0 text-white hover:text-zinc-200 transition-colors cursor-pointer font-bold ml-0.5 inline-flex items-center" title="Save now">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 align-middle" />Save
                </button>
              )}
            </div>
          </div>

          {/* Mobile: Cloud status — glass icon */}
          <div
            className={`flex sm:hidden items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
              cloudStatus === 'error' ? 'bg-red-500/10 text-red-400'
              : isSaving || cloudStatus === 'syncing' ? 'bg-amber-500/10 text-amber-400'
              : cloudStatus === 'synced' ? 'bg-emerald-500/10 text-emerald-400'
              : cloudStatus === 'unsaved' ? 'bg-amber-500/10 text-amber-400'
              : 'bg-white/[0.04] text-zinc-500'
            }`}
            title={cloudStatus === 'synced' ? 'Cloud saved' : cloudStatus === 'error' ? 'Sync error' : isSaving ? 'Saving…' : 'Local'}
          >
            {cloudStatus === 'error' ? (
              <AlertCircle size={15} />
            ) : isSaving || cloudStatus === 'syncing' ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : cloudStatus === 'synced' ? (
              <Cloud size={15} />
            ) : cloudStatus === 'unsaved' ? (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            ) : (
              <HardDrive size={15} />
            )}
          </div>
        </div>

        {/* Zone 3 — Right: Primary & Secondary Actions */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0">
          {/* AI Fill (Desktop only) */}
          <button 
            onClick={() => setShowAiGuide(true)} 
            className="hidden sm:flex items-center justify-center h-8 gap-1 border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-bold text-[11px] px-3 rounded-full transition-all cursor-pointer shrink-0"
          >
            <Sparkles size={12} className="shrink-0" />
            <span className="hidden lg:inline">AI Fill</span>
          </button>
          
          {/* ATS (Desktop only) */}
          <button 
            onClick={() => setActiveMode('analyze')} 
            className={`hidden md:flex items-center justify-center h-8 gap-1 border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-bold text-[11px] px-3 rounded-full transition-all cursor-pointer shrink-0 ${activeMode === 'analyze' ? 'bg-white/[0.08] border-white/[0.12] text-white' : ''}`}
          >
            <CheckCircle2 size={12} className="shrink-0" />
            <span className="hidden lg:inline">ATS</span>
          </button>
          
          {/* Settings (Desktop only) */}
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            aria-label="Settings"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0" 
            title="Settings"
          >
            <Settings size={14} className="shrink-0" />
          </button>
          
          {/* User profile (Desktop only) */}
          {user ? (
            <div className="hidden sm:block relative shrink-0">
              <button 
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)} 
                onBlur={() => setTimeout(() => setShowUserMenu(false), 150)} 
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-label="Open account menu"
                className="flex items-center h-8 gap-1 border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-extrabold px-1.5 rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0"
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
              onClick={() => setIsGoogleSignInOpen(true)}
              className="hidden sm:flex items-center h-8 gap-1.5 border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-extrabold px-3 rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0"
              aria-label="Sign in with Google"
            >
              <LogIn size={12} className="shrink-0" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Export PDF (Desktop only) */}
          <button 
            onClick={handlePrint} 
            className="hidden sm:flex items-center justify-center h-9 gap-1.5 bg-[var(--accent)] hover:brightness-110 text-white font-extrabold text-[11px] px-4 rounded-full transition-all cursor-pointer shadow-lg shadow-[var(--accent)]/20 whitespace-nowrap shrink-0 active:scale-95"
          >
            <Download size={13} className="shrink-0" />
            <span>Export PDF</span>
          </button>

          {/* Mobile: Export — accent glass button */}
          <button
            onClick={handlePrint}
            className="flex sm:hidden items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer shrink-0 active:scale-90 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent))', boxShadow: '0 4px 12px rgba(var(--accent), 0.3)' }}
            aria-label="Export PDF"
          >
            <Download size={15} className="text-white" />
          </button>

          {/* Mobile: Overflow — glass dot menu */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex sm:hidden items-center justify-center w-9 h-9 rounded-full border transition-all cursor-pointer shrink-0 active:scale-90 ${
              isMobileMenuOpen 
                ? 'bg-white/[0.1] border-white/[0.12] text-white' 
                : 'bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
            aria-label="More options"
          >
            <MoreVertical size={16} className="shrink-0" />
          </button>

          {/* Floating Mobile Overflow Menu — premium bottom sheet */}
          {createPortal(
            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm no-print"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  {/* Menu panel - bottom sheet */}
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="fixed bottom-0 left-0 right-0 z-[95] no-print bg-zinc-950 border-t border-zinc-800/80 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] overflow-hidden"
                  >
                    {/* Grabber handle */}
                    <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto my-3.5 shrink-0" />

                    {/* Cloud status row */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-900">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{
                        background: cloudStatus === 'synced' ? '#34d399'
                          : cloudStatus === 'error' ? '#f87171'
                          : cloudStatus === 'unsaved' || isSaving ? '#fbbf24'
                          : '#52525b',
                        boxShadow: cloudStatus === 'synced' ? '0 0 8px rgba(52,211,153,0.4)' : 'none'
                      }} />
                      <span className="text-[12px] text-zinc-300 flex-1 font-bold">
                        {cloudStatus === 'error' ? 'Sync error'
                          : isSaving || cloudStatus === 'syncing' ? 'Saving changes…'
                          : cloudStatus === 'synced' ? 'Cloud saved'
                          : cloudStatus === 'unsaved' ? 'Unsaved changes'
                          : 'Saved locally'}
                      </span>
                      {cloudStatus === 'unsaved' && !isSaving && (
                        <button
                          onClick={() => { saveChangesToCloud(); setIsMobileMenuOpen(false) }}
                          className="text-xs font-bold text-[var(--accent)] hover:opacity-80 transition-opacity cursor-pointer px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/10"
                        >
                          Save now
                        </button>
                      )}
                    </div>

                    {/* Scrollable actions container */}
                    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-12 space-y-5 custom-scrollbar">
                      {/* AI section */}
                      <div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em] px-3 pb-2">AI Copilot</p>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => { setAiOnboardingTab('wizard'); setShowAiGuide(true); setIsMobileMenuOpen(false) }}
                            className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-[13px] font-bold text-zinc-300 hover:text-white bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900/60 transition-all cursor-pointer text-left active:scale-[0.98]"
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.15), rgba(185,28,28,0.05))', border: '1px solid rgba(185,28,28,0.2)' }}>
                              <Sparkles size={15} className="text-[var(--accent)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-bold">AI Autofill</div>
                              <div className="text-[10px] text-zinc-500 font-normal">Import from LinkedIn / PDF</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowMobileAiSettings(true); setIsMobileMenuOpen(false) }}
                            className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-[13px] font-bold text-zinc-300 hover:text-white bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900/60 transition-all cursor-pointer text-left active:scale-[0.98]"
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.15), rgba(185,28,28,0.05))', border: '1px solid rgba(185,28,28,0.2)' }}>
                              <Sparkles size={15} className="text-[var(--accent)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-bold">Seve AI Settings</div>
                              <div className="text-[10px] text-zinc-500 font-normal">Free · 25 calls/day · Tap to manage</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Tools section */}
                      <div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em] px-3 pb-2">Tools & Utilities</p>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => { setActiveMode('analyze'); setIsMobileMenuOpen(false) }}
                            className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-[13px] font-bold text-zinc-300 hover:text-white bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900/60 transition-all cursor-pointer text-left active:scale-[0.98]"
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <CheckCircle2 size={15} className="text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-bold">ATS Checker</div>
                              <div className="text-[10px] text-zinc-500 font-normal">Check score and bullet guidelines</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false) }}
                            className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-[13px] font-bold text-zinc-300 hover:text-white bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900/60 transition-all cursor-pointer text-left active:scale-[0.98]"
                          >
                            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                              <Settings size={15} className="text-zinc-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-bold">Settings</div>
                              <div className="text-[10px] text-zinc-500 font-normal">Reset space, backup and templates</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Account section */}
                      <div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em] px-3 pb-2">Account</p>
                        <div className="space-y-2">
                          {user ? (
                            <>
                              <div className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl bg-zinc-900/40 border border-zinc-900/60">
                                {user.user_metadata?.avatar_url ? (
                                  <img src={user.user_metadata.avatar_url} alt="" className="w-9 h-9 rounded-full shrink-0 ring-2 ring-white/[0.08]" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                                    {user.email?.[0] || 'U'}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-bold text-zinc-300 truncate">{user.email}</div>
                                  <div className="text-[10px] text-zinc-500 font-normal">Logged in via Cloud Sync</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => { signOut(); setIsMobileMenuOpen(false) }}
                                className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-[13px] font-bold text-rose-400 hover:text-rose-350 bg-rose-950/15 hover:bg-rose-950/25 border border-rose-500/20 transition-all cursor-pointer text-left active:scale-[0.98]"
                              >
                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                                  <LogOut size={15} className="text-rose-400" />
                                </div>
                                Sign Out
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setIsGoogleSignInOpen(true); setIsMobileMenuOpen(false) }}
                              className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-[13px] font-bold text-zinc-300 hover:text-white bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900/60 transition-all cursor-pointer text-left active:scale-[0.98]"
                            >
                              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                                <LogIn size={15} className="text-zinc-400" />
                              </div>
                              Sign In
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10 bg-transparent">
        <ModeRail activeMode={activeMode} onChangeMode={(m) => { setActiveMode(m); if (m === 'studio' || m === 'design') setMobileView('edit') }} onSettingsClick={() => setIsSettingsOpen(true)} />

        <div id="main-content" className="flex flex-1 flex-row overflow-hidden relative bg-transparent pb-16 lg:pb-0">
          <Outlet context={editorContext} />
        </div>
      </div>

      <AnimatePresence>
        {activeStudioSection && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm pointer-events-auto no-print" />
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
            onRequestReset={() => setConfirmReset1(true)}
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onRestoreBackup={restoreFromBackup}
            onOpenJsonPaste={() => {
              setIsSettingsOpen(false)
              setAiOnboardingTab('json')
              setShowAiGuide(true)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResumeManagerOpen && (
          <ResumeManager
            resumes={resumes} selectedResumeId={selectedResumeId} cloudStatus={cloudStatus}
            onSelect={selectResume} onCreate={createResume} onDuplicate={duplicateResume}
            onRename={renameResume} onDelete={deleteResume}
            onClose={() => setIsResumeManagerOpen(false)}
          />
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
          <AiOnboardingModal
            onClose={() => setShowAiGuide(false)}
            onImport={(data) => importResumeData(data)}
            initialTab={aiOnboardingTab}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcuts && (
          <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMobileAiSettings && (
          <AiSettingsModal onClose={() => setShowMobileAiSettings(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGoogleSignInOpen && (
          <GoogleSignInModal 
            onClose={() => setIsGoogleSignInOpen(false)} 
            onSuccess={signInWithGoogleToken} 
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmReset1}
        title="Reset Resume?"
        description="Reset all resume data for this version? This cannot be undone."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => { resetResume(); setIsSettingsOpen(false); setConfirmReset1(false) }}
        onCancel={() => setConfirmReset1(false)}
      />
      <ConfirmDialog
        open={confirmReset2}
        title="Reset Resume Version?"
        description="All your current data for this version will be lost."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        destructive
        onConfirm={executeResetResume}
        onCancel={() => setConfirmReset2(false)}
      />
    </div>

  )
}
