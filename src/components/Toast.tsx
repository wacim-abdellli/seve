import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { ToastType, Toast } from '../types/toast'
import { ToastContext } from '../context/ToastContext'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none no-print">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = {
              success: CheckCircle2,
              error: XCircle,
              warning: AlertTriangle,
              info: Info,
            }[toast.type]

            const iconBg = {
              success: 'bg-emerald-500/10 text-emerald-400',
              error: 'bg-red-500/10 text-red-400',
              warning: 'bg-amber-500/10 text-amber-400',
              info: 'bg-blue-500/10 text-blue-400',
            }[toast.type]

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-2xl shadow-black/50 min-w-[280px] max-w-[380px]"
              >
                {/* Icon by type */}
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <p className="text-[13px] text-white flex-1 leading-relaxed">{toast.message}</p>

                <button 
                  onClick={() => removeToast(toast.id)} 
                  type="button" 
                  className="text-zinc-600 hover:text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
