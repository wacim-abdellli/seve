import { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, AlertTriangle, Lightbulb,
  ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react'
import type { AtsCategoryScore, AtsIssue } from '../../types/resume'
import { getCategoryTheme } from './AtsCheckerUtils'
import { ISSUE_EXPLANATIONS } from '../../utils/atsGuideData'
import AiFixButton from '../ai/AiFixButton'
import ResumeDataContextInternal from '../../context/resumeDataContextDef'
import { PROMPTS } from '../../services/aiService'

interface AtsCategorySectionProps {
  categories: AtsCategoryScore[]
  criticalIssues: AtsIssue[]
  warningIssues: AtsIssue[]
  suggestionIssues: AtsIssue[]
  onNavigateToSection?: (section: string) => void
}

export default function AtsCategorySection({
  criticalIssues, warningIssues, suggestionIssues,
  onNavigateToSection
}: AtsCategorySectionProps) {
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({})
  const ctx = useContext(ResumeDataContextInternal)

  // Helper: get the current text for the field the issue refers to
  const getCurrentText = (issue: AtsIssue): string => {
    if (!ctx) return ''
    const { resumeData } = ctx
    if (issue.section === 'summary') return resumeData.summary || ''
    if (issue.section === 'experience' && issue.bulletIndex !== undefined) {
      return resumeData.experience?.[0]?.bullets?.[issue.bulletIndex] || ''
    }
    if (issue.section === 'experience') {
      return resumeData.experience?.[0]?.bullets?.join(' ') || ''
    }
    return ''
  }

  // Helper: apply the AI fix result back into resume data
  const applyFix = (issue: AtsIssue, result: string) => {
    if (!ctx) return
    const { resumeData, updateResumeData } = ctx
    if (issue.section === 'summary') {
      updateResumeData({ ...resumeData, summary: result })
    } else if (issue.section === 'experience' && issue.bulletIndex !== undefined) {
      const newExp = resumeData.experience.map((exp, eIdx) => {
        if (eIdx !== 0) return exp
        const bullets = [...exp.bullets]
        bullets[issue.bulletIndex!] = result
        return { ...exp, bullets }
      })
      updateResumeData({ ...resumeData, experience: newExp })
    }
  }

  const toggleExpandIssue = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const renderIssueItem = (issue: AtsIssue, type: 'critical' | 'warning' | 'suggestion') => {
    const isExpanded = !!expandedIssues[issue.id]
    const help = ISSUE_EXPLANATIONS[issue.id]
    const hasDetails = !!(issue.details && issue.details.length > 0)
    const hasHelpOrDetails = !!(help || hasDetails)
    const theme = getCategoryTheme(issue.id)
    const Icon = theme.icon || (type === 'critical' ? ShieldAlert : type === 'warning' ? AlertTriangle : Lightbulb)

    const fixButtonColor = type === 'critical' ? 'text-red-400 bg-red-500/10 hover:bg-red-600 border-red-500/20' : type === 'warning' ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-600 border-amber-500/20' : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-650 border-indigo-500/20'

    return (
      <div
        key={issue.id}
        className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors duration-200 border-l-4"
        style={{ borderLeftColor: type === 'critical' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1' }}
      >
        <div
          className={`p-4 flex gap-3.5 justify-between items-start ${hasHelpOrDetails ? 'cursor-pointer select-none hover:bg-zinc-800/20' : ''}`}
          onClick={() => hasHelpOrDetails && toggleExpandIssue(issue.id)}
          role={hasHelpOrDetails ? 'button' : undefined}
          tabIndex={hasHelpOrDetails ? 0 : undefined}
          aria-expanded={hasHelpOrDetails ? isExpanded : undefined}
          aria-controls={hasHelpOrDetails ? `issue-content-${issue.id}` : undefined}
          onKeyDown={hasHelpOrDetails ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpandIssue(issue.id) } } : undefined}
        >
          <div className="flex gap-3.5 items-start min-w-0">
            <div className={`w-9 h-9 rounded-lg ${theme.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon size={16} className={theme.text} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="text-[13.5px] font-bold text-zinc-100 leading-snug">{issue.issue}</h5>
                <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-full ${theme.bg} ${theme.text} border ${theme.border} tracking-wide uppercase font-mono`}>
                  {theme.label}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{issue.fix}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 mt-1">
            {issue.section && onNavigateToSection && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigateToSection(issue.section!) }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${fixButtonColor}`}
              >
                {type === 'critical' ? 'Fix' : 'Edit'} <ArrowRight size={10} />
              </button>
            )}
            {/* AI Fix button — shown when issue has a section we can patch */}
            {(issue.section === 'summary' || (issue.section === 'experience' && issue.bulletIndex !== undefined)) && (
              <div onClick={e => e.stopPropagation()}>
                <AiFixButton
                  prompt={PROMPTS.fixAtsIssue(issue.issue, issue.fix, getCurrentText(issue))}
                  onAccept={(result) => applyFix(issue, result)}
                  label="AI Fix"
                  size="sm"
                  suggestionLabel="AI-Suggested Fix"
                />
              </div>
            )}
            {hasHelpOrDetails && (
              <div className="text-zinc-500 hover:text-white transition-colors">
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && hasHelpOrDetails && (
            <motion.div
              id={`issue-content-${issue.id}`}
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-zinc-950/65 border-t border-zinc-900/60 space-y-4">
                {help && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb size={11} className="text-indigo-400" />
                        Why it matters for ATS:
                      </p>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{help.whyItMatters}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-zinc-950 border border-red-500/20 rounded-lg overflow-hidden">
                        <div className="bg-red-500/10 border-b border-red-500/20 px-3 py-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider font-mono">✕ Before / Bad Example</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-550" />
                        </div>
                        <div className="p-3">
                          <p className="text-[11.5px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">{help.before}</p>
                        </div>
                      </div>
                      <div className="bg-zinc-950 border border-emerald-500/20 rounded-lg overflow-hidden">
                        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider font-mono">✓ Optimized / ATS Safe</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="p-3">
                          <p className="text-[11.5px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">{help.after}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {hasDetails && (
                  <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      {type === 'suggestion' ? 'Items to consider:' : 'Items needing review:'}
                    </p>
                    <ul className="space-y-1.5">
                      {issue.details?.map((detail, dIdx) => (
                        <li key={dIdx} className="text-xs text-zinc-300 border-l-2 border-zinc-700/50 pl-3 leading-relaxed py-0.5">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 select-none">
            <ShieldAlert size={14} className="text-red-400" />
            Critical ({criticalIssues.length})
          </h4>
          <div className="space-y-3">
            {criticalIssues.map(issue => renderIssueItem(issue, 'critical'))}
          </div>
        </div>
      )}

      {/* Warnings */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 select-none">
          <AlertTriangle size={14} className="text-amber-400" />
          Warnings ({warningIssues.length})
        </h4>
        {warningIssues.length === 0 ? (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 text-center text-zinc-500 text-xs select-none">
            No formatting warnings. Layout looks clean.
          </div>
        ) : (
          <div className="space-y-3">
            {warningIssues.map(issue => renderIssueItem(issue, 'warning'))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 select-none">
          <Lightbulb size={14} className="text-indigo-400" />
          Suggestions ({suggestionIssues.length})
        </h4>
        {suggestionIssues.length === 0 ? (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 text-center text-zinc-500 text-xs select-none">
            No suggestions. Your writing is solid.
          </div>
        ) : (
          <div className="space-y-3">
            {suggestionIssues.map(issue => renderIssueItem(issue, 'suggestion'))}
          </div>
        )}
      </div>
    </div>
  )
}
