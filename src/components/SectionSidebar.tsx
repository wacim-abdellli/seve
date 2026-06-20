import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PenLine, 
  Eye, 
  ShieldCheck, 
  ChevronDown,
  ChevronLeft,
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
  const [collapsed, setCollapsed] = useState(true)
  const [showHandle, setShowHandle] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [showEditorTips, setShowEditorTips] = useState(false)
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
    <div
      className="relative h-full"
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
    <motion.aside
      animate={{ width: collapsed ? 56 : 260 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
      className="h-full bg-zinc-950 border-r border-zinc-800 flex flex-col flex-shrink-0 no-print select-none font-sans overflow-hidden"
    >
      {collapsed ? (
        <>
          <div className="h-16 flex items-center justify-center border-b border-zinc-800 flex-shrink-0">
            <span className="relative font-serif text-xl font-bold text-white leading-none" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              S
              <span className="absolute top-0 -right-1 w-1.5 h-1.5 rounded-full bg-[#e0314f] shadow-[0_0_8px_#e0314f]" />
            </span>
          </div>

          <nav className="flex flex-col items-center gap-1 py-4 flex-shrink-0">
            {modes.map((mode) => {
              const Icon = mode.icon
              const isActive = activeMode === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onModeChange(mode.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-155 relative ${
                    isActive
                      ? 'bg-[#e0314f]/10 text-[#e0314f]'
                      : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                  }`}
                  title={mode.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-mode-glow-collapsed"
                      className="absolute inset-0 bg-[#e0314f]/5 rounded-xl pointer-events-none"
                      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
                    />
                  )}
                  <Icon size={18} className="relative z-10" />
                </button>
              )
            })}
          </nav>

          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90 drop-shadow-[0_0_4px_rgba(224,49,79,0.2)]" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="17" fill="none" stroke="rgb(24 24 27)" strokeWidth="2.5" />
                <circle cx="20" cy="20" r="17" fill="none" stroke="#e0314f" strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 17}`}
                  strokeDashoffset={`${2 * Math.PI * 17 * (1 - resumeCompletion / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-white">
                {resumeCompletion}%
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="h-16 flex items-center px-3 border-b border-zinc-800 flex-shrink-0 min-w-0">
            <div className="flex items-center select-none">
              <span className="relative font-serif text-2xl font-bold text-white leading-none" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                S
                <span className="absolute top-0 -right-1.5 w-2 h-2 rounded-full bg-[#e0314f] shadow-[0_0_10px_#e0314f]" />
              </span>
              <span className="font-serif text-2xl font-bold text-white leading-none pl-0.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                eve
              </span>
            </div>
          </div>

          <div className="flex flex-col flex-shrink-0">
            <h3 className="text-[11px] text-zinc-500 font-semibold tracking-widest px-4 pt-4 pb-2 uppercase">
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
                    onClick={() => onModeChange(mode.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 text-sm transition-all duration-155 relative h-10 font-display ${
                      isActive
                        ? 'bg-[#e0314f]/10 text-[#e0314f] font-extrabold border-l-2 border-[#e0314f]'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-mode-glow"
                        className="absolute inset-0 bg-[#e0314f]/5 rounded-lg pointer-events-none"
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

          <div className="flex-1 py-4 flex flex-col min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {activeMode === 'studio' ? (
              <div className="flex flex-col gap-4">
                <div className="px-4">
                  <button
                    type="button"
                    onClick={() => setShowChecklist(!showChecklist)}
                    className="w-full text-left group hover:bg-zinc-900/40 p-2.5 -mx-2.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 focus:outline-none"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[11px] text-zinc-500 font-semibold tracking-widest uppercase flex items-center gap-1 group-hover:text-zinc-350 transition-colors">
                        RESUME COMPLETION
                        <ChevronDown size={10} className={`text-zinc-650 group-hover:text-zinc-400 transition-transform ${showChecklist ? 'rotate-180' : ''}`} />
                      </span>
                      <span className="text-white font-bold text-xs">{resumeCompletion}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#e0314f] to-rose-400 rounded-full transition-all duration-500" style={{ width: `${resumeCompletion}%` }} />
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
                          <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Completion Checklist</span>
                          <span className="text-[10px] text-zinc-600 font-medium">Click to Fill</span>
                        </div>
                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-none">
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                              <span>CORE (REQUIRED)</span>
                              <span className="text-[9px] font-normal text-zinc-650 italic">Required for 90%</span>
                            </h4>
                            {coreSections.map((sec) => {
                              const isComplete = status[sec.id]
                              return (
                                <button key={sec.id} type="button" onClick={() => onOpenSection(sec.id)} className="w-full text-left flex items-start gap-2 p-1.5 hover:bg-zinc-800/50 rounded-lg transition-all group/item cursor-pointer">
                                  {isComplete ? <CheckCircle className="w-3.5 h-3.5 text-[#e0314f] mt-0.5 flex-shrink-0" /> : <Circle className="w-3.5 h-3.5 text-zinc-700 mt-0.5 flex-shrink-0" />}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                      <span className={`text-[13px] font-medium leading-none transition-colors ${isComplete ? 'text-zinc-300 group-hover/item:text-white' : 'text-zinc-500 group-hover/item:text-zinc-350'}`}>{sec.label}</span>
                                      {!isComplete && <span className="text-[10px] font-mono text-zinc-650 group-hover/item:text-rose-400">{sec.score}</span>}
                                    </div>
                                    {!isComplete && <p className="text-[10px] text-zinc-655 mt-0.5 leading-normal">{sec.desc}</p>}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Sparkles size={11} className="text-zinc-500" />
                              <span>OPTIONAL (BONUS)</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-1.5">
                              {optionalSections.map((sec) => {
                                const isComplete = status[sec.id]
                                return (
                                  <button key={sec.id} type="button" onClick={() => onOpenSection(sec.id)} className="text-left flex items-center gap-1.5 p-1 hover:bg-zinc-800/50 rounded-md transition-all group/item cursor-pointer truncate">
                                    {isComplete ? <CheckCircle className="w-3 h-3 text-[#e0314f] flex-shrink-0" /> : <Circle className="w-3 h-3 text-zinc-700 flex-shrink-0" />}
                                    <span className={`text-[11px] font-medium leading-none truncate transition-colors ${isComplete ? 'text-zinc-300 group-hover/item:text-white' : 'text-zinc-500 group-hover/item:text-zinc-350'}`}>{sec.label}</span>
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

                <div className="px-3 mt-2">
                  <button onClick={() => setShowEditorTips(!showEditorTips)} className="w-full flex items-center justify-between px-1 py-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-400 transition-colors cursor-pointer">
                    <span>Resume Editor Tips</span>
                    <ChevronDown size={12} className={`transition-transform ${showEditorTips ? 'rotate-180' : ''}`} />
                  </button>
                  {showEditorTips && (
                    <div className="bg-zinc-900 rounded-xl p-4 w-full flex flex-col gap-3 border border-zinc-800/40">
                      <PenLine size={32} className="text-red-400" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Resume Editor</h4>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-sans">Click any section in the builder overview to edit its content. You can drag and drop sections in the preview to rearrange your resume's layout.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-3 flex-1 flex items-center justify-center">
                {activeMode === 'preview' && (
                  <div className="bg-zinc-900 rounded-xl p-4 w-full flex flex-col gap-3">
                    <Eye size={32} className="text-red-400" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Document Preview</h4>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Choose the best template and preview your resume. Save as print-ready PDF.</p>
                    </div>
                  </div>
                )}
                {activeMode === 'analyze' && (
                  <div className="bg-zinc-900 rounded-xl p-4 w-full flex flex-col gap-3">
                    <ShieldCheck size={32} className="text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">ATS Check</h4>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Your resume is scored live. Aim for 80+ to pass most ATS filters.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </motion.aside>

      {/* Floating toggle handle — appears on hover at the right edge */}
        <motion.button
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: showHandle ? 1 : 0, x: showHandle ? 0 : 6 }}
          transition={{ duration: 0.12 }}
          onClick={() => { setCollapsed(v => !v); setShowHandle(false) }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-50 w-5 h-12 bg-zinc-800 border border-zinc-600 border-r-0 flex items-center justify-center cursor-pointer hover:bg-zinc-700 rounded-l-md"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={11} className="text-zinc-300" style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
        </motion.button>
    </div>
  )
}
