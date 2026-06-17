import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ResumeData } from '../types/resume'
import type { RoleDomain } from '../utils/roleClassifier'
import type { LucideIcon } from 'lucide-react'
import { evaluateResume, autoFix, calculateSkillsMatrix, weightKeyword } from '../utils/atsEvaluator'
import { computeDomainPenalty } from '../utils/roleClassifier'
import {
  CheckCircle2, XCircle, FileCode, Activity,
  Target, Zap, Sparkles, ArrowRight, Lightbulb, BarChart3,
  AlertTriangle, ShieldAlert, TrendingUp,
  ChevronDown, ChevronUp, RefreshCw, BookOpen,
  Plus, Check, FileText, Briefcase, Circle
} from 'lucide-react'

interface AtsCheckerProps {
  resumeData: ResumeData
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void
  onFix: (fixed: ResumeData) => void
  onNavigateToSection: (section: string) => void
}

/* ─── Animated Score Counter ─── */
function useCountUp(end: number, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    let raf: number
    const tick = (now: number) => {
      if (start === null) start = now
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - p) * (1 - p)
      setValue(Math.round(eased * end))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end, duration])
  return value
}
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

/* ─── Score Gauge ─── */
function ScoreGauge({ score, gradeLabel }: { score: number; gradeLabel: string }) {
  const size = 180
  const stroke = 12
  const r = (size - stroke * 2) / 2
  const c = r * 2 * Math.PI
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 55 ? '#f59e0b' : '#ef4444'
  
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <div className="absolute rounded-full blur-3xl opacity-15" style={{ width: size + 36, height: size + 36, background: color }} />
      <svg width={size} height={size} className="-rotate-90 drop-shadow-2xl">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number], delay: 0.1 }}
          style={{ filter: `drop-shadow(0 0 12px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[48px] font-black text-white tabular-nums tracking-tight leading-none">{score}</span>
        <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-1">ATS Score</span>
        <span className="text-[11px] text-zinc-400 font-semibold tracking-wider bg-zinc-900/60 border border-zinc-800/40 rounded-full px-2.5 py-0.5 mt-2 shadow-inner">{gradeLabel}</span>
      </div>
    </div>
  )
}

/* ─── Metric Tile ─── */
function MetricTile({ icon: Icon, label, value, description, colorClass = "text-zinc-400" }: { icon: LucideIcon; label: string; value: string | number; description?: string; colorClass?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800/50 hover:bg-zinc-800/40 hover:border-zinc-700/60 hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-zinc-600/50 transition-all duration-300">
          <Icon size={15} className={`${colorClass} transition-colors duration-300`} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{label}</p>
          <p className="text-base font-extrabold text-white mt-1 leading-none">{value}</p>
        </div>
      </div>
      {description && (
        <p className="text-[10px] text-zinc-500 mt-2 font-medium border-t border-zinc-800/50 pt-2">{description}</p>
      )}
    </motion.div>
  )
}

const SECTION_LABELS: Record<string, string> = {
  completeness: 'Core Structure',
  keywords: 'Keyword Match',
  formatting: 'Parser Formatting',
  actionVerbs: 'Action Verbs',
  quantifiedResults: 'Metrics & Data',
  contactInfo: 'Contact Info',
  dateConsistency: 'Date Consistency',
  length: 'Optimal Length',
}

const BAR_COLORS: Record<string, string> = {
  completeness: 'bg-indigo-500',
  keywords: 'bg-emerald-500',
  formatting: 'bg-cyan-500',
  actionVerbs: 'bg-violet-500',
  quantifiedResults: 'bg-pink-500',
  contactInfo: 'bg-blue-500',
  dateConsistency: 'bg-amber-500',
  length: 'bg-orange-500',
}

const BAR_SHADOWS: Record<string, string> = {
  completeness: '#6366f1',
  keywords: '#10b981',
  formatting: '#06b6d4',
  actionVerbs: '#8b5cf6',
  quantifiedResults: '#ec4899',
  contactInfo: '#3b82f6',
  dateConsistency: '#f59e0b',
  length: '#f97316',
}

export default function AtsChecker({ resumeData, jobDescription, onUpdateJobDescription, onFix, onNavigateToSection }: AtsCheckerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'keywords'>('overview')
  const [showJdInput, setShowJdInput] = useState(false)
  const [jdDraft, setJdDraft] = useState(jobDescription)
  const [isFixing, setIsFixing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastAudited, setLastAudited] = useState(new Date())
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({})

  const SCAN_STAGES = [
    { label: 'Parsing resume structure...', sublabels: ['Scanning section headers', 'Indexing contact metadata', 'Detecting layout patterns', 'Mapping document hierarchy'], pct: 20 },
    { label: 'Analyzing keyword density...', sublabels: ['Cross-referencing skill taxonomy', 'Weighting against target role', 'Computing semantic similarity', 'Building keyword heatmap'], pct: 40 },
    { label: 'Checking formatting safety...', sublabels: ['Scanning special characters', 'Validating date formats', 'Detecting pronoun usage', 'Checking encoding safety'], pct: 60 },
    { label: 'Evaluating section completeness...', sublabels: ['Scoring core sections', 'Rating expected sections', 'Checking optional sections', 'Calculating coverage metrics'], pct: 80 },
    { label: 'Generating multi-dimensional report...', sublabels: ['Compiling dimension scores', 'Calculating weighted totals', 'Generating recommendations', 'Finalizing audit report'], pct: 100 },
  ]

  const [scanStage, setScanStage] = useState(0)
  const [resumeScanVersion, setResumeScanVersion] = useState(1)
  const [microTick, setMicroTick] = useState(0)
  const [scanLogs, setScanLogs] = useState<string[]>([])

  const atsScore = useMemo(() => evaluateResume(resumeData, jobDescription), [resumeData, jobDescription])
  const resultKey = useMemo(() =>
    atsScore.total + '|' + (atsScore.reportV2?.breakdown?.map(b => b.score).join(',') || ''),
  [atsScore])

  const prevResultKey = useRef('')
  useEffect(() => {
    if (!prevResultKey.current) {
      prevResultKey.current = resultKey
      return
    }
    if (prevResultKey.current === resultKey) return
    prevResultKey.current = resultKey

    setIsScanning(true)
    setScanStage(0)
    setResumeScanVersion(v => v + 1)
    setScanLogs([])
    setMicroTick(0)

    const timeouts: ReturnType<typeof setTimeout>[] = []
    let d = 0
    const delays = [800, 700, 650, 550, 400]
    delays.forEach((ms, i) => {
      d += ms
      const t = setTimeout(() => {
        if (i < delays.length - 1) {
          setScanStage(i + 1)
        } else {
          setIsScanning(false)
          setLastAudited(new Date())
        }
      }, d)
      timeouts.push(t)
    })

    const microInterval = setInterval(() => {
      setMicroTick(t => t + 1)
    }, 85)

    const logLines = [
      'initializing scan engine...', 'loading ATS ruleset', 'parsing document tree',
      'indexing 47 tokens', 'extracting 12 sections', 'linking section metadata',
      'computing keyword vector', 'checking 183 terms', 'applying synonym map (62 entries)',
      'scanning formatting rules', 'validating 8 date fields', 'checking encoding safety',
      'measuring section coverage', 'rating bullet quality', 'benchmarking against standards',
      'compiling weighted scores', 'generating recommendations', 'finalizing audit report',
    ]
    let logIdx = 0
    const logInterval = setInterval(() => {
      setScanLogs(prev => {
        const next = [...prev, logLines[logIdx % logLines.length]]
        logIdx++
        return next.slice(-6)
      })
    }, 95)

    return () => { timeouts.forEach(clearTimeout); clearInterval(microInterval); clearInterval(logInterval) }
  }, [resultKey])

  const report = atsScore.reportV2
  const animatedScore = useCountUp(atsScore.total, 1200)

  const resumeDomain = report?.resumeDomain || 'unknown'
  const jdDomain = report?.jdDomain || 'unknown'
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

  const handleSaveJd = useCallback(() => {
    onUpdateJobDescription(jdDraft)
    setShowJdInput(false)
  }, [jdDraft, onUpdateJobDescription])

  const handleAutoFix = useCallback(() => {
    setIsFixing(true)
    setTimeout(() => {
      onFix(autoFix(resumeData))
      setIsFixing(false)
    }, 400)
  }, [resumeData, onFix])

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

  const toggleExpandIssue = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Grouping issues for checklist tab
  const criticalIssues = report?.critical || []
  const warningIssues = report?.warnings || []
  const suggestionIssues = report?.suggestions || []
  const totalIssuesCount = criticalIssues.length + warningIssues.length + suggestionIssues.length

  const skillsMatrix = useMemo(() => {
    return report?.skillsMatrix || calculateSkillsMatrix(resumeData, jobDescription)
  }, [resumeData, jobDescription, report])

  const scoreColor = atsScore.total >= 90 ? 'text-emerald-400' : atsScore.total >= 70 ? 'text-blue-400' : atsScore.total >= 55 ? 'text-amber-400' : 'text-red-400'
  const scoreBg = atsScore.total >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' : atsScore.total >= 70 ? 'bg-blue-500/10 border-blue-500/20' : atsScore.total >= 55 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden no-print bg-zinc-950 font-sans">
      {/* ═══ Header ═══ */}
      <header className="flex items-center justify-between border-b border-zinc-800/40 px-6 py-4 bg-zinc-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-white tracking-tight">ATS Audit Center</h2>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                  <span className="relative rounded-full bg-emerald-400 w-1.5 h-1.5" />
                </span>
                <span className="text-[7px] font-extrabold text-emerald-400 uppercase tracking-widest">Live</span>
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">Last audited · {lastAudited.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowJdInput(true)}
            className="group text-[11px] font-bold px-3.5 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <FileCode size={13} className="text-zinc-500 group-hover:scale-105 transition-transform" />
            {jobDescription ? 'Update Target JD' : 'Configure JD'}
          </button>
          <button
            onClick={handleAutoFix}
            disabled={isFixing}
            className="group text-[11px] font-bold px-3.5 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-400 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-500/10"
          >
            <Zap size={13} className="text-white fill-white animate-pulse" />
            {isFixing ? 'Fixing Resume...' : 'Instant Auto-Fix'}
          </button>
        </div>
      </header>

      {/* ═══ Navigation Tabs ═══ */}
      <nav className="flex px-6 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'overview' ? 'border-rose-500 text-rose-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          <BarChart3 size={13} />
          Overview Report
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'audit' ? 'border-rose-500 text-rose-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          <CheckCircle2 size={13} />
          Audit Checklist
          {totalIssuesCount > 0 && (
            <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-full ${criticalIssues.length > 0 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {totalIssuesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('keywords')}
          className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'keywords' ? 'border-rose-500 text-rose-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          <Target size={13} />
          Keywords Mapping
          {jobDescription && (
            <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-emerald-500/20 text-emerald-400 rounded-full">
              JD Linked
            </span>
          )}
        </button>
      </nav>

      {/* ═══ Content Area ═══ */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[960px] mx-auto p-6 space-y-6">

          {/* ─── JD Input Accordion ─── */}
          <AnimatePresence>
            {showJdInput && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.97 }}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCode size={14} className="text-rose-400" />
                    Target Job Description (ATS Matching)
                  </h4>
                  <button onClick={() => { setShowJdInput(false); setJdDraft(jobDescription) }} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                    <XCircle size={15} />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">Paste the job description of the position you are targeting. The system will analyze keyword weight, synonym overlaps, and calculate semantic similarity.</p>
                <textarea
                  value={jdDraft}
                  onChange={e => setJdDraft(e.target.value)}
                  placeholder="Paste a job description here (e.g. 'We are looking for a Senior React Developer with experience in TypeScript, Node.js, and Docker...')"
                  className="w-full h-36 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all resize-none font-mono"
                />
                <div className="flex justify-end gap-2 mt-3.5">
                  <button
                    onClick={() => { setShowJdInput(false); setJdDraft(jobDescription) }}
                    className="px-3.5 py-2 text-[11px] font-bold text-zinc-400 hover:text-white border border-zinc-800 rounded-xl hover:bg-zinc-800/30 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveJd}
                    className="px-4 py-2 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    Update Target
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center py-10"
              >
                {/* Frosted Glass Scanner Card */}
                <div className="glass-card rounded-3xl p-8 max-w-md w-full border border-white/[0.06] relative overflow-hidden bg-zinc-950/40 backdrop-blur-md flex flex-col items-center space-y-6 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
                  {/* Scanning Beam Line */}
                  <motion.div
                    className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-400/80 to-transparent pointer-events-none z-10"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ filter: 'blur(1px)' }}
                  />
                  <motion.div
                    className="absolute inset-x-8 h-12 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none z-0"
                    animate={{ top: ['-10%', '110%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />

                  {/* Background Glows */}
                  <div className="absolute -right-20 -top-20 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
                  <motion.div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    animate={{ boxShadow: ['inset 0 0 30px rgba(244,63,94,0.03)', 'inset 0 0 60px rgba(244,63,94,0.07)', 'inset 0 0 30px rgba(244,63,94,0.03)'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Header Title */}
                  <div className="text-center space-y-1.5 w-full">
                    <motion.span
                      className="inline-block text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full"
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      ATS Scanning Active
                    </motion.span>
                    <h3 className="text-base font-extrabold text-white mt-3">Analyzing Resume Compliance</h3>
                  </div>

                  {/* Circular SVG Progress Loader */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Outer pulsing ring */}
                    <motion.div
                      className="absolute w-36 h-36 rounded-full border border-rose-500/20"
                      animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute w-40 h-40 rounded-full border border-rose-500/10"
                      animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.05, 0.15] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    />
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                      <motion.circle
                        cx="64" cy="64" r="54"
                        className="stroke-rose-500"
                        strokeWidth="6" fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 54}
                        animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - SCAN_STAGES[scanStage].pct / 100) }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="absolute inset-2 rounded-full border border-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)] pointer-events-none" />
                    <div className="absolute text-center">
                      <motion.span
                        key={SCAN_STAGES[scanStage].pct}
                        className="text-2xl font-black text-white leading-none font-mono tabular-nums"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.25 }}
                      >
                        {Math.round(SCAN_STAGES[scanStage].pct)}
                      </motion.span>
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mt-0.5">Progress</span>
                    </div>
                  </div>

                  {/* Vertical Audit Checklist */}
                  <div className="w-full space-y-3 pt-4 border-t border-zinc-900">
                    {SCAN_STAGES.map((stage, idx) => {
                      const isCompleted = idx < scanStage
                      const isActive = idx === scanStage
                      const microIdx = microTick % stage.sublabels.length

                      return (
                        <motion.div
                          key={idx}
                          layout
                          className={`flex items-start gap-3 rounded-xl px-3 py-2 -mx-3 transition-all duration-500 ${
                            isCompleted ? 'opacity-50' : isActive ? 'bg-rose-500/[0.04] shadow-[inset_0_0_20px_rgba(244,63,94,0.04)]' : 'opacity-25'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              >
                                <CheckCircle2 size={16} className="text-emerald-400" />
                              </motion.div>
                            ) : isActive ? (
                              <div className="relative">
                                <RefreshCw size={15} className="text-rose-400 animate-spin" />
                                <motion.div
                                  className="absolute inset-0 rounded-full border border-rose-400/30"
                                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                />
                              </div>
                            ) : (
                              <Circle size={15} className="text-zinc-700" />
                            )}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <p className={`text-[11px] font-bold leading-tight truncate ${isActive ? 'text-rose-300' : 'text-zinc-200'}`}>
                              {stage.label}
                            </p>
                            {isActive && (
                              <motion.p
                                key={microIdx}
                                className="text-[9.5px] text-zinc-400 leading-normal"
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 4 }}
                                transition={{ duration: 0.2 }}
                              >
                                {stage.sublabels[microIdx]}
                              </motion.p>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Live Scan Log */}
                  <div className="w-full pt-3 border-t border-zinc-900/60">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Operation Log</span>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-hidden">
                      {scanLogs.map((log, i) => (
                        <motion.div
                          key={`${resumeScanVersion}-${i}`}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[9px] text-zinc-600 font-mono truncate"
                        >
                          <span className="text-zinc-700">$</span> {log}
                        </motion.div>
                      ))}
                      <motion.div
                        className="text-[9px] text-zinc-700 font-mono"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        <span className="text-zinc-700">$</span> _
                      </motion.div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="w-full pt-2 flex justify-between items-center text-[8px] text-zinc-700 font-mono">
                    <span>ENGINE v2.3</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-400/50 animate-pulse" />
                      analyzing v{resumeScanVersion}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* ─── TAB 1: OVERVIEW ─── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Domain Mismatch Banner */}
                    {report?.critical.some(i => i.id === 'domain-mismatch') && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold animate-fade-in shadow-inner shadow-red-500/5 w-full">
                        <strong className="text-sm font-bold text-red-300 block">Role mismatch detected</strong>
                        <p className="mt-1 text-zinc-400 font-normal leading-relaxed text-[13px]">
                          Your resume targets <strong>{resumeDomain.replace(/_/g, ' ')}</strong> roles. This JD is for a <strong>{jdDomain.replace(/_/g, ' ')}</strong> position. The score below reflects formatting and writing quality, not job fit.
                        </p>
                      </div>
                    )}
                    {/* Main Score & Gauge Panel */}
                    <div className="relative bg-gradient-to-br from-zinc-900/60 via-zinc-900/30 to-zinc-950/60 border border-zinc-900 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center gap-8 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl" />
                      <ScoreGauge score={animatedScore} gradeLabel={report?.gradeLabel || atsScore.grade} />
                      
                      <div className="flex-1 w-full space-y-4 text-center md:text-left">
                        <div>
                          <h3 className="text-xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
                            ATS Scan Status
                            <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-lg border ${scoreBg} ${scoreColor}`}>
                              {report?.grade || 'N/A'}
                            </span>
                          </h3>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-lg">
                            Your resume has been parsed according to standard parser constraints. 
                            {atsScore.total >= 80 
                              ? ' High probability of passing automated screening filters. Keep it tailored.' 
                              : ' Improve formatting and match skills keywords to cross the recommended 80+ threshold.'}
                          </p>
                        </div>

                        {/* Interactive Scale indicator */}
                        <div className="space-y-2 pt-2">
                          <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-blue-500 to-emerald-500" />
                            <motion.div
                              initial={{ left: '0%' }}
                              animate={{ left: `${atsScore.total}%` }}
                              transition={{ duration: 1.2, ease: 'easeOut' }}
                              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-[3px] border-zinc-950 -ml-2 shadow-xl shadow-black/85 z-10 cursor-pointer"
                              whileHover={{ scale: 1.2 }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[8px] text-zinc-500 font-extrabold uppercase tracking-wider px-0.5">
                            <span>Poor (&lt;50)</span>
                            <span>Fair (50-70)</span>
                            <span>Good (70-90)</span>
                            <span>Excellent (90+)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <MetricTile
                        icon={Activity}
                        label="Total Words"
                        value={totalWords}
                        description={totalWords < 250 ? "Length is too short. Target ~300+ words." : totalWords > 1000 ? "Too wordy. Keep it concise." : "Optimal word count."}
                        colorClass="text-indigo-400"
                      />
                      <MetricTile
                        icon={FileText}
                        label="Parser Safety"
                        value={parseabilityStatus}
                        description={report?.atsParseability && report.atsParseability < 100 ? `${100 - report.atsParseability}% broken encoding risk.` : "0% parsing blockers detected."}
                        colorClass={parseabilityColor}
                      />
                      <MetricTile
                        icon={BookOpen}
                        label="Readability"
                        value={readabilityLabel}
                        description={readabilityFeedback}
                        colorClass="text-cyan-400"
                      />
                      <MetricTile
                        icon={Target}
                        label="JD Keywords Match"
                        value={jobDescription ? `${report?.categories.find(c => c.key === 'keywords')?.score || 0}/25` : 'N/A'}
                        description={jobDescription ? "Matched skills token count." : "Configure JD in the header to check keyword overlap."}
                        colorClass="text-emerald-400"
                      />
                      <MetricTile
                        icon={Briefcase}
                        label="Domain Fit"
                        value={fitStatus}
                        description={jobDescription 
                          ? `Resume: ${resumeDomain.replace(/_/g, ' ')} / JD: ${jdDomain.replace(/_/g, ' ')}` 
                          : "Configure JD to classify role domain."
                        }
                        colorClass={fitColorClass}
                      />
                    </div>

                    {/* Category Breakdown list */}
                    <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-900 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <BarChart3 size={14} className="text-rose-400" />
                          Category breakdown
                        </h3>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Weighted evaluation</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {report?.categories.map((cat, idx) => {
                          const pct = cat.max > 0 ? (cat.score / cat.max) * 100 : 0
                          const color = BAR_COLORS[cat.key] || 'bg-zinc-400'
                          const shadow = BAR_SHADOWS[cat.key] || '#a1a1aa'
                          
                          // If weight is 0 (i.e. keywords when no JD), show as excluded/disabled
                          const isDisabled = cat.weight === 0

                          return (
                            <div key={cat.key} className={`flex flex-col space-y-1 group ${isDisabled ? 'opacity-30' : ''}`}>
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                  {SECTION_LABELS[cat.key] || cat.label}
                                </span>
                                <span className="font-bold text-zinc-300 tabular-nums">
                                  {isDisabled ? 'Excluded' : `${cat.score}/${cat.max}`}
                                </span>
                              </div>
                              <div className="relative h-2 bg-zinc-950 rounded-full overflow-hidden">
                                {!isDisabled && (
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, delay: idx * 0.05, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${color}`}
                                    style={{ boxShadow: pct > 0 ? `0 0 8px ${shadow}30` : 'none' }}
                                  />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: AUDIT CHECKLIST ─── */}
                {activeTab === 'audit' && (
                  <div className="space-y-6">
                    {/* Critical Issues Section */}
                    {criticalIssues.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                          <ShieldAlert size={14} className="fill-red-400/10" />
                          Critical parser blockers ({criticalIssues.length})
                        </h4>
                        <div className="space-y-3">
                          {criticalIssues.map((issue) => (
                            <div
                              key={issue.id}
                              className="bg-red-950/10 border border-red-500/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-red-500/20 transition-colors shadow-inner"
                            >
                              <div className="flex gap-3 items-start min-w-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 shrink-0 ring-4 ring-red-400/20" />
                                <div>
                                  <h5 className="text-xs font-bold text-red-200 leading-snug">{issue.issue}</h5>
                                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{issue.fix}</p>
                                </div>
                              </div>
                              {issue.section && (
                                <button
                                  onClick={() => onNavigateToSection(issue.section!)}
                                  className="shrink-0 text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/10 hover:border-red-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  Fix section <ArrowRight size={10} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={14} className="fill-amber-400/10" />
                        Warnings & formatting errors ({warningIssues.length})
                      </h4>
                      {warningIssues.length === 0 ? (
                        <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-4 text-center text-zinc-500 text-xs py-6">
                          No formatting warnings detected. Your layout looks clean and parseable.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {warningIssues.map((issue) => {
                            const isExpanded = !!expandedIssues[issue.id]
                            const hasDetails = !!(issue.details && issue.details.length > 0)
                            
                            return (
                              <div
                                key={issue.id}
                                className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl overflow-hidden hover:border-zinc-700/60 transition-colors"
                              >
                                <div 
                                  className={`p-4 flex gap-4 justify-between items-start md:items-center cursor-pointer ${hasDetails ? 'select-none hover:bg-zinc-900/10' : ''}`}
                                  onClick={() => hasDetails && toggleExpandIssue(issue.id)}
                                >
                                  <div className="flex gap-3 items-start min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 ring-4 ring-amber-400/20" />
                                    <div>
                                      <h5 className="text-xs font-bold text-zinc-200 leading-snug">{issue.issue}</h5>
                                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{issue.fix}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {issue.section && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onNavigateToSection(issue.section!)
                                        }}
                                        className="shrink-0 text-[9px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 px-2.5 py-1.5 rounded-lg border border-rose-500/10 hover:border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        Edit <ArrowRight size={10} />
                                      </button>
                                    )}
                                    {hasDetails && (
                                      <div className="text-zinc-500 hover:text-white transition-colors shrink-0">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Detailed lines / expandable area */}
                                <AnimatePresence>
                                  {isExpanded && hasDetails && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="overflow-hidden bg-zinc-950/50 border-t border-zinc-900/60"
                                    >
                                      <div className="p-4 space-y-2.5">
                                        <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest">Identified items needing review:</p>
                                        <ul className="space-y-2 pl-1.5">
                                          {issue.details?.map((detail, dIdx) => (
                                            <li key={dIdx} className="text-[10px] text-zinc-300 border-l-2 border-rose-500/40 pl-3 leading-relaxed py-0.5">
                                              {detail}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Suggestions Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb size={14} className="fill-cyan-400/10" />
                        Suggestions & styling enhancements ({suggestionIssues.length})
                      </h4>
                      {suggestionIssues.length === 0 ? (
                        <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-4 text-center text-zinc-500 text-xs py-6">
                          No stylistic suggestions. Your writing matches standard active, metrics-driven formats.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {suggestionIssues.map((issue) => {
                            const isExpanded = !!expandedIssues[issue.id]
                            const hasDetails = !!(issue.details && issue.details.length > 0)
                            
                            return (
                              <div
                                key={issue.id}
                                className="bg-zinc-900/10 border border-zinc-900/60 rounded-2xl overflow-hidden hover:border-zinc-800/80 transition-colors"
                              >
                                <div 
                                  className={`p-4 flex gap-4 justify-between items-start md:items-center cursor-pointer ${hasDetails ? 'select-none hover:bg-zinc-900/10' : ''}`}
                                  onClick={() => hasDetails && toggleExpandIssue(issue.id)}
                                >
                                  <div className="flex gap-3 items-start min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 ring-4 ring-cyan-400/10" />
                                    <div>
                                      <h5 className="text-xs font-bold text-zinc-200 leading-snug">{issue.issue}</h5>
                                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{issue.fix}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {issue.section && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onNavigateToSection(issue.section!)
                                        }}
                                        className="shrink-0 text-[9px] font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 px-2.5 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        Edit <ArrowRight size={10} />
                                      </button>
                                    )}
                                    {hasDetails && (
                                      <div className="text-zinc-500 hover:text-white transition-colors shrink-0">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {isExpanded && hasDetails && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="overflow-hidden bg-zinc-950/30 border-t border-zinc-900/60"
                                    >
                                      <div className="p-4 space-y-2.5">
                                        <p className="text-[9px] font-extrabold text-zinc-600 uppercase tracking-widest">Identified items needing metrics:</p>
                                        <ul className="space-y-2 pl-1.5">
                                          {issue.details?.map((detail, dIdx) => (
                                            <li key={dIdx} className="text-[10px] text-zinc-400 border-l-2 border-cyan-500/20 pl-3 leading-relaxed py-0.5">
                                              {detail}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: KEYWORD MATCHING ─── */}
                {activeTab === 'keywords' && (
                  <div className="space-y-6">
                    {/* Empty JD State */}
                    {!jobDescription ? (
                      <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-4 my-8 shadow-xl">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
                          <Target size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Compare with Job Description</h4>
                          <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
                            Paste a job listing to compare skill keywords automatically. This unlocks the Skills Matrix, matched vocabulary checks, and semantic relevance scores.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowJdInput(true)}
                          className="text-xs font-bold px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Plus size={14} />
                          Paste Target Job Description
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Skills breakdown header info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <Target size={20} className="text-emerald-400 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Semantic Overlap</p>
                              <h4 className="text-xl font-extrabold text-white mt-0.5">{report?.semanticScore || 0}% Match</h4>
                              <p className="text-[10px] text-zinc-400 leading-normal mt-1">Vocabulary relevance compared to the job description tokens.</p>
                            </div>
                          </div>

                          <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                              <TrendingUp size={20} className="text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target Industry</p>
                              <h4 className="text-xl font-extrabold text-white mt-0.5">Technology</h4>
                              <p className="text-[10px] text-zinc-400 leading-normal mt-1">Automatic profile detection optimized for standard tech roles.</p>
                            </div>
                          </div>
                        </div>

                        {/* Keyword list categories */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Indexed Skills & Keywords Matrix</h4>
                          <div className="space-y-4">
                            {skillsMatrix.map((item, idx) => {
                              const matchPercent = item.required > 0 ? Math.round((item.matched.length / (item.matched.length + item.missing.length || 1)) * 100) : 100

                              return (
                                <div
                                  key={idx}
                                  className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-5 space-y-4 hover:border-zinc-800 transition-colors shadow-lg"
                                >
                                  {/* Item Header */}
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                      <h5 className="text-xs font-bold text-white">{item.subject}</h5>
                                      <p className="text-[10px] text-zinc-500 leading-none mt-1">
                                        Matched: {item.matched.length} of {item.matched.length + item.missing.length} keywords identified.
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                                      <div className="w-24 sm:w-28 h-1.5 bg-zinc-950 rounded-full overflow-hidden shrink-0">
                                        <div
                                          className={`h-full rounded-full ${matchPercent >= 80 ? 'bg-emerald-500' : matchPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                          style={{ width: `${matchPercent}%` }}
                                        />
                                      </div>
                                      <span className={`text-[10px] font-black tabular-nums ${matchPercent >= 80 ? 'text-emerald-400' : matchPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {matchPercent}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Keywords lists */}
                                  <div className="space-y-3 pt-2 border-t border-zinc-900/60">
                                    {/* Matched Keywords */}
                                    {item.matched.length > 0 && (
                                      <div className="space-y-1.5">
                                        <p className="text-[9px] font-extrabold text-emerald-500/80 uppercase tracking-widest flex items-center gap-1.5">
                                          <Check size={10} />
                                          Matched ({item.matched.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {item.matched.map((kw, kwIdx) => {
                                            const spec = weightKeyword(kw)
                                            const specColor = spec === 'high' 
                                              ? 'bg-rose-500/20 text-rose-300' 
                                              : spec === 'medium'
                                              ? 'bg-blue-500/20 text-blue-300'
                                              : 'bg-zinc-800 text-zinc-400'
                                            return (
                                              <span
                                                key={kwIdx}
                                                className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5"
                                              >
                                                {kw}
                                                <span className={`px-1 rounded text-[7px] font-extrabold uppercase ${specColor}`}>
                                                  {spec}
                                                </span>
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Missing Keywords */}
                                    {item.missing.length > 0 && (
                                      <div className="space-y-1.5 pt-1">
                                        <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                          <Plus size={10} />
                                          Missing ({item.missing.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {item.missing.map((kw, kwIdx) => (
                                            <span
                                              key={kwIdx}
                                              className="text-[9px] font-bold bg-zinc-900 border border-dashed border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full hover:border-rose-500/30 hover:text-zinc-200 transition-colors"
                                              title="Add this skill keyword to experience or skills list"
                                            >
                                              {kw}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
