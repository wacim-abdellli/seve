import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

export default function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, destructive = false,
}: ConfirmDialogProps) {
  if (!open) return null
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${destructive ? 'bg-red-500/10 border border-red-500/20' : 'bg-zinc-800'}`}>
              <AlertTriangle className={`w-4 h-4 ${destructive ? 'text-red-400' : 'text-zinc-400'}`} />
            </div>
            <h3 className="text-[15px] font-bold text-white">{title}</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{description}</p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white font-bold text-sm transition-colors cursor-pointer">
              {cancelLabel}
            </button>
            <button onClick={onConfirm} className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer active:scale-95 ${destructive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
