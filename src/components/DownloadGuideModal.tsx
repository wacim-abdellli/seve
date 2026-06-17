import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Download, FileText, Settings, Monitor, ArrowRight } from 'lucide-react'

interface DownloadGuideModalProps {
  onClose: () => void
  onContinue: () => void
}

export default function DownloadGuideModal({ onClose, onContinue }: DownloadGuideModalProps) {
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
        className="relative w-full max-w-[440px] bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10 flex flex-col"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
              <Download className="w-4 h-4 text-red-400" />
              Download as PDF
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Quick guide to exporting your resume</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider bg-transparent border-0 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Steps List */}
        <div className="flex flex-col gap-4 mb-5">
          {[
            {
              icon: Monitor,
              title: 'Open Print Dialog',
              desc: "Click the button below to open your browser's native print window.",
            },
            {
              icon: Settings,
              title: 'Change Destination',
              desc: 'In the "Destination" dropdown, select "Save as PDF" instead of your printer.',
            },
            {
              icon: FileText,
              title: 'Configure Options',
              desc: 'Under "More settings", uncheck "Headers & footers" (removes browser URLs) and check "Background graphics" (preserves template colors and formatting).',
            },
          ].map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-border shrink-0 text-red-400">
                <step.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white uppercase tracking-wider mb-0.5">
                  Step {i + 1}: {step.title}
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal font-light">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* High fidelity quote */}
        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl mb-5">
          <p className="text-xs text-red-400 italic text-center leading-normal font-medium">
            "Selecting 'Save as PDF' ensures your resume preserves its high-fidelity formatting and links."
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onContinue}
            className="w-full h-10 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all shadow-[0_0_12px_rgba(224, 49, 79,0.05)] flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
          >
            Continue to print dialog
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full text-xs text-muted-foreground hover:text-zinc-350 transition-colors font-bold py-2 bg-transparent border-0 cursor-pointer uppercase tracking-wider"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
