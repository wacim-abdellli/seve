import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import type { ResumeData, Template } from '../types/resume'
import { useToast } from '../hooks/useToast'
import { supabase } from '../utils/supabaseClient'
import type { User } from '@supabase/supabase-js'
import { Cloud, ShieldAlert, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react'

interface SettingsModalProps {
  apiKey: string
  onUpdateApiKey: (key: string) => void
  selectedTemplate: Template
  onUpdateTemplate: (template: Template) => void
  resumeData: ResumeData
  onImportResume: (data: ResumeData) => void
  onClose: () => void
  user: User | null
  isSyncing: boolean
  lastSynced: string | null
  onResetSpace?: () => void
}

export default function SettingsModal({
  apiKey,
  onUpdateApiKey,
  selectedTemplate,
  onUpdateTemplate,
  resumeData,
  onImportResume,
  onClose,
  user,
  isSyncing,
  lastSynced,
  onResetSpace,
}: SettingsModalProps) {

  const { showToast } = useToast()
  const [showKey, setShowKey] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [pasteContent, setPasteContent] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error')
      return
    }
    try {
      setAuthLoading(true)
      if (isSignUpMode) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        showToast('Registration successful! Please check your email inbox to verify.', 'success')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        showToast('Logged in successfully!', 'success')
      }
      setEmail('')
      setPassword('')
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'Authentication failed', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return
    try {
      setAuthLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      showToast('Signed out successfully!', 'success')
    } catch (error: any) {
      showToast(error.message || 'Logout failed', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSave = () => {
    onUpdateApiKey(tempKey)
    showToast('Settings saved successfully!', 'success')
    onClose()
  }

  const handleExport = () => {
    const json = JSON.stringify(resumeData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume_${resumeData.contact.fullName.replace(/\s+/g, '_') || 'data'}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Resume data exported successfully!', 'success')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      try {
        const parsed = JSON.parse(content)
        if (parsed && typeof parsed === 'object' && parsed.contact) {
          onImportResume(parsed)
          showToast('Resume data imported successfully!', 'success')
        } else {
          showToast('Invalid format. JSON must contain at least a contact object.', 'error')
        }
      } catch {
        showToast('Error parsing JSON. Please ensure it is valid JSON syntax.', 'error')
      }
    }
    reader.readAsText(file)
  }

  const handlePasteImport = () => {
    if (!pasteContent.trim()) {
      showToast('Please paste JSON content first.', 'warning')
      return
    }
    try {
      const parsed = JSON.parse(pasteContent)
      if (parsed && typeof parsed === 'object' && parsed.contact) {
        onImportResume(parsed)
        showToast('Resume data imported successfully!', 'success')
        setPasteContent('')
      } else {
        showToast('Invalid format. JSON must contain at least a contact object.', 'error')
      }
    } catch {
      showToast('Error parsing JSON. Please check your JSON syntax (missing brackets or quotes).', 'error')
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.98, y: 10, filter: 'blur(4px)' }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
        className="relative w-full max-w-[560px] bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              Settings Hub
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Configure engine and layout preferences</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider bg-transparent border-0 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Body Section (scrollable if needed) */}
        <div className="custom-scrollbar overflow-y-auto pr-1 flex-1 mb-5">
          
          {/* Cloud Account & Synchronization Section */}
          <div className="mb-5">
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest border-b border-border pb-1.5 mb-3">
              Cloud Sync & Account
            </h4>

            {!supabase ? (
              /* If Supabase is not configured */
              <div className="bg-zinc-900 border border-border p-4 rounded-xl">
                <div className="flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-xs font-bold block mb-1">CLOUD SYNC DISABLED</strong>
                    <p className="text-[10.5px] text-muted-foreground leading-normal font-light">
                      Supabase credentials are not detected in the environment. The editor is currently operating in <strong className="text-zinc-300">Local-First offline mode</strong>. All changes will remain cached solely inside your browser's LocalStorage.
                    </p>
                  </div>
                </div>
              </div>
            ) : user ? (
              /* If User is Logged In */
              <div className="bg-zinc-900 border border-border p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-950 border border-border">
                      <Cloud className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white uppercase">Sync Active</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]" title={user.email || ''}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={authLoading}
                    className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-border rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-3 h-3 text-red-400 animate-spin" />
                        <span className="text-red-400 font-semibold">Syncing updates...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Database synchronized</span>
                      </>
                    )}
                  </div>
                  {lastSynced && (
                    <div className="text-muted-foreground">
                      Last backup: <span className="font-mono text-zinc-300">{lastSynced}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* If User is Logged Out - Show Auth Form */
              <div className="bg-zinc-900 border border-border p-4 rounded-xl flex flex-col gap-3">
                <form onSubmit={handleAuth} className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-8 rounded-lg border border-border bg-zinc-950 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-8 rounded-lg border border-border bg-zinc-950 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSignUpMode(!isSignUpMode)}
                      className="text-[10px] text-muted-foreground hover:text-zinc-350 underline bg-transparent border-0 cursor-pointer"
                    >
                      {isSignUpMode ? 'Already have account? Sign In' : "No account? Register"}
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="px-3 py-1 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(224, 49, 79,0.05)] cursor-pointer animate-fade-in"
                    >
                      {authLoading && <RefreshCw className="w-3 h-3 animate-spin mr-1 inline" />}
                      {isSignUpMode ? 'Register' : 'Sign In'}
                    </button>
                  </div>
                </form>
                <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                  * Registering enables real-time cloud backups so you can work across devices. Unregistered changes will remain saved locally on this browser.
                </p>
              </div>
            )}
          </div>

          {/* AI Configuration Section */}
          <div className="mb-5">
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest border-b border-border pb-1.5 mb-3">
              AI Intelligence Engine
            </h4>
            <div className="bg-zinc-900 border border-border p-4 rounded-xl flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Cloud API Key (Optional)
                  </label>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] font-bold text-red-400 hover:text-red-300 underline font-semibold"
                  >
                    Get Free Gemini Key
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="h-8 rounded-lg border border-border bg-zinc-950 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="px-3 h-8 bg-zinc-950 hover:bg-zinc-900 border border-border rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic font-light">
                Leaving this blank defaults to the <strong>Free Heuristics Engine</strong>. All data remains local regardless of this setting.
              </p>
            </div>
          </div>

          {/* Template Selection Section */}
          <div className="mb-5">
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest border-b border-border pb-1.5 mb-3">
              Document Aesthetics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'classic', label: 'Classic', desc: 'Serif / Corporate / Standard' },
                { id: 'modern', label: 'Modern', desc: 'Sans / Tech / Minimal' },
                { id: 'executive', label: 'Executive', desc: 'Sidebar / Multi-column / Senior' },
                { id: 'minimalist', label: 'Minimalist', desc: 'Clean / Airy / Aesthetic' },
                { id: 'creative', label: 'Creative', desc: 'Bold / Designer / Dynamic' }
              ].map((t) => {
                const isSelected = selectedTemplate === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onUpdateTemplate(t.id as Template)}
                    className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-1 transition-all relative cursor-pointer ${
                      isSelected 
                        ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_12px_rgba(239, 68, 68,0.1)]' 
                        : 'bg-zinc-900 border-border hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-red-400' : 'text-white'}`}>
                        {t.label}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239, 68, 68,0.5)]" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal font-light">
                      {t.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Data Portability Section */}
          <div>
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest border-b border-border pb-1.5 mb-3">
              Data Portability
            </h4>
            <div className="bg-zinc-900 border border-border p-4 rounded-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-white uppercase">Full Backup Export</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Download your entire resume as a portable JSON file.</p>
                </div>
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-border rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Export JSON
                </button>
              </div>

              <div className="pt-4 border-t border-border/60 flex flex-col gap-3">
                <div>
                  <div className="text-[10px] font-bold text-white uppercase mb-1">Import / Restore Data</div>
                  <p className="text-[10px] text-muted-foreground mb-2">Restore your profile from a JSON backup file or by pasting raw JSON data.</p>
                </div>
                
                {/* File Upload Selector */}
                <div className="relative border border-dashed border-border hover:border-red-500/40 rounded-xl bg-zinc-950/40 hover:bg-zinc-950/80 transition-all p-4 flex flex-col items-center justify-center cursor-pointer text-center h-16">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <span className="text-[10px] font-bold text-white mb-0.5">Choose JSON Backup File</span>
                  <span className="text-[9px] text-muted-foreground">Click to select backup file</span>
                </div>

                <div className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-wider">— OR —</div>

                {/* Paste Textarea */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Paste Raw JSON Data
                  </label>
                  <textarea
                    placeholder='{"contact": { "fullName": "..." }, ...}'
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    className="w-full h-24 bg-zinc-950 border border-border rounded-xl p-3 text-xs text-zinc-300 font-mono resize-none focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10 placeholder:text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={handlePasteImport}
                    className="w-full py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Import Pasted JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-5">
            <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-1.5 mb-3">
              Danger Zone
            </h4>
            <div className="bg-red-950/5 border border-red-900/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-red-400 uppercase">Reset Workspace</div>
                <p className="text-[10px] text-zinc-500 mt-0.5">Delete all your current resume data permanently.</p>
              </div>
              {onResetSpace && (
                <button
                  type="button"
                  onClick={() => {
                    onResetSpace()
                    onClose()
                  }}
                  className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  Reset Space
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-zinc-350 transition-colors font-bold px-3 py-2 bg-transparent border-0 cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all shadow-[0_0_12px_rgba(224, 49, 79,0.05)] cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
