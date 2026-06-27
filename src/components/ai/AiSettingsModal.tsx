import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sparkles, CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff, ExternalLink, Zap, Shield, Trash2, Infinity
} from 'lucide-react'
import { useAi } from '../../hooks/useAi'
import { validateAiKey, PROVIDER_META } from '../../services/aiService'
import type { AiProvider, AiConfig } from '../../services/aiService'

interface AiSettingsModalProps {
  onClose: () => void
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

const PROVIDERS: AiProvider[] = ['groq', 'nvidia', 'gemini']

export default function AiSettingsModal({ onClose }: AiSettingsModalProps) {
  const { config, isUsingAppKey, saveConfig, clearConfig } = useAi()

  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(
    isUsingAppKey ? 'groq' : (config?.provider ?? 'groq')
  )
  const [apiKey, setApiKey] = useState(isUsingAppKey ? '' : (config?.apiKey ?? ''))
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>('button, input')
    el?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleTest = useCallback(async () => {
    if (!apiKey.trim()) return
    setTestStatus('testing')
    setTestMessage('')
    const result = await validateAiKey({ provider: selectedProvider, apiKey: apiKey.trim() })
    if (result.valid) {
      setTestStatus('success')
      setTestMessage(`Connected · ${result.model}`)
    } else {
      setTestStatus('error')
      setTestMessage(result.error || 'Connection failed. Check your API key.')
    }
  }, [apiKey, selectedProvider])

  const handleSave = useCallback(() => {
    if (!apiKey.trim()) return
    const cfg: AiConfig = {
      provider: selectedProvider,
      apiKey: apiKey.trim(),
      model: PROVIDER_META[selectedProvider].model,
    }
    saveConfig(cfg)
    onClose()
  }, [apiKey, selectedProvider, saveConfig, onClose])

  const handleUseAppKey = useCallback(() => {
    clearConfig() // resets to APP_DEFAULT_CONFIG
    onClose()
  }, [clearConfig, onClose])

  const meta = PROVIDER_META[selectedProvider]
  const canSave = apiKey.trim().length > 10 && testStatus !== 'error'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-settings-heading"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
        className="relative z-10 w-full max-w-[460px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #111116 0%, #0d0d10 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <div>
            <h2 id="ai-settings-heading" className="text-sm font-bold text-white">AI Settings</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Powered by Llama 3.3 70B · Groq</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Current Mode Banner */}
          {isUsingAppKey ? (
            <div
              className="flex items-start gap-3 p-3.5 rounded-xl"
              style={{ background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.2)' }}
            >
              <div className="w-7 h-7 rounded-lg bg-[#b91c1c]/15 border border-[#b91c1c]/25 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-[#b91c1c]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white">Seve AI is active</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                  You're using Seve's built-in AI — <span className="text-zinc-400">25 free requests/day</span>, no setup needed. Add your own key below for unlimited access.
                </p>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold text-[#b91c1c]/70 bg-[#b91c1c]/10 px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-[#b91c1c] animate-pulse" />
                Active
              </span>
            </div>
          ) : (
            <div
              className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer group"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={handleUseAppKey}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">Switch to Seve AI (free)</p>
                  <p className="text-[10px] text-zinc-600">25 requests/day · No setup</p>
                </div>
              </div>
              <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">Use →</span>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Or use your own key</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Provider Selection */}
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Choose Provider (all free)</p>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map(p => {
                const m = PROVIDER_META[p]
                const isActive = selectedProvider === p
                return (
                  <button
                    key={p}
                    onClick={() => { setSelectedProvider(p); setTestStatus('idle'); setTestMessage('') }}
                    className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#b91c1c]/10 border-[#b91c1c]/35 shadow-[0_0_16px_rgba(185,28,28,0.06)]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-zinc-400'}`}>{m.label}</span>
                    <span className={`text-[9px] leading-tight ${isActive ? 'text-[#b91c1c]/70' : 'text-zinc-600'}`}>{m.freeTier}</span>
                  </button>
                )
              })}
            </div>
            <a
              href={meta.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[10px] text-zinc-600 hover:text-[#b91c1c] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Get your free {meta.label} API key →
            </a>
          </div>

          {/* API Key Input */}
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Paste API Key</p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setTestStatus('idle'); setTestMessage('') }}
                placeholder={meta.placeholder}
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-zinc-700 outline-none font-mono transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test + Privacy */}
          <div className="space-y-2">
            <button
              onClick={handleTest}
              disabled={!apiKey.trim() || testStatus === 'testing'}
              className={`w-full h-9 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border cursor-pointer ${
                testStatus === 'testing' || !apiKey.trim()
                  ? 'text-zinc-600 border-white/5 cursor-not-allowed'
                  : 'text-zinc-300 border-white/7 hover:border-white/15 hover:text-white active:scale-[0.98]'
              }`}
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {testStatus === 'testing'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Testing...</>
                : <><Zap className="w-3.5 h-3.5 text-[#b91c1c]" />Test Connection</>}
            </button>

            <AnimatePresence>
              {testMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 text-[11px] font-medium px-3 py-2 rounded-lg ${
                    testStatus === 'success'
                      ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/15'
                      : 'text-red-400 bg-red-500/5 border border-red-500/15'
                  }`}
                >
                  {testStatus === 'success'
                    ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  {testMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Shield className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-zinc-600 leading-relaxed">
                Your key is stored <span className="text-zinc-400">only in your browser</span>. Never sent to Seve's servers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center gap-2">
          {!isUsingAppKey && (
            <button
              onClick={() => { clearConfig(); setApiKey(''); setTestStatus('idle'); setTestMessage('') }}
              className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 hover:text-red-400 transition-colors cursor-pointer px-2 py-1.5 rounded-lg"
            >
              <Trash2 className="w-3 h-3" />
              Remove key
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white rounded-xl transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              canSave
                ? 'bg-[#b91c1c] hover:bg-[#c62828] text-white shadow-lg shadow-rose-950/30 active:scale-[0.97]'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
            style={canSave ? {} : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Infinity className="w-3.5 h-3.5" />
            Save & Use My Key
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
