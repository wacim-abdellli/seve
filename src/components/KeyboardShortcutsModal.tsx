import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

const shortcuts = [
  { keys: ['Ctrl', 'Z'], macKeys: ['⌘', 'Z'], label: 'Undo' },
  { keys: ['Ctrl', 'Y'], macKeys: ['⌘', 'Y'], label: 'Redo' },
  { keys: ['Ctrl', 'P'], macKeys: ['⌘', 'P'], label: 'Print / Export PDF' },
  { keys: ['Ctrl', 'S'], macKeys: ['⌘', 'S'], label: 'Save to Cloud' },
  { keys: ['?'], macKeys: ['?'], label: 'Toggle this menu' },
]

function isMac() {
  return navigator.platform.toLowerCase().includes('mac')
}

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print select-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(6px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(6px)' }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
        className="relative w-full max-w-[420px] bg-[#0c0d12] border border-zinc-800 rounded-2xl shadow-2xl p-6 z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-white tracking-tight uppercase font-display">Keyboard Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          {shortcuts.map((s) => {
            const displayKeys = isMac() ? s.macKeys : s.keys
            return (
              <div
                key={s.label}
                className="flex items-center justify-between py-2.5 px-1 border-b border-zinc-900/60 last:border-0"
              >
                <span className="text-xs text-zinc-400">{s.label}</span>
                <div className="flex gap-1">
                  {displayKeys.map((key) => (
                    <kbd
                      key={key}
                      className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 min-w-[24px] text-center"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-[10px] text-zinc-600 mt-4 text-center">Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono">?</kbd> anytime to toggle this menu</p>
      </motion.div>
    </div>,
    document.body
  )
}
