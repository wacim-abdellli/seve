import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PenLine, 
  Eye, 
  ShieldCheck, 
  ChevronDown,
  CheckCircle,
  Circle,
  Sparkles
} from 'lucide-react'
import { useResume } from '../hooks/useResume'
import { calculateCompletion, getSectionStatus } from '../utils/completionHelper'

export type SectionType = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer'

interface SectionSidebarProps {
  activeMode: 'studio' | 'preview' | 'analyze'
  onModeChange: (mode: 'studio' | 'preview' | 'analyze') => void
  onOpenSection: (section: SectionType) => void
}

export default function SectionSidebar({
  activeMode,
  onModeChange,
  onOpenSection,
}: SectionSidebarProps) {
  const { resumeData } = useResume()
  const resumeCompletion = calculateCompletion(resumeData)
  const [showChecklist, setShowChecklist] = useState(false)
  const status = getSectionStatus(resumeData)

  const coreSections = [
    { id: 'contact' as const, label: 'Contact Info', score: '+20%', desc: 'Missing name, email, or phone' },
    { id: 'summary' as const, label: 'Profile Summary', score: '+15%', desc: 'Write a professional summary' },
    { id: 'experience' as const, label: 'Work Experience', score: '+25%', desc: 'Add work experience & achievements' },
    { id: 'education' as const, label: 'Education History', score: '+15%', desc: 'Add school or degree' },
    { id: 'skills' as const, label: 'Skills & Stack', score: '+15%', desc: 'Add at least 3 skills' },
  ]

  const optionalSections = [
    { id: 'languages' as const, label: 'Languages', score: '+5%', desc: 'Add languages spoken' },
    { id: 'projects' as const, label: 'Projects', score: '+5%', desc: 'Add side projects' },
    { id: 'certifications' as const, label: 'Certifications', score: '+2%', desc: 'Add professional certificates' },
    { id: 'volunteer' as const, label: 'Volunteer', score: '+2%', desc: 'Add volunteer experience' },
    { id: 'publications' as const, label: 'Publications', score: '+2%', desc: 'Add research or articles' },
    { id: 'awards' as const, label: 'Awards & Honors', score: '+2%', desc: 'Add honors & awards' },
    { id: 'references' as const, label: 'References', score: '+1%', desc: 'Add references' },
    { id: 'interests' as const, label: 'Interests', score: '+1%', desc: 'Add personal interests' },
  ]

  const modes = [
    { id: 'studio' as const, label: 'Edit Resume', icon: PenLine },
    { id: 'preview' as const, label: 'Preview', icon: Eye },
    { id: 'analyze' as const, label: 'ATS Check', icon: ShieldCheck },
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
              <button
                type="button"
                onClick={() => setShowChecklist(!showChecklist)}
                className="w-full text-left group hover:bg-zinc-900/40 p-2.5 -mx-2.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 focus:outline-none"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase flex items-center gap-1 group-hover:text-zinc-350 transition-colors">
                    RESUME COMPLETION
                    <ChevronDown size={10} className={`text-zinc-650 group-hover:text-zinc-400 transition-transform ${showChecklist ? 'rotate-180' : ''}`} />
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
              </button>

              <AnimatePresence>
                {showChecklist && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 mt-2 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-zinc-800/60 pb-1.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Completion Checklist</span>
                      <span className="text-[8px] text-zinc-600 font-medium">Click to Fill</span>
                    </div>

                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-none">
                      {/* Core Requirements */}
                      <div className="space-y-1.5">
                        <h4 className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                          <span>CORE (REQUIRED)</span>
                          <span className="text-[8px] font-normal text-zinc-650 italic">Required for 90%</span>
                        </h4>
                        {coreSections.map((sec) => {
                          const isComplete = status[sec.id]
                          return (
                            <button
                              key={sec.id}
                              type="button"
                              onClick={() => onOpenSection(sec.id)}
                              className="w-full text-left flex items-start gap-2 p-1.5 hover:bg-zinc-800/50 rounded-lg transition-all group/item cursor-pointer"
                            >
                              {isComplete ? (
                                <CheckCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-zinc-700 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] font-medium leading-none transition-colors ${isComplete ? 'text-zinc-300 group-hover/item:text-white' : 'text-zinc-500 group-hover/item:text-zinc-350'}`}>
                                    {sec.label}
                                  </span>
                                  {!isComplete && (
                                    <span className="text-[8.5px] font-mono text-zinc-650 group-hover/item:text-rose-400">
                                      {sec.score}
                                    </span>
                                  )}
                                </div>
                                {!isComplete && (
                                  <p className="text-[9px] text-zinc-655 mt-0.5 leading-normal">
                                    {sec.desc}
                                  </p>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Optional/Bonus */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                        <h4 className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Sparkles size={9} className="text-zinc-500" />
                          <span>OPTIONAL (BONUS)</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-1.5">
                          {optionalSections.map((sec) => {
                            const isComplete = status[sec.id]
                            return (
                              <button
                                key={sec.id}
                                type="button"
                                onClick={() => onOpenSection(sec.id)}
                                className="text-left flex items-center gap-1.5 p-1 hover:bg-zinc-800/50 rounded-md transition-all group/item cursor-pointer truncate"
                              >
                                {isComplete ? (
                                  <CheckCircle className="w-3 h-3 text-rose-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-3 h-3 text-zinc-700 flex-shrink-0" />
                                )}
                                <span className={`text-[10px] font-medium leading-none truncate transition-colors ${isComplete ? 'text-zinc-300 group-hover/item:text-white' : 'text-zinc-500 group-hover/item:text-zinc-350'}`}>
                                  {sec.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
          </div>
        )}
      </div>


    </aside>
  )
}
