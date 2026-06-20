import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ResumeData } from '../types/resume'
import type { RoleDomain } from '../utils/roleClassifier'
import type { LucideIcon } from 'lucide-react'
import { evaluateResume, calculateSkillsMatrix, weightKeyword } from '../utils/atsEvaluator'
import { computeDomainPenalty } from '../utils/roleClassifier'
import {
  CheckCircle2, XCircle, FileCode, Activity,
  Target, Sparkles, ArrowRight, Lightbulb, BarChart3,
  AlertTriangle, ShieldAlert, TrendingUp,
  ChevronDown, ChevronUp, ChevronRight, BookOpen,
  Plus, Check, FileText, Briefcase, Copy
} from 'lucide-react'
import { ISSUE_EXPLANATIONS, POWER_VERBS, FORMATTING_RULES } from '../utils/atsGuideData'

interface AtsCheckerProps {
  resumeData: ResumeData
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void

  onNavigateToSection: (section: string) => void
  templateFontSize?: number
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

/* ─── Score Gauge ─── */
function ScoreGauge({ score, gradeLabel }: { score: number; gradeLabel: string }) {
  const size = 160
  const stroke = 10
  const r = (size - stroke * 2) / 2
  const c = r * 2 * Math.PI
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 55 ? '#f59e0b' : '#ef4444'
  
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {/* Gradient track background */}
      <svg width={size} height={size} className="absolute -rotate-90" style={{ opacity: 0.15 }}>
        <defs>
          <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#trackGradient)" strokeWidth={stroke} />
      </svg>
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(24 24 27)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-3xl font-bold text-white tabular-nums tracking-tight leading-none">{score}</span>
        <span className="text-[9px] text-zinc-500 font-medium mt-0.5">{gradeLabel}</span>
      </div>
    </div>
  )
}

/* ─── Metric Tile ─── */
function MetricTile({ icon: Icon, label, value, description, colorClass = "text-zinc-400" }: { icon: LucideIcon; label: string; value: string | number; description?: string; colorClass?: string }) {
  const tintMap: Record<string, string> = {
    'text-indigo-400': 'bg-indigo-500/8',
    'text-emerald-400': 'bg-emerald-500/8',
    'text-cyan-400': 'bg-cyan-500/8',
    'text-amber-400': 'bg-amber-500/8',
    'text-red-400': 'bg-red-500/8',
  }
  const bgClass = tintMap[colorClass] || 'bg-zinc-800/40'

  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-zinc-900/35 border border-zinc-800/35 p-3.5 hover:border-zinc-700/45 transition-all">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
          <Icon size={13} className={colorClass} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm font-semibold text-white mt-px truncate">{value}</p>
        </div>
      </div>
      {description && (
        <p className="text-[10px] text-zinc-600 leading-relaxed border-t border-zinc-800/30 pt-2">{description}</p>
      )}
    </div>
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

export default function AtsChecker({ resumeData, jobDescription, onUpdateJobDescription, onNavigateToSection, templateFontSize }: AtsCheckerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'keywords'>('overview')
  const [showJdInput, setShowJdInput] = useState(false)
  const [jdDraft, setJdDraft] = useState(jobDescription)
  const [isScanning, setIsScanning] = useState(false)
  const [lastAudited, setLastAudited] = useState(new Date())
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({})

  // ATS Writing Guide state
  const [guideTab, setGuideTab] = useState<'formula' | 'verbs' | 'format'>('formula')
  const [xyzX, setXyzX] = useState('')
  const [xyzY, setXyzY] = useState('')
  const [xyzZ, setXyzZ] = useState('')
  const [selectedVerbCat, setSelectedVerbCat] = useState('Tech & Dev')
  const [copiedVerb, setCopiedVerb] = useState<string | null>(null)
  const [copiedBullet, setCopiedBullet] = useState(false)

  const SCAN_STAGES = [
    { label: 'Parsing document tree', pct: 8, log: 'reading DOM layout... 6 blocks mapped' },
    { label: 'Indexing contact metadata', pct: 16, log: 'extracted name, email, phone, linkedin' },
    { label: 'Extracting section boundaries', pct: 24, log: 'detected 5 core sections + 4 optional' },
    { label: 'Tokenizing bullet content', pct: 34, log: 'parsed 183 tokens across 12 entries' },
    { label: 'Cross-referencing skill taxonomy', pct: 44, log: 'matched 47 terms against role profile' },
    { label: 'Computing semantic density', pct: 54, log: 'weighting keyword clusters... 62 synonyms applied' },
    { label: 'Validating date consistency', pct: 62, log: 'checked 8 date fields — all ISO compliant' },
    { label: 'Scanning formatting safety', pct: 70, log: 'pronoun check passed • encoding clean' },
    { label: 'Rating bullet impact', pct: 80, log: 'scoring action verbs: 6 strong, 3 weak' },
    { label: 'Measuring section coverage', pct: 88, log: 'benchmarking vs 90th percentile profiles' },
    { label: 'Compiling dimension weights', pct: 95, log: 'applying 8 weighted metrics → composite score' },
    { label: 'Finalizing audit report', pct: 100, log: 'generating insights & recommendations...' },
  ]

  const [scanStage, setScanStage] = useState(0)
  const [resumeScanVersion, setResumeScanVersion] = useState(1)
  const [scanLogs, setScanLogs] = useState<string[]>([])

  // Local storage keys
  const LAST_AUDITED_RESUME_KEY = 'seve-last-audited-resume'
  const LAST_AUDITED_JD_KEY = 'seve-last-audited-jd'

  // Initialize dataRef with persistent last audited state (if it exists)
  const dataRef = useRef<{ r: unknown; j: string } | null>(null)
  const hasInitializedRef = useRef(false)

  if (!hasInitializedRef.current) {
    hasInitializedRef.current = true
    try {
      const r = localStorage.getItem(LAST_AUDITED_RESUME_KEY)
      const j = localStorage.getItem(LAST_AUDITED_JD_KEY)
      if (r !== null && j !== null) {
        dataRef.current = { r: JSON.parse(r), j }
      }
    } catch {}
  }

  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scanTimeouts = useRef<ReturnType<typeof setTimeout>[]>([])
  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const atsScore = useMemo(() => evaluateResume(resumeData, jobDescription, templateFontSize), [resumeData, jobDescription, templateFontSize])

  useEffect(() => {
    // Only skip scan if we have a saved audited state and the content matches it
    if (dataRef.current !== null) {
      const isSameResume = JSON.stringify(dataRef.current.r) === JSON.stringify(resumeData)
      const isSameJd = dataRef.current.j === jobDescription
      if (isSameResume && isSameJd) {
        return
      }
    }

    // Set isScanning to true immediately to show the loading screen without delay
    setIsScanning(true)

    // Debounce: wait 500ms of no edits before scanning
    if (scanTimer.current) clearTimeout(scanTimer.current)
    scanTimer.current = setTimeout(() => {
      dataRef.current = { r: resumeData, j: jobDescription }

      setScanStage(0)
      setResumeScanVersion(v => v + 1)
      setScanLogs([])

      scanTimeouts.current = []
      let d = 0
      const delays = [800, 650, 600, 550, 500, 480, 450, 420, 400, 380, 350, 300]
      delays.forEach((ms, i) => {
        d += ms
        const t = setTimeout(() => {
          setScanStage(i + 1)
          if (i === delays.length - 1) {
            setTimeout(() => {
              setIsScanning(false)
              setLastAudited(new Date())
              // Persist last audited data
              try {
                localStorage.setItem(LAST_AUDITED_RESUME_KEY, JSON.stringify(resumeData))
                localStorage.setItem(LAST_AUDITED_JD_KEY, jobDescription)
              } catch {}
            }, 200)
          }
        }, d)
        scanTimeouts.current.push(t)
      })

      scanInterval.current = setInterval(() => {
        setScanLogs(prev => {
          const idx = prev.length
          if (idx >= SCAN_STAGES.length) return prev
          return [...prev, SCAN_STAGES[idx].log].slice(-5)
        })
      }, 520)
    }, 500)

    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current)
      scanTimeouts.current.forEach(clearTimeout)
      if (scanInterval.current) clearInterval(scanInterval.current)
    }
  }, [resumeData, jobDescription])

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
      <header className="flex items-center justify-between border-b border-zinc-800/30 px-5 py-3 bg-zinc-950/60">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Sparkles size={13} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">ATS Audit Center</h2>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[6px] font-semibold text-emerald-400 uppercase">Live</span>
              </span>
            </div>
            <p className="text-[9px] text-zinc-600">{lastAudited.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJdInput(true)}
            className="text-[10px] font-medium px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileCode size={12} />
            {jobDescription ? 'Update JD' : 'Configure JD'}
          </button>
        </div>
      </header>

      {/* ═══ Navigation Tabs ═══ */}
      <nav className="flex px-5 border-b border-zinc-900 bg-zinc-950/20 shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <BarChart3 size={12} />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'audit' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <CheckCircle2 size={12} />
          Checklist
          {!isScanning && totalIssuesCount > 0 && (
            <span className={`px-1 py-px text-[7px] font-semibold rounded-full ${criticalIssues.length > 0 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
              {totalIssuesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('keywords')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'keywords' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <Target size={12} />
          Keywords
          {jobDescription && (
            <span className="px-1 py-px text-[7px] font-semibold bg-emerald-500/15 text-emerald-400 rounded-full">Linked</span>
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
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <FileCode size={13} className="text-indigo-400" />
                    Target Job Description
                  </h4>
                  <button onClick={() => { setShowJdInput(false); setJdDraft(jobDescription) }} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer">
                    <XCircle size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mb-2.5">Paste a job description to analyze keyword overlap, semantic fit, and weighted scoring.</p>
                <textarea
                  value={jdDraft}
                  onChange={e => setJdDraft(e.target.value)}
                  placeholder="Paste a job description here..."
                  className="w-full h-28 bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => { setShowJdInput(false); setJdDraft(jobDescription) }}
                    className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 hover:text-white border border-zinc-800 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveJd}
                    className="px-3 py-1.5 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer"
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center py-6"
              >
                <div className="w-full max-w-sm">
                  <div className="relative rounded-xl border border-zinc-800/30 bg-zinc-950/80 p-5 overflow-hidden">
                    {/* Scanning line sweep */}
                    <motion.div
                      className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />

                    <div className="flex flex-col items-center gap-4 relative">

                      {/* Circular progress */}
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                          <circle cx="48" cy="48" r="42" fill="none" stroke="rgb(24 24 27)" strokeWidth="5" />
                          <motion.circle
                            cx="48" cy="48" r="42" fill="none" stroke="url(#scanGradient)" strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            animate={{ strokeDashoffset: `${2 * Math.PI * 42 * (1 - SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].pct / 100)}` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                          <defs>
                            <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#38bdf8" />
                              <stop offset="50%" stopColor="#2dd4bf" />
                              <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.span
                            key={SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].pct}
                            className="text-xl font-bold text-white tabular-nums leading-none"
                            initial={{ y: 4, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].pct}<span className="text-[10px] text-zinc-500">%</span>
                          </motion.span>
                        </div>
                      </div>

                      {/* Stage label */}
                      <div className="text-center h-10 flex flex-col items-center justify-center">
                        <motion.p
                          key={SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].label}
                          className="text-sm font-medium text-white/90"
                          initial={{ y: 4, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          {SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].label}
                        </motion.p>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400"
                          animate={{ width: `${SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>

                      {/* Live log — terminal style */}
                      <div className="w-full bg-zinc-950 rounded-lg border border-zinc-800/20 p-3 min-h-[72px]">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[7px] font-medium text-zinc-600 uppercase">scan</span>
                          <span className="text-[7px] text-zinc-700 font-mono ml-auto">{Math.min(scanStage + 1, SCAN_STAGES.length)}/{SCAN_STAGES.length}</span>
                        </div>
                        <div className="space-y-0.5">
                          {scanLogs.map((log, i) => (
                            <motion.div
                              key={`${resumeScanVersion}-${i}`}
                              initial={{ opacity: 0, x: -3 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-[10px] text-zinc-400 font-mono leading-relaxed"
                            >
                              <span className="text-emerald-500/50">❯</span> {log}
                            </motion.div>
                          ))}
                          <motion.div
                            className="text-[10px] text-zinc-700 font-mono"
                            animate={{ opacity: [0.2, 0.6, 0.2] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          >
                            <span className="text-emerald-500/30">❯</span> _
                          </motion.div>
                        </div>
                      </div>
                    </div>
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
                  <div className="space-y-5">
                    {/* Domain Mismatch Banner */}
                    {report?.critical.some(i => i.id === 'domain-mismatch') && (
                      <div className="bg-amber-500/8 border border-amber-500/12 text-amber-400 p-3 rounded-lg text-[11px] flex items-start gap-2.5">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>
                          Your resume targets <strong>{resumeDomain.replace(/_/g, ' ')}</strong> roles. This JD is for <strong>{jdDomain.replace(/_/g, ' ')}</strong> position. Score reflects formatting &amp; writing quality, not job fit.
                        </span>
                      </div>
                    )}

                    {/* ─── Hero Score Panel ─── */}
                    <div className="bg-zinc-900/25 border border-zinc-800/45 rounded-xl overflow-hidden">
                      <div className="p-5 md:p-6 flex flex-col md:flex-row items-center gap-6">
                        <ScoreGauge score={animatedScore} gradeLabel={report?.gradeLabel || atsScore.grade} />
                        
                        <div className="flex-1 w-full space-y-4">
                          <div>
                            <div className="flex items-center gap-2.5 mb-1">
                              <h3 className="text-lg font-semibold text-white">ATS Scan Status</h3>
                              <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${scoreBg} ${scoreColor}`}>
                                {report?.grade || 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                              {atsScore.total >= 80 
                                ? 'Strong score — resume is well-optimized for ATS parsing. Keep tailoring for specific roles.'
                                : 'Needs improvement — focus on formatting and keyword alignment to cross the 80+ threshold.'}
                            </p>
                          </div>

                          {/* Quick stat chips */}
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                              <Activity size={11} className="text-zinc-500" />
                              <span className="text-[10px] text-zinc-300 font-medium">{totalWords} words</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                              <FileText size={11} className={parseabilityColor} />
                              <span className="text-[10px] text-zinc-300 font-medium">{parseabilityStatus}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                              <BookOpen size={11} className="text-cyan-400" />
                              <span className="text-[10px] text-zinc-300 font-medium">{readabilityLabel}</span>
                            </div>
                          </div>

                          {/* Score scale */}
                          <div className="pt-1">
                            <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-indigo-500 to-emerald-500" />
                              <motion.div
                                initial={{ left: '0%' }}
                                animate={{ left: `${atsScore.total}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-zinc-950 -ml-1.5 shadow-md z-10"
                              />
                            </div>
                            <div className="flex justify-between text-[7px] text-zinc-600 font-medium mt-1 px-0.5">
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

                    {/* ─── Stats Grid ─── */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      <MetricTile
                        icon={Activity}
                        label="Total Words"
                        value={totalWords}
                        description={totalWords < 250 ? "Too short. Target ~300+ words." : totalWords > 1000 ? "Too wordy. Keep concise." : "Optimal length."}
                        colorClass="text-indigo-400"
                      />
                      <MetricTile
                        icon={FileText}
                        label="Parser Safety"
                        value={parseabilityStatus}
                        description={report?.atsParseability && report.atsParseability < 100 ? `${100 - report.atsParseability}% broken encoding risk.` : "0% parsing blockers."}
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
                        label="JD Keywords"
                        value={jobDescription ? `${report?.categories.find(c => c.key === 'keywords')?.score || 0}/25` : 'N/A'}
                        description={jobDescription ? "Matched skills tokens." : "Configure JD to check overlap."}
                        colorClass="text-emerald-400"
                      />
                      <MetricTile
                        icon={Briefcase}
                        label="Domain Fit"
                        value={fitStatus}
                        description={jobDescription 
                          ? `Resume: ${resumeDomain.replace(/_/g, ' ')} / JD: ${jdDomain.replace(/_/g, ' ')}` 
                          : "Configure JD to classify domain."
                        }
                        colorClass={fitColorClass}
                      />
                    </div>

                    {/* ─── Issues at a Glance ─── */}
                    {totalIssuesCount > 0 && (
                      <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-5 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                            <ShieldAlert size={13} className="text-zinc-500" />
                            Issues at a glance
                          </h3>
                          <button
                            onClick={() => setActiveTab('audit')}
                            className="text-[9px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            View all ({totalIssuesCount}) <ArrowRight size={10} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {[...criticalIssues, ...warningIssues].slice(0, 3).map((issue) => (
                            <div
                              key={issue.id}
                              className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/30"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${criticalIssues.includes(issue) ? 'bg-red-400' : 'bg-amber-400'}`} />
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium text-zinc-300 leading-snug truncate">{issue.issue}</p>
                                <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{issue.fix}</p>
                              </div>
                              {issue.section && (
                                <button
                                  onClick={() => onNavigateToSection(issue.section!)}
                                  className="shrink-0 ml-auto p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                  <ChevronRight size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ─── Category Breakdown ─── */}
                    <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl overflow-hidden">
                      <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-zinc-800/30">
                        <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                          <BarChart3 size={13} className="text-indigo-400" />
                          Category breakdown
                        </h3>
                        <span className="text-[9px] text-zinc-600">Weighted evaluation</span>
                      </div>
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {report?.categories.map((cat, idx) => {
                          const pct = cat.max > 0 ? (cat.score / cat.max) * 100 : 0
                          const color = BAR_COLORS[cat.key] || 'bg-zinc-400'
                          const isDisabled = cat.weight === 0

                          return (
                            <div key={cat.key} className={`flex flex-col gap-1.5 ${isDisabled ? 'opacity-30' : ''}`}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400">{SECTION_LABELS[cat.key] || cat.label}</span>
                                <span className="font-medium text-zinc-300 tabular-nums">
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
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Checklist Issues */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Critical Issues Section */}
                      {criticalIssues.length > 0 && (
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                            <ShieldAlert size={13} className="text-red-400" />
                            Critical ({criticalIssues.length})
                          </h4>
                          <div className="space-y-2.5">
                            {criticalIssues.map((issue) => {
                              const isExpanded = !!expandedIssues[issue.id]
                              const help = ISSUE_EXPLANATIONS[issue.id]
                              const hasDetails = !!(issue.details && issue.details.length > 0)
                              const hasHelpOrDetails = !!(help || hasDetails)
                              
                              return (
                                <div
                                  key={issue.id}
                                  className="bg-red-950/5 border border-red-500/10 rounded-lg overflow-hidden"
                                >
                                  <div
                                    className={`p-3.5 flex gap-3 justify-between items-start md:items-center ${hasHelpOrDetails ? 'cursor-pointer select-none hover:bg-red-500/5' : ''}`}
                                    onClick={() => hasHelpOrDetails && toggleExpandIssue(issue.id)}
                                  >
                                    <div className="flex gap-2.5 items-start min-w-0">
                                      <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                      <div>
                                        <h5 className="text-xs font-medium text-zinc-205">{issue.issue}</h5>
                                        <p className="text-[10px] text-zinc-550 mt-0.5 leading-relaxed">{issue.fix}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {issue.section && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onNavigateToSection(issue.section!)
                                          }}
                                          className="text-[9px] font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          Fix <ArrowRight size={9} />
                                        </button>
                                      )}
                                      {hasHelpOrDetails && (
                                        <div className="text-zinc-500 hover:text-white transition-colors">
                                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {isExpanded && hasHelpOrDetails && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden border-t border-red-500/10"
                                      >
                                        <div className="p-3.5 bg-zinc-950/45 space-y-3">
                                          {help && (
                                            <div className="space-y-2.5">
                                              <div>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Why it matters for ATS:</p>
                                                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{help.whyItMatters}</p>
                                              </div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg">
                                                  <span className="text-[8px] font-semibold text-red-400 uppercase tracking-wider block mb-1">✕ Bad Example</span>
                                                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed whitespace-pre-wrap">{help.before}</p>
                                                </div>
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                                                  <span className="text-[8px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">✓ Optimized</span>
                                                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">{help.after}</p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {hasDetails && (
                                            <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/35">
                                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Items needing review:</p>
                                              <ul className="space-y-1">
                                                {issue.details?.map((detail, dIdx) => (
                                                  <li key={dIdx} className="text-[10px] text-zinc-400 border-l-2 border-red-400/50 pl-2.5 leading-relaxed py-0.5">
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
                            })}
                          </div>
                        </div>
                      )}

                      {/* Warnings Section */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                          <AlertTriangle size={13} className="text-amber-400" />
                          Warnings ({warningIssues.length})
                        </h4>
                        {warningIssues.length === 0 ? (
                          <div className="rounded-lg bg-zinc-900/20 border border-zinc-800/30 p-4 text-center text-zinc-500 text-xs">
                            No formatting warnings. Layout looks clean.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {warningIssues.map((issue) => {
                              const isExpanded = !!expandedIssues[issue.id]
                              const help = ISSUE_EXPLANATIONS[issue.id]
                              const hasDetails = !!(issue.details && issue.details.length > 0)
                              const hasHelpOrDetails = !!(help || hasDetails)
                              
                              return (
                                <div
                                  key={issue.id}
                                  className="bg-zinc-900/20 border border-zinc-800/30 rounded-lg overflow-hidden"
                                >
                                  <div 
                                    className={`p-3.5 flex gap-3 justify-between items-start md:items-center ${hasHelpOrDetails ? 'cursor-pointer select-none hover:bg-zinc-900/30' : ''}`}
                                    onClick={() => hasHelpOrDetails && toggleExpandIssue(issue.id)}
                                  >
                                    <div className="flex gap-2.5 items-start min-w-0">
                                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                      <div>
                                        <h5 className="text-xs font-medium text-zinc-200">{issue.issue}</h5>
                                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{issue.fix}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {issue.section && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onNavigateToSection(issue.section!)
                                          }}
                                          className="text-[9px] font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          Edit <ArrowRight size={9} />
                                        </button>
                                      )}
                                      {hasHelpOrDetails && (
                                        <div className="text-zinc-500 hover:text-white transition-colors">
                                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {isExpanded && hasHelpOrDetails && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden border-t border-zinc-800/30"
                                      >
                                        <div className="p-3.5 bg-zinc-950/45 space-y-3">
                                          {help && (
                                            <div className="space-y-2.5">
                                              <div>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Why it matters for ATS:</p>
                                                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{help.whyItMatters}</p>
                                              </div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg">
                                                  <span className="text-[8px] font-semibold text-red-400 uppercase tracking-wider block mb-1">✕ Bad Example</span>
                                                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed whitespace-pre-wrap">{help.before}</p>
                                                </div>
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                                                  <span className="text-[8px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">✓ Optimized</span>
                                                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">{help.after}</p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {hasDetails && (
                                            <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/35">
                                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Items needing review:</p>
                                              <ul className="space-y-1">
                                                {issue.details?.map((detail, dIdx) => (
                                                  <li key={dIdx} className="text-[10px] text-zinc-400 border-l-2 border-zinc-700 pl-2.5 leading-relaxed py-0.5">
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
                            })}
                          </div>
                        )}
                      </div>

                      {/* Suggestions Section */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                          <Lightbulb size={13} className="text-indigo-400" />
                          Suggestions ({suggestionIssues.length})
                        </h4>
                        {suggestionIssues.length === 0 ? (
                          <div className="rounded-lg bg-zinc-900/20 border border-zinc-800/30 p-4 text-center text-zinc-500 text-xs">
                            No suggestions. Your writing is solid.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {suggestionIssues.map((issue) => {
                              const isExpanded = !!expandedIssues[issue.id]
                              const help = ISSUE_EXPLANATIONS[issue.id]
                              const hasDetails = !!(issue.details && issue.details.length > 0)
                              const hasHelpOrDetails = !!(help || hasDetails)
                              
                              return (
                                <div
                                  key={issue.id}
                                  className="bg-zinc-900/10 border border-zinc-800/20 rounded-lg overflow-hidden"
                                >
                                  <div 
                                    className={`p-3.5 flex gap-3 justify-between items-start md:items-center ${hasHelpOrDetails ? 'cursor-pointer select-none hover:bg-zinc-900/25' : ''}`}
                                    onClick={() => hasHelpOrDetails && toggleExpandIssue(issue.id)}
                                  >
                                    <div className="flex gap-2.5 items-start min-w-0">
                                      <div className="w-2 h-2 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                                      <div>
                                        <h5 className="text-xs font-medium text-zinc-300">{issue.issue}</h5>
                                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{issue.fix}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {issue.section && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onNavigateToSection(issue.section!)
                                          }}
                                          className="text-[9px] font-medium text-zinc-500 hover:text-white bg-zinc-800/30 hover:bg-zinc-800/50 px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          Edit <ArrowRight size={9} />
                                        </button>
                                      )}
                                      {hasHelpOrDetails && (
                                        <div className="text-zinc-500 hover:text-white transition-colors">
                                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {isExpanded && hasHelpOrDetails && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden border-t border-zinc-800/20"
                                      >
                                        <div className="p-3.5 bg-zinc-950/45 space-y-3">
                                          {help && (
                                            <div className="space-y-2.5">
                                              <div>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Why it matters for ATS:</p>
                                                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{help.whyItMatters}</p>
                                              </div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg">
                                                  <span className="text-[8px] font-semibold text-red-400 uppercase tracking-wider block mb-1">✕ Bad Example</span>
                                                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed whitespace-pre-wrap">{help.before}</p>
                                                </div>
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                                                  <span className="text-[8px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">✓ Optimized</span>
                                                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">{help.after}</p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {hasDetails && (
                                            <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/35">
                                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Items to consider:</p>
                                              <ul className="space-y-1">
                                                {issue.details?.map((detail, dIdx) => (
                                                  <li key={dIdx} className="text-[10px] text-zinc-500 border-l-2 border-zinc-700/50 pl-2.5 leading-relaxed py-0.5">
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
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: ATS Writing & Formatting Guide */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
                      <div className="bg-zinc-905/35 border border-zinc-800/45 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen size={14} className="text-indigo-400" />
                          <div>
                            <h4 className="text-xs font-semibold text-white">ATS Excellence Guide</h4>
                            <p className="text-[10px] text-zinc-500">Writing standard &amp; format compliance</p>
                          </div>
                        </div>

                        {/* Guide Navigation */}
                        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950/80 rounded-lg border border-zinc-800/40 mb-4 shrink-0">
                          <button
                            onClick={() => setGuideTab('formula')}
                            className={`py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${guideTab === 'formula' ? 'bg-zinc-900 text-indigo-400 border border-zinc-800/40 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            📝 Formula
                          </button>
                          <button
                            onClick={() => setGuideTab('verbs')}
                            className={`py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${guideTab === 'verbs' ? 'bg-zinc-900 text-indigo-400 border border-zinc-800/40 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            ⚡ Power Verbs
                          </button>
                          <button
                            onClick={() => setGuideTab('format')}
                            className={`py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${guideTab === 'format' ? 'bg-zinc-900 text-indigo-400 border border-zinc-800/40 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            🛡️ Safety Rules
                          </button>
                        </div>

                        {/* Tab Contents */}
                        {guideTab === 'formula' && (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-zinc-300">The X-Y-Z Action Formula</p>
                              <p className="text-[10px] text-zinc-500 leading-relaxed">
                                Google recommends writing bullet points using this structure to prove scale, method, and results.
                              </p>
                            </div>

                            {/* X-Y-Z Formula Visual Card */}
                            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg font-mono text-[9px] leading-relaxed text-zinc-400 space-y-1 text-center">
                              <span className="text-white font-semibold block mb-0.5 text-[10px]">Accomplished [X]</span>
                              <span className="text-zinc-500 block">as measured by [Y]</span>
                              <span className="text-zinc-500 block">by doing [Z]</span>
                            </div>

                            {/* Interactive XYZ Builder */}
                            <div className="space-y-3 pt-2 border-t border-zinc-800/40">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Interactive Bullet Builder</p>
                              
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[8px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">What did you accomplish? (X)</label>
                                  <input
                                    type="text"
                                    value={xyzX}
                                    onChange={(e) => setXyzX(e.target.value)}
                                    placeholder="e.g., reduced database query latency"
                                    className="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500/50"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-[8px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">How was it measured? (Y)</label>
                                  <input
                                    type="text"
                                    value={xyzY}
                                    onChange={(e) => setXyzY(e.target.value)}
                                    placeholder="e.g., by 40% (saving 12 hours of processing time)"
                                    className="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500/50"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-[8px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">What action/method did you take? (Z)</label>
                                  <input
                                    type="text"
                                    value={xyzZ}
                                    onChange={(e) => setXyzZ(e.target.value)}
                                    placeholder="e.g., implementing query index caching and Redis stores"
                                    className="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500/50"
                                  />
                                </div>
                              </div>

                              {/* Assembled output preview */}
                              {(xyzX || xyzY || xyzZ) && (
                                <div className="space-y-2 pt-2">
                                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 relative group">
                                    <div className="absolute right-2 top-2">
                                      <button
                                        onClick={() => {
                                          const firstWordCapitalized = (xyzZ.trim().split(/\s+/)[0] || '').replace(/^[a-z]/, (char) => char.toUpperCase())
                                          const zRest = xyzZ.trim().substring(firstWordCapitalized.length)
                                          const zText = `${firstWordCapitalized}${zRest}`
                                          const resultText = `${zText ? zText + ', ' : ''}${xyzX.trim() ? xyzX.trim() : ''}${xyzY.trim() ? ' ' + xyzY.trim() : ''}.`
                                          navigator.clipboard.writeText(resultText)
                                          setCopiedBullet(true)
                                          setTimeout(() => setCopiedBullet(false), 2000)
                                        }}
                                        className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-505 hover:text-white transition-colors cursor-pointer"
                                        title="Copy bullet point"
                                      >
                                        {copiedBullet ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-mono pr-7 leading-relaxed">
                                      {(() => {
                                        const firstWordCapitalized = (xyzZ.trim().split(/\s+/)[0] || '').replace(/^[a-z]/, (char) => char.toUpperCase())
                                        const zRest = xyzZ.trim().substring(firstWordCapitalized.length)
                                        const zText = `${firstWordCapitalized}${zRest}`
                                        const resultText = `${zText ? zText + ', ' : ''}${xyzX.trim() ? xyzX.trim() : ''}${xyzY.trim() ? ' ' + xyzY.trim() : ''}.`
                                        return resultText || 'Type above to assemble bullet...'
                                      })()}
                                    </p>
                                  </div>
                                  {copiedBullet && (
                                    <p className="text-[9px] text-emerald-400 font-semibold text-right">Copied to clipboard!</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {guideTab === 'verbs' && (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-zinc-300">Verb Reference Directory</p>
                              <p className="text-[10px] text-zinc-500 leading-relaxed">
                                Avoid beginning bullets with soft expressions. Click any verb below to copy it instantly.
                              </p>
                            </div>

                            {/* Verb category picker */}
                            <div className="flex flex-wrap gap-1 border-b border-zinc-850 pb-2.5">
                              {POWER_VERBS.map((c) => (
                                <button
                                  key={c.category}
                                  onClick={() => setSelectedVerbCat(c.category)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer ${selectedVerbCat === c.category ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'bg-zinc-950 border border-zinc-850 text-zinc-500 hover:text-zinc-300'}`}
                                >
                                  {c.category}
                                </button>
                              ))}
                            </div>

                            {/* Verb selection list */}
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {POWER_VERBS.find((c) => c.category === selectedVerbCat)?.verbs.map((verb) => (
                                  <button
                                    key={verb}
                                    onClick={() => {
                                      navigator.clipboard.writeText(verb)
                                      setCopiedVerb(verb)
                                      setTimeout(() => setCopiedVerb(null), 1500)
                                    }}
                                    className="px-2 py-1 rounded bg-zinc-950/80 border border-zinc-850 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-705 transition-all cursor-pointer font-mono inline-flex items-center gap-1.5"
                                  >
                                    {verb}
                                    {copiedVerb === verb ? (
                                      <Check size={9} className="text-emerald-400" />
                                    ) : (
                                      <Copy size={9} className="text-zinc-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                              {copiedVerb && (
                                <p className="text-[9px] text-emerald-400 font-semibold text-right">Copied "{copiedVerb}"!</p>
                              )}
                            </div>
                          </div>
                        )}

                        {guideTab === 'format' && (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-zinc-300">Format &amp; Layout Compliance</p>
                              <p className="text-[10px] text-zinc-500 leading-relaxed">
                                Keep styling safe to avoid layout parsing collisions or OCR data omissions.
                              </p>
                            </div>

                            <div className="space-y-3">
                              {/* DOS LIST */}
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <CheckCircle2 size={10} className="text-emerald-400" />
                                  Dos (ATS Safe)
                                </span>
                                <ul className="space-y-1 pl-1">
                                  {FORMATTING_RULES.dos.map((item, idx) => (
                                    <li key={idx} className="text-[9px] text-zinc-400 leading-relaxed list-none pl-3 relative">
                                      <span className="absolute left-0 text-emerald-500/50">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* DON'TS LIST */}
                              <div className="space-y-1.5 pt-2 border-t border-zinc-850">
                                <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <XCircle size={10} className="text-red-400" />
                                  Don'ts (Parser Risk)
                                </span>
                                <ul className="space-y-1 pl-1">
                                  {FORMATTING_RULES.donts.map((item, idx) => (
                                    <li key={idx} className="text-[9px] text-zinc-400 leading-relaxed list-none pl-3 relative">
                                      <span className="absolute left-0 text-red-500/50">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: KEYWORD MATCHING ─── */}
                {activeTab === 'keywords' && (
                  <div className="space-y-5">
                    {/* Empty JD State */}
                    {!jobDescription ? (
                      <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-4 my-8">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                          <Target size={22} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">Compare with Job Description</h4>
                          <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
                            Paste a job listing to compare skill keywords automatically. Unlocks the Skills Matrix, matched vocabulary checks, and semantic relevance scores.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowJdInput(true)}
                          className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Plus size={14} />
                          Paste Target Job Description
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Skills breakdown header info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                              <Target size={18} className="text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-[9px] font-medium text-zinc-500 uppercase">Semantic Overlap</p>
                              <h4 className="text-lg font-semibold text-white mt-0.5">{report?.semanticScore || 0}% Match</h4>
                              <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">Vocabulary relevance compared to the job description tokens.</p>
                            </div>
                          </div>

                          <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center shrink-0">
                              <TrendingUp size={18} className="text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-[9px] font-medium text-zinc-500 uppercase">Target Industry</p>
                              <h4 className="text-lg font-semibold text-white mt-0.5 capitalize">{resumeDomain.replace(/_/g, ' ')}</h4>
                              <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">Automatic profile detection for standard tech roles.</p>
                            </div>
                          </div>
                        </div>

                        {/* Keyword list categories */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-semibold text-zinc-400">Indexed Skills & Keywords Matrix</h4>
                          <div className="space-y-3">
                            {skillsMatrix.map((item) => {
                              const matchPercent = item.required > 0 ? Math.round((item.matched.length / (item.matched.length + item.missing.length || 1)) * 100) : 100

                              return (
                                <div
                                  key={item.subject}
                                  className="bg-zinc-900/20 border border-zinc-800/30 rounded-xl p-4 space-y-3"
                                >
                                  {/* Item Header */}
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                      <h5 className="text-xs font-semibold text-white">{item.subject}</h5>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">
                                        Matched {item.matched.length} of {item.matched.length + item.missing.length} keywords.
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                                      <div className="w-24 sm:w-28 h-1.5 bg-zinc-950 rounded-full overflow-hidden shrink-0">
                                        <div
                                          className={`h-full rounded-full ${matchPercent >= 80 ? 'bg-emerald-500' : matchPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                          style={{ width: `${matchPercent}%` }}
                                        />
                                      </div>
                                      <span className={`text-[10px] font-semibold tabular-nums ${matchPercent >= 80 ? 'text-emerald-400' : matchPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {matchPercent}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Keywords lists */}
                                  <div className="space-y-2.5 pt-2.5 border-t border-zinc-800/30">
                                    {/* Matched Keywords */}
                                    {item.matched.length > 0 && (
                                      <div className="space-y-1.5">
                                        <p className="text-[9px] font-medium text-emerald-500/70 uppercase flex items-center gap-1.5">
                                          <Check size={9} />
                                          Matched ({item.matched.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {item.matched.map((kw, kwIdx) => {
                                            const spec = weightKeyword(kw)
                                            const specColor = spec === 'high' 
                                              ? 'bg-indigo-500/15 text-indigo-300' 
                                              : spec === 'medium'
                                              ? 'bg-blue-500/15 text-blue-300'
                                              : 'bg-zinc-800 text-zinc-400'
                                            return (
                                              <span
                                                key={kwIdx}
                                                className="text-[9px] font-medium bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"
                                              >
                                                {kw}
                                                <span className={`px-1 rounded text-[7px] font-semibold uppercase ${specColor}`}>
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
                                        <p className="text-[9px] font-medium text-zinc-500 uppercase flex items-center gap-1.5">
                                          <Plus size={9} />
                                          Missing ({item.missing.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {item.missing.map((kw, kwIdx) => (
                                            <span
                                              key={kwIdx}
                                              className="text-[9px] font-medium bg-zinc-900 border border-dashed border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full"
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
