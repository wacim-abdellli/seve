import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAi } from '../../hooks/useAi'
import AiSettingsModal from './AiSettingsModal'

export default function AiStatusBadge() {
  const { isUsingAppKey } = useAi()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title={isUsingAppKey ? 'Using Seve AI (free) — click to add your own key for unlimited access' : 'AI connected with your key — click to manage'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer select-none border ${
          isUsingAppKey
            ? 'bg-[#b91c1c]/8 border-[#b91c1c]/20 text-[#b91c1c]/80 hover:bg-[#b91c1c]/15 hover:text-[#b91c1c]'
            : 'bg-[#b91c1c]/10 border-[#b91c1c]/25 text-[#b91c1c] hover:bg-[#b91c1c]/15'
        }`}
      >
        <Sparkles className="w-2.5 h-2.5" />
        {isUsingAppKey ? 'Seve AI' : 'AI Ready'}
        <span className="w-1 h-1 rounded-full bg-[#b91c1c] animate-pulse" />
      </button>

      <AnimatePresence>
        {showModal && <AiSettingsModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
