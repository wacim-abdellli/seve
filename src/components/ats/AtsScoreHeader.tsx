import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, FileText, BookOpen, Target, Briefcase,
  ShieldAlert, ArrowRight, BarChart3, AlertTriangle, ChevronRight
} from 'lucide-react'
import type { AtsReport, AtsIssue } from '../../types/resume'
import { useCountUp } from '../../hooks/useCountUp'
import { computeDomainPenalty } from '../../utils/roleClassifier'
import type { RoleDomain } from '../../utils/roleClassifier'
import { SECTION_LABELS, BAR_COLORS } from './AtsCheckerUtils'
import AtsScoreGauge from './AtsScoreGauge'

interface AtsScoreHeaderProps {
  report?: AtsReport
  totalScore: number
  resumeDomain: string
  jdDomain: string
  jobDescription: string
  criticalIssues: AtsIssue[]
  warningIssues: AtsIssue[]
  totalIssuesCount: number
  onNavigateToSection: (section: string) => void
  onViewAllIssues: () => void
}

function MetricTile({ icon: Icon, label, value, description, colorClass = 'text-zinc-400' }: {
  icon: React.FC<{ size?: number; className?: string }>
  label: string
  value: string | number
  description?: string
  colorClass?: string
}) {
  const tintMap: Record<string, { bg: string; border: string }> = {
    'text-indigo-400': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    'text-emerald-400': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'text-cyan-400': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'text-amber-400': { bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'text-red-400': { bg: 'bg-red-500/10', border: 'border-red-500/20' },
  }
  const theme = tintMap[colorClass] || { bg: 'bg-zinc-950', border: 'border-zinc-800' }

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex flex-col gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-4 transition-all duration-200 hover:border-zinc-700"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${theme.bg} border ${theme.border} flex items-center justify-center shrink-0`}>
          <Icon size={16} className={colorClass} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-extrabold text-white mt-0.5 truncate">{value}</p>
        </div>
      </div>
      {description && (
        <p className="text-[10.5px] text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-2">{description}</p>
      )}
    </motion.div>
  )
}

export default function AtsScoreHeader({
  report, totalScore, resumeDomain, jdDomain, jobDescription,
  criticalIssues, warningIssues, totalIssuesCount,
  onNavigateToSection, onViewAllIssues
}: AtsScoreHeaderProps) {
  const animatedScore = useCountUp(totalScore, 1200)

  const penalty = useMemo(() => computeDomainPenalty(resumeDomain as RoleDomain, jdDomain as RoleDomain), [resumeDomain, jdDomain])

  const fitStatus = useMemo(() => {
    if (!jobDescription.trim()) return 'Pending JD'
    if (penalty === 0) return 'Matched'
    if (penalty === -15) return 'Adjacent'
    return 'Mismatch'
  }, [jobDescription, penalty])

  const fitColorClass = useMemo(() => {
    if (fitStatus === 'Matched') return 'text-emerald-400'
    if (fitStatus === 'Adjacent') return 'text-amber-400'
    if (fitStatus === 'Mismatch') return 'text-red-400'
    return 'text-zinc-500'
  }, [fitStatus])

  const totalWords = report?.wordCount || 0
  const readabilityLabel = report?.readingLevel ? `Grade ${report.readingLevel}` : 'N/A'

  const readabilityFeedback = useMemo(() => {
    const gl = report?.readingLevel || 0
    if (gl === 0) return 'Analyzing text complexity...'
    if (gl > 16) return 'Postgraduate level: very complex. Simplify language.'
    if (gl > 12) return 'University level: professional but advanced.'
    if (gl > 8) return 'Optimal: clear professional business reading level.'
    return 'Basic level: consider using more specialized tech terms.'
  }, [report?.readingLevel])

  const parseabilityStatus = useMemo(() => {
    const ps = report?.atsParseability || 100
    if (ps >= 90) return 'Highly Safe'
    if (ps >= 70) return 'Moderate Safety'
    return 'Danger: special chars'
  }, [report?.atsParseability])

  const parseabilityColor = useMemo(() => {
    const ps = report?.atsParseability || 100
    if (ps >= 90) return 'text-emerald-400'
    if (ps >= 70) return 'text-amber-400'
    return 'text-red-400'
  }, [report?.atsParseability])

  const scoreColor = totalScore >= 90 ? 'text-emerald-400' : totalScore >= 70 ? 'text-blue-400' : totalScore >= 55 ? 'text-amber-400' : 'text-red-400'
  const scoreBg = totalScore >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' : totalScore >= 70 ? 'bg-blue-500/10 border-blue-500/20' : totalScore >= 55 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="space-y-5">
      {/* Domain Mismatch Banner */}
      {report?.critical.some(i => i.id === 'domain-mismatch') && (
        <div className="bg-amber-500/5 border border-amber-500/15 text-amber-400 p-4 rounded-xl text-xs flex items-start gap-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <span className="leading-relaxed">
            Your resume targets <strong className="text-white">{resumeDomain.replace(/_/g, ' ')}</strong> roles. This JD is for <strong className="text-white">{jdDomain.replace(/_/g, ' ')}</strong> position. Score reflects formatting &amp; writing quality, not job fit.
          </span>
        </div>
      )}

      {/* Hero Score Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative group">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative">
          <AtsScoreGauge score={animatedScore} />

          <div className="flex-1 w-full space-y-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h3 className="text-base font-bold text-white tracking-wide">ATS Scan Status</h3>
                <span className={`text-[9.5px] font-black px-2.5 py-0.5 rounded-full border tracking-wider uppercase ${scoreBg} ${scoreColor}`}>
                  {report?.grade || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                {totalScore >= 80
                  ? 'Strong score — resume is well-optimized for ATS parsing. Keep tailoring for specific roles.'
                  : 'Needs improvement — focus on formatting and keyword alignment to cross the 80+ threshold.'}
              </p>
            </div>

            {/* Quick stat chips */}
            <div className="flex flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 cursor-default select-none">
                <Activity size={12} className="text-indigo-400" />
                <span className="text-[10.5px] text-zinc-300 font-bold">{totalWords} words</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 cursor-default select-none">
                <FileText size={12} className={parseabilityColor} />
                <span className="text-[10.5px] text-zinc-300 font-bold">{parseabilityStatus}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 cursor-default select-none">
                <BookOpen size={12} className="text-cyan-400" />
                <span className="text-[10.5px] text-zinc-300 font-bold">{readabilityLabel}</span>
              </div>
            </div>

            {/* Score scale */}
            <div className="pt-2">
              <div className="relative h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/80">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-indigo-500 to-emerald-500" />
                <motion.div
                  initial={{ left: '0%' }}
                  animate={{ left: `${totalScore}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-zinc-950 -ml-1.75 shadow-lg z-10"
                />
              </div>
              <div className="flex justify-between text-[8px] text-zinc-500 font-bold mt-1.5 px-0.5 tracking-wider font-mono">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricTile icon={Activity} label="Total Words" value={totalWords}
          description={totalWords < 250 ? 'Too short. Target ~300+ words.' : totalWords > 1000 ? 'Too wordy. Keep concise.' : 'Optimal length.'}
          colorClass="text-indigo-400"
        />
        <MetricTile icon={FileText} label="Parser Safety" value={parseabilityStatus}
          description={report?.atsParseability && report.atsParseability < 100 ? `${100 - report.atsParseability}% broken encoding risk.` : '0% parsing blockers.'}
          colorClass={parseabilityColor}
        />
        <MetricTile icon={BookOpen} label="Readability" value={readabilityLabel}
          description={readabilityFeedback}
          colorClass="text-cyan-400"
        />
        <MetricTile icon={Target} label="JD Keywords" value={jobDescription ? `${report?.categories.find(c => c.key === 'keywords')?.score || 0}/25` : 'N/A'}
          description={jobDescription ? 'Matched skills tokens.' : 'Configure JD to check overlap.'}
          colorClass="text-emerald-400"
        />
        <MetricTile icon={Briefcase} label="Domain Fit" value={fitStatus}
          description={jobDescription ? `Resume: ${resumeDomain.replace(/_/g, ' ')} / JD: ${jdDomain.replace(/_/g, ' ')}` : 'Configure JD to classify domain.'}
          colorClass={fitColorClass}
        />
      </div>

      {/* Issues at a Glance */}
      {totalIssuesCount > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert size={14} className="text-zinc-500" />
              Issues at a glance
            </h3>
            <button
              onClick={onViewAllIssues}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer select-none"
            >
              View all ({totalIssuesCount}) <ArrowRight size={11} className="text-indigo-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[...criticalIssues, ...warningIssues].slice(0, 3).map((issue) => {
              const isCritical = criticalIssues.includes(issue)
              return (
                <div key={issue.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950 border ${isCritical ? 'border-red-900/50 hover:border-red-800' : 'border-amber-900/50 hover:border-amber-800'} transition-colors duration-200 relative overflow-hidden`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isCritical ? 'bg-red-550' : 'bg-amber-550'}`} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-zinc-200 leading-snug truncate">{issue.issue}</p>
                    <p className="text-[9.5px] text-zinc-500 mt-0.5 truncate leading-relaxed">{issue.fix}</p>
                  </div>
                  {issue.section && (
                    <button
                      onClick={() => onNavigateToSection(issue.section!)}
                      className="shrink-0 ml-auto p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                      title={`Go to ${issue.section} section`}
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4.5 flex items-center justify-between border-b border-zinc-800">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={14} className="text-indigo-400" />
            Category breakdown
          </h3>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Weighted evaluation</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {report?.categories?.map((cat, idx) => {
            const pct = cat.max > 0 ? (cat.score / cat.max) * 100 : 0
            const color = BAR_COLORS[cat.key] || 'bg-zinc-400'
            const isDisabled = cat.weight === 0

            return (
              <motion.div
                key={cat.key}
                whileHover={{ x: 2 }}
                className={`flex flex-col gap-2 transition-opacity ${isDisabled ? 'opacity-35' : ''}`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-350 font-bold">{SECTION_LABELS[cat.key] || cat.label}</span>
                  <span className="font-extrabold text-zinc-200 tabular-nums font-mono">
                    {isDisabled ? 'Excluded' : `${cat.score}/${cat.max}`}
                  </span>
                </div>
                <div className="relative h-2 bg-zinc-950 rounded-full border border-zinc-900">
                  {!isDisabled && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: idx * 0.05, ease: 'easeOut' }}
                      className={`h-full rounded-full ${color}`}
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


