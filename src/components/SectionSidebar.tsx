import { motion } from 'framer-motion'
import { 
  PenLine, 
  Eye, 
  ShieldCheck, 
  Bot
} from 'lucide-react'

export type SectionType = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects'

interface SectionSidebarProps {
  activeMode: 'studio' | 'preview' | 'analyze' | 'ai'
  onModeChange: (mode: 'studio' | 'preview' | 'analyze' | 'ai') => void
  resumeCompletion: number
}

export default function SectionSidebar({
  activeMode,
  onModeChange,
  resumeCompletion,
}: SectionSidebarProps) {

  const modes = [
    { id: 'studio' as const, label: 'Edit Resume', icon: PenLine },
    { id: 'preview' as const, label: 'Preview', icon: Eye },
    { id: 'analyze' as const, label: 'ATS Check', icon: ShieldCheck },
    { id: 'ai' as const, label: 'AI Coach', icon: Bot },
  ]



  return (
    <aside className="w-[260px] h-full bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between flex-shrink-0 no-print select-none font-sans overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      
      {/* Top logo area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center select-none">
          <span className="relative font-serif text-2xl font-bold text-white leading-none" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            S
            <span className="absolute top-0 -right-1.5 w-2 h-2 rounded-full bg-[#e11d48]" />
          </span>
          <span className="font-serif text-2xl font-bold text-white leading-none pl-1" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            eve
          </span>
        </div>
        <span className="text-[10px] bg-red-500/20 text-red-400 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">
          STUDIO V2
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-col flex-shrink-0">
        <h3 className="text-[10px] text-zinc-500 font-semibold tracking-widest px-4 pt-4 pb-2 uppercase">
          WORKSPACE
        </h3>
        <nav className="flex flex-col gap-1">
          {modes.map((mode) => {
            const Icon = mode.icon
            const isActive = activeMode === mode.id

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  onModeChange(mode.id)
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 text-sm transition-all duration-155 relative h-10 ${
                  isActive
                    ? 'bg-red-500/10 text-red-400 font-medium border-l-2 border-red-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mode-glow"
                    className="absolute inset-0 bg-red-500/5 rounded-lg pointer-events-none"
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
                  />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10">{mode.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Middle Content */}
      <div className="flex-1 py-4 flex flex-col min-h-0">
        {activeMode === 'studio' ? (
          <div className="flex flex-col gap-4">
            {/* Progress Area */}
            <div className="px-4">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">
                  RESUME COMPLETION
                </span>
                <span className="text-white font-bold text-xs">
                  {resumeCompletion}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500" 
                  style={{ width: `${resumeCompletion}%` }}
                />
              </div>
            </div>

            {/* Helper Card */}
            <div className="px-3 mt-2">
              <div className="bg-zinc-900 rounded-xl p-4 w-full flex flex-col gap-3 border border-zinc-800/40">
                <PenLine size={32} className="text-red-400" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Resume Editor</h4>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-sans">
                    Click any section in the builder overview to edit its content. You can drag and drop sections in the preview to rearrange your resume's layout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-3 flex-1 flex items-center justify-center">
            {activeMode === 'preview' && (
              <div className="bg-zinc-900 rounded-xl p-4 w-full flex flex-col gap-3">
                <Eye size={32} className="text-red-400" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Document Preview</h4>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Choose the best template and preview your resume. Save as print-ready PDF.
                  </p>
                </div>
              </div>
            )}
            {activeMode === 'analyze' && (
              <div className="bg-zinc-900 rounded-xl p-4 w-full flex flex-col gap-3">
                <ShieldCheck size={32} className="text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">ATS Check</h4>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Your resume is scored live. Aim for 80+ to pass most ATS filters.
                  </p>
                </div>
              </div>
            )}
            {activeMode === 'ai' && (
              <div className="bg-zinc-900 rounded-xl p-4 w-full flex flex-col gap-3">
                <Bot size={32} className="text-indigo-400" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">AI Coach</h4>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Ask me to rewrite any section or tailor your resume to a job posting.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


    </aside>
  )
}
