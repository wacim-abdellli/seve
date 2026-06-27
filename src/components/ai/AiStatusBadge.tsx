import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAi } from '../../hooks/useAi'
import AiSettingsModal from './AiSettingsModal'

/**
 * Matches the app's existing toolbar pill style (small, dark, minimal).
 */
export default function AiStatusBadge() {
  const { isConfigured } = useAi()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title={isConfigured ? 'AI connected — click to manage' : 'Enable AI features'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer select-none border ${
          isConfigured
            ? 'bg-[#b91c1c]/10 border-[#b91c1c]/25 text-[#b91c1c] hover:bg-[#b91c1c]/15'
            : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
        }`}
      >
        <Sparkles className="w-2.5 h-2.5" />
        {isConfigured ? 'AI Ready' : 'Enable AI'}
        {isConfigured && <span className="w-1 h-1 rounded-full bg-[#b91c1c] animate-pulse" />}
      </button>

      <AnimatePresence>
        {showModal && <AiSettingsModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
