import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, Check, X, RefreshCw } from 'lucide-react'
import { useAi } from '../../hooks/useAi'
import { aiComplete, aiStream } from '../../services/aiService'
import AiSettingsModal from './AiSettingsModal'

type Status = 'idle' | 'loading' | 'done' | 'error'

interface AiFixButtonProps {
  prompt: string
  onAccept: (result: string) => void
  label?: string
  size?: 'xs' | 'sm' | 'md'
  mode?: 'complete' | 'stream'
  className?: string
  suggestionLabel?: string
}

export default function AiFixButton({
  prompt,
  onAccept,
  label = 'Enhance',
  size = 'sm',
  mode = 'complete',
  className = '',
  suggestionLabel = 'AI Suggestion',
}: AiFixButtonProps) {
  const { isConfigured, config } = useAi()
  const [status, setStatus] = useState<Status>('idle')
  const [suggestion, setSuggestion] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const run = useCallback(async () => {
    if (!config) return
    setStatus('loading')
    setStreamedText('')
    setSuggestion('')
    setErrorMsg('')

    try {
      if (mode === 'stream') {
        setStatus('done')
        await aiStream(prompt, config, {
          onChunk: (chunk) => setStreamedText(prev => prev + chunk),
          onDone: (full) => { setSuggestion(full); setStreamedText('') },
          onError: (err) => { setStatus('error'); setErrorMsg(err.message) },
        })
      } else {
        const result = await aiComplete(prompt, config)
        setSuggestion(result.trim())
        setStatus('done')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'AI request failed')
    }
  }, [config, prompt, mode])

  const handleAccept = useCallback(() => {
    const text = suggestion || streamedText
    if (text) {
      onAccept(text.trim())
      setStatus('idle')
      setSuggestion('')
      setStreamedText('')
    }
  }, [suggestion, streamedText, onAccept])

  const handleDiscard = useCallback(() => {
    setStatus('idle')
    setSuggestion('')
    setStreamedText('')
    setErrorMsg('')
  }, [])

  const displayText = streamedText || suggestion

  // Not configured — show a muted dashed nudge
  if (!isConfigured) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowSetupModal(true)}
          title="Enable AI to use this feature"
          className={`flex items-center justify-center gap-1 border border-dashed border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-all cursor-pointer font-bold rounded-lg ${
            size === 'xs' ? 'w-7 h-7' : size === 'sm' ? 'h-7 px-2.5 text-[10px]' : 'h-8 px-3 text-xs'
          } ${className}`}
        >
          <Sparkles className={size === 'xs' ? 'w-3 h-3' : 'w-3 h-3'} />
          {size !== 'xs' && <span>AI</span>}
        </button>
        <AnimatePresence>
          {showSetupModal && <AiSettingsModal onClose={() => setShowSetupModal(false)} />}
        </AnimatePresence>
      </>
    )
  }

  const btnBase = `flex items-center justify-center gap-1 border rounded-lg font-bold transition-all cursor-pointer select-none ${className}`
  const sizeClass = size === 'xs' ? 'w-7 h-7' : size === 'sm' ? 'h-7 px-2.5 text-[10px]' : 'h-8 px-3 text-xs'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={status === 'idle' || status === 'error' ? run : undefined}
        disabled={status === 'loading'}
        title={label}
        className={`${btnBase} ${sizeClass} ${
          status === 'loading'
            ? 'border-[#b91c1c]/20 bg-[#b91c1c]/5 text-[#b91c1c]/60 cursor-not-allowed'
            : status === 'done'
              ? 'border-[#b91c1c]/30 bg-[#b91c1c]/8 text-[#b91c1c]'
              : 'border-zinc-800 bg-transparent text-zinc-500 hover:text-[#b91c1c] hover:border-[#b91c1c]/30 hover:bg-[#b91c1c]/5 active:scale-95'
        }`}
      >
        {status === 'loading'
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <Sparkles className="w-3 h-3" />}
        {size !== 'xs' && <span>{status === 'loading' ? '...' : label}</span>}
      </button>

      <AnimatePresence>
        {(status === 'done' || status === 'error') && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
            className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl overflow-hidden shadow-2xl shadow-black/50"
            style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{suggestionLabel}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={run} title="Regenerate" className="w-5 h-5 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer">
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button type="button" onClick={handleDiscard} title="Discard" className="w-5 h-5 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-3 py-2.5">
              {status === 'error' ? (
                <p className="text-[11px] text-red-400 leading-relaxed">{errorMsg}</p>
              ) : (
                <p className="text-[12px] text-zinc-200 leading-relaxed">
                  {displayText || <span className="text-zinc-600 italic">Generating...</span>}
                  {!suggestion && streamedText && (
                    <span className="inline-block w-0.5 h-3.5 bg-[#b91c1c] ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              )}
            </div>

            {/* Actions */}
            {status === 'done' && suggestion && (
              <div className="flex gap-2 px-3 pb-3">
                <button type="button" onClick={handleDiscard} className="flex-1 h-7 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-white hover:bg-white/5 border border-white/5 transition-colors cursor-pointer">
                  Discard
                </button>
                <button type="button" onClick={handleAccept} className="flex-1 h-7 rounded-lg bg-[#b91c1c] hover:bg-[#c62828] text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95">
                  <Check className="w-3 h-3" />
                  Apply
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
