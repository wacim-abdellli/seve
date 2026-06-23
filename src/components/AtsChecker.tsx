import { useState, useMemo, useEffect, useCallback, useRef, useContext } from 'react'
import { useCountUp } from '../hooks/useCountUp'
import { motion, AnimatePresence } from 'framer-motion'
import type { ResumeData } from '../types/resume'
import type { RoleDomain } from '../utils/roleClassifier'
import type { LucideIcon } from 'lucide-react'
import { evaluateResume, calculateSkillsMatrix, weightKeyword, autoFix } from '../utils/atsEvaluator'
import { ToastContext } from '../context/ToastContext'
import { computeDomainPenalty } from '../utils/roleClassifier'
import {
  CheckCircle2, XCircle, FileCode, Activity,
  Target, Sparkles, ArrowRight, Lightbulb, BarChart3,
  AlertTriangle, ShieldAlert, TrendingUp,
  ChevronDown, ChevronUp, ChevronRight, BookOpen,
  Plus, Check, FileText, Briefcase, Copy, Zap, Shield
} from 'lucide-react'
import { ISSUE_EXPLANATIONS, POWER_VERBS, FORMATTING_RULES } from '../utils/atsGuideData'

function getCategoryTheme(id: string) {
  const common = {
    border: 'border-zinc-800',
    borderHover: 'hover:border-zinc-700',
    iconBg: 'bg-zinc-950 border border-zinc-850',
    glow: ''
  }

  if (id.startsWith('completeness') || id.startsWith('depth')) {
    return {
      ...common,
      label: 'Core Structure',
      text: 'text-indigo-400',
      leftAccent: 'border-l-4 border-l-indigo-500',
      bg: 'bg-indigo-500/5',
      icon: CheckCircle2
    }
  }
  if (id.startsWith('semantic') || id.startsWith('domain') || id.startsWith('keywords')) {
    return {
      ...common,
      label: 'Keyword Match',
      text: 'text-emerald-400',
      leftAccent: 'border-l-4 border-l-emerald-500',
      bg: 'bg-emerald-500/5',
      icon: Target
    }
  }
  if (id.startsWith('formatting') || id.startsWith('projects') || id.startsWith('skills-')) {
    return {
      ...common,
      label: 'Parser Formatting',
      text: 'text-cyan-400',
      leftAccent: 'border-l-4 border-l-cyan-500',
      bg: 'bg-cyan-500/5',
      icon: FileText
    }
  }
  if (id.startsWith('verbs')) {
    return {
      ...common,
      label: 'Action Verbs',
      text: 'text-violet-400',
      leftAccent: 'border-l-4 border-l-violet-500',
      bg: 'bg-violet-500/5',
      icon: Zap
    }
  }
  if (id.startsWith('metrics')) {
    return {
      ...common,
      label: 'Metrics & Data',
      text: 'text-pink-400',
      leftAccent: 'border-l-4 border-l-pink-500',
      bg: 'bg-pink-500/5',
      icon: TrendingUp
    }
  }
  if (id.startsWith('contact')) {
    return {
      ...common,
      label: 'Contact Info',
      text: 'text-blue-400',
      leftAccent: 'border-l-4 border-l-blue-500',
      bg: 'bg-blue-500/5',
      icon: Briefcase
    }
  }
  if (id.startsWith('dates')) {
    return {
      ...common,
      label: 'Date Consistency',
      text: 'text-amber-400',
      leftAccent: 'border-l-4 border-l-amber-500',
      bg: 'bg-amber-500/5',
      icon: AlertTriangle
    }
  }
  if (id.startsWith('length') || id.startsWith('page2')) {
    return {
      ...common,
      label: 'Optimal Length',
      text: 'text-orange-400',
      leftAccent: 'border-l-4 border-l-orange-500',
      bg: 'bg-orange-500/5',
      icon: FileCode
    }
  }
  return {
    ...common,
    label: 'General Audit',
    text: 'text-indigo-400',
    leftAccent: 'border-l-4 border-l-indigo-500',
    bg: 'bg-indigo-500/5',
    icon: Shield
  }
}

interface AtsCheckerProps {
  resumeData: ResumeData
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void
  onAutoFix?: (fixed: ResumeData) => void
  onNavigateToSection: (section: string) => void
  templateFontSize?: number
}

function getResumeHash(data: ResumeData): string {
  try {
    const str = JSON.stringify(data)
    let hash = 2166136261
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = (hash * 16777619) >>> 0
    }
    return hash.toString(36)
  } catch {
    return ''
  }
}

/* ─── Score Gauge ─── */
function ScoreGauge({ score, gradeLabel }: { score: number; gradeLabel: string }) {
  const size = 160
  const stroke = 10
  const r = (size - stroke * 2) / 2
  const c = r * 2 * Math.PI
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ef4444'
  
  return (
    <div className="relative inline-flex items-center justify-center shrink-0 select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={stroke} />
      </svg>
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-[44px] font-black text-white tabular-nums tracking-tight leading-none font-display select-none">{score}</span>
        <span className="text-[8px] font-black text-zinc-400 tracking-widest uppercase mt-1.5 font-display select-none">{gradeLabel}</span>
      </div>
    </div>
  )
}

/* ─── Metric Tile ─── */
function MetricTile({ icon: Icon, label, value, description, colorClass = "text-zinc-400" }: { icon: LucideIcon; label: string; value: string | number; description?: string; colorClass?: string }) {
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
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
  completeness: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
  keywords: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
  formatting: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
  actionVerbs: 'bg-gradient-to-r from-violet-600 to-violet-400',
  quantifiedResults: 'bg-gradient-to-r from-pink-600 to-pink-400',
  contactInfo: 'bg-gradient-to-r from-blue-600 to-blue-400',
  dateConsistency: 'bg-gradient-to-r from-amber-600 to-amber-400',
  length: 'bg-gradient-to-r from-orange-600 to-orange-400',
}

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

export default function AtsChecker({ resumeData, jobDescription, onUpdateJobDescription, onAutoFix, onNavigateToSection, templateFontSize }: AtsCheckerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'keywords'>('overview')
  const [showJdInput, setShowJdInput] = useState(false)
  const [jdDraft, setJdDraft] = useState(jobDescription)
  const [isScanning, setIsScanning] = useState(() => {
    try {
      const rHash = localStorage.getItem('seve-last-audited-resume')
      const j = localStorage.getItem('seve-last-audited-jd')
      if (rHash !== null && j !== null) {
        const currentHash = getResumeHash(resumeData)
        if (rHash === currentHash && j === jobDescription) {
          return false
        }
      }
    } catch {
      return true
    }
    return true
  })
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
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(copiedTimerRef.current), [])
  const [verbSearchQuery, setVerbSearchQuery] = useState('')

  const [scanStage, setScanStage] = useState(0)
  const [resumeScanVersion, setResumeScanVersion] = useState(1)
  const [scanLogs, setScanLogs] = useState<string[]>([])

  const toast = useContext(ToastContext)

  const handleAutoFix = useCallback(() => {
    if (!onAutoFix) return
    const fixed = autoFix(resumeData)
    onAutoFix(fixed)
    toast?.showToast('Applied one-click ATS fixes to your resume!', 'success')
  }, [resumeData, onAutoFix, toast])

  const draftTouchedRef = useRef(false)

  useEffect(() => {
    if (!draftTouchedRef.current) {
      setJdDraft(jobDescription)
    }
  }, [jobDescription])

  // FNV-1a hash for fast resume comparison (avoids JSON.stringify on every render)
  const hashResume = useCallback((data: ResumeData): string => {
    return getResumeHash(data)
  }, [])

  // Local storage keys
  const LAST_AUDITED_RESUME_KEY = 'seve-last-audited-resume'
  const LAST_AUDITED_JD_KEY = 'seve-last-audited-jd'

  // Initialize dataRef with persistent last audited hash (not full resume)
  const dataRef = useRef<{ rHash: string; j: string } | null>(null)

  // Synchronously initialize ref during first render to prevent any timing gaps
  if (dataRef.current === null) {
    try {
      const rHash = localStorage.getItem(LAST_AUDITED_RESUME_KEY)
      const j = localStorage.getItem(LAST_AUDITED_JD_KEY)
      if (rHash !== null && j !== null) {
        dataRef.current = { rHash, j }
      }
    } catch { /* ignore */ }
  }

  const hasInitializedRef = useRef(false)

  useEffect(() => {
    hasInitializedRef.current = true
  }, [])

  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scanTimeouts = useRef<ReturnType<typeof setTimeout>[]>([])
  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const scanVersionRef = useRef(0)

  const atsScore = useMemo(() => evaluateResume(resumeData, jobDescription, templateFontSize), [resumeData, jobDescription, templateFontSize])

  useEffect(() => {
    // Only skip scan if we have a saved audited state and the content matches via hash
    if (dataRef.current !== null) {
      const currentHash = hashResume(resumeData)
      const isSameResume = dataRef.current.rHash === currentHash
      const isSameJd = dataRef.current.j === jobDescription
      if (isSameResume && isSameJd) {
        return
      }
    }

    // Debounce: wait 500ms of no edits before scanning
    if (scanTimer.current) clearTimeout(scanTimer.current)
    scanTimer.current = setTimeout(() => {
      const currentVersion = ++scanVersionRef.current
      setIsScanning(true)
      dataRef.current = { rHash: hashResume(resumeData), j: jobDescription }

      setResumeScanVersion(v => v + 1)
      setScanLogs([])

      scanTimeouts.current = []

      // Initial scan gets a quick 450ms animation; subsequent edits skip delays
      const isEditReScan = hasInitializedRef.current
      if (!isEditReScan) {
        let d = 0
        const delays = [180, 150, 120]
        delays.forEach((ms, i) => {
          d += ms
          const t = setTimeout(() => {
            if (scanVersionRef.current !== currentVersion) return
            setScanStage(i + 1)
            if (i === delays.length - 1) {
              const finalTimer = setTimeout(() => {
                if (scanVersionRef.current !== currentVersion) return
                setIsScanning(false)
                setLastAudited(new Date())
                try {
                  localStorage.setItem(LAST_AUDITED_RESUME_KEY, hashResume(resumeData))
                  localStorage.setItem(LAST_AUDITED_JD_KEY, jobDescription)
                } catch { /* ignore */ }
              }, 80)
              scanTimeouts.current.push(finalTimer)
            }
          }, d)
          scanTimeouts.current.push(t)
        })
      } else {
        setScanStage(3)
        const finalTimer = setTimeout(() => {
          if (scanVersionRef.current !== currentVersion) return
          setIsScanning(false)
          setLastAudited(new Date())
          try {
            localStorage.setItem(LAST_AUDITED_RESUME_KEY, hashResume(resumeData))
            localStorage.setItem(LAST_AUDITED_JD_KEY, jobDescription)
          } catch { /* ignore */ }
        }, 80)
        scanTimeouts.current.push(finalTimer)
      }

      if (scanInterval.current) clearInterval(scanInterval.current)
      if (!isEditReScan) {
        scanInterval.current = setInterval(() => {
          if (scanVersionRef.current !== currentVersion) {
            clearInterval(scanInterval.current!)
            return
          }
          setScanLogs(prev => {
            const idx = prev.length
            if (idx >= SCAN_STAGES.length) return prev
            return [...prev, SCAN_STAGES[idx].log].slice(-5)
          })
        }, 120)
      }
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

  const toggleExpandIssue = useCallback((id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

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
    <div className="flex-1 flex flex-col h-full overflow-hidden no-print bg-zinc-950 font-sans relative">
      {/* ═══ Header ═══ */}
      <header className="flex items-center justify-between border-b border-zinc-900 px-6 py-4 bg-zinc-950 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Sparkles size={14} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">ATS Audit Center</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[7px] font-extrabold text-emerald-400 uppercase tracking-widest">Live</span>
              </span>
            </div>
            <p className="text-[9.5px] text-zinc-500 font-medium">Last audited: {lastAudited.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>

                    {/* ─── One-Click Auto-Fix ─── */}
                    {onAutoFix && report?.critical.some(i => i.id !== 'domain-mismatch') && (
                      <div className="bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <Zap size={16} className="text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">One-click ATS auto-fix</h3>
                              <p className="text-[11px] text-zinc-400 mt-0.5">Auto-clean formatting, pronouns, and weak verbs</p>
                            </div>
                          </div>
                          <button
                            onClick={handleAutoFix}
                            className="shrink-0 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl transition-all active:scale-[0.97] cursor-pointer"
                          >
                            Auto-Fix Resume
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJdInput(true)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850 hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5 select-none"
          >
            <FileCode size={12} className="text-zinc-500" />
            {jobDescription ? 'Update JD' : 'Configure JD'}
          </button>
        </div>
      </header>

      {/* ═══ Navigation Tabs ═══ */}
      <div className="px-6 py-3.5 border-b border-zinc-900 bg-zinc-950 shrink-0 z-10">
        <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl" role="tablist" aria-label="ATS report sections">
          {(['overview', 'audit', 'keywords'] as const).map((tab) => {
            const isActive = activeTab === tab
            const isAudit = tab === 'audit'
            const isKeywords = tab === 'keywords'
            const labelText = isAudit ? 'checklist' : tab
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                aria-controls={`ats-panel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className="relative px-4 py-2 text-xs font-bold rounded-lg transition-colors duration-200 cursor-pointer flex items-center gap-2 select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAtsTab"
                    className="absolute inset-0 bg-zinc-950 border border-zinc-850 rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-350'}`}>
                  {tab === 'overview' && <BarChart3 size={13} />}
                  {isAudit && <CheckCircle2 size={13} />}
                  {isKeywords && <Target size={13} />}
                  
                  <span className="capitalize">{labelText}</span>
                  
                  {isAudit && !isScanning && totalIssuesCount > 0 && (
                    <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-full transition-colors duration-200 ${
                      isActive 
                        ? criticalIssues.length > 0 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : criticalIssues.length > 0 
                        ? 'bg-red-500/10 text-red-500/70 border border-red-500/10' 
                        : 'bg-amber-500/10 text-amber-500/75 border border-amber-500/10'
                    }`}>
                      {totalIssuesCount}
                    </span>
                  )}
                  
                  {isKeywords && jobDescription && (
                    <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-full transition-colors duration-200 ${
                      isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500/10 text-emerald-550/70 border border-emerald-500/10'
                    }`}>
                      Linked
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ Content Area ═══ */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-[1380px] mx-auto p-6 space-y-6 relative z-10">

          {/* ─── JD Input Accordion ─── */}
          <AnimatePresence>
            {showJdInput && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <FileCode size={13} className="text-indigo-400" />
                    Target Job Description
                  </h4>
                  <button onClick={() => { setShowJdInput(false); setJdDraft(jobDescription); draftTouchedRef.current = false }} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer" aria-label="Close job description input">
                    <XCircle size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mb-2.5">Paste a job description to analyze keyword overlap, semantic fit, and weighted scoring.</p>
                <textarea
                  value={jdDraft}
                  onChange={e => { setJdDraft(e.target.value); draftTouchedRef.current = true }}
                  placeholder="Paste a job description here..."
                  className="w-full h-28 bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => { setShowJdInput(false); setJdDraft(jobDescription); draftTouchedRef.current = false }}
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
                  <div className="relative rounded-2xl border border-zinc-800/40 bg-zinc-950/80 p-6 overflow-hidden backdrop-blur-md shadow-2xl">
                    {/* Scanning line sweep */}
                    <motion.div
                      className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    <div className="flex flex-col items-center gap-4 relative">
 
                       {/* Circular progress */}
                       <div className="relative w-24 h-24">
                         <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                           <circle cx="48" cy="48" r="42" fill="none" stroke="rgb(24 24 27)" strokeWidth="4" />
                          <motion.circle
                            cx="48" cy="48" r="42" fill="none" stroke="#2dd4bf" strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            animate={{ strokeDashoffset: `${2 * Math.PI * 42 * (1 - SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].pct / 100)}` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{ filter: 'drop-shadow(0 0 6px rgba(45, 212, 191, 0.35))' }}
                          />
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
                          className="h-full rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                          animate={{ width: `${SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>

                      {/* Live log — terminal style */}
                      <div className="w-full bg-zinc-950 rounded-lg border border-zinc-800/20 p-3 min-h-[72px]" aria-live="polite" aria-atomic="true">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">scan log</span>
                          <span className="text-[7px] text-zinc-650 font-mono ml-auto">{Math.min(scanStage + 1, SCAN_STAGES.length)}/{SCAN_STAGES.length}</span>
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
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                {/* ─── TAB 1: OVERVIEW ─── */}
                {activeTab === 'overview' && (
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

                    {/* ─── Hero Score Panel ─── */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative group">
                      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative">
                        <ScoreGauge score={animatedScore} gradeLabel={report?.gradeLabel || atsScore.grade} />
                        
                        <div className="flex-1 w-full space-y-5">
                          <div>
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <h3 className="text-base font-bold text-white tracking-wide">ATS Scan Status</h3>
                              <span className={`text-[9.5px] font-black px-2.5 py-0.5 rounded-full border tracking-wider uppercase ${scoreBg} ${scoreColor}`}>
                                {report?.grade || 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                              {atsScore.total >= 80 
                                ? 'Strong score — resume is well-optimized for ATS parsing. Keep tailoring for specific roles.'
                                : 'Needs improvement — focus on formatting and keyword alignment to cross the 80+ threshold.'}
                            </p>
                          </div>

                          {/* Quick stat chips */}
                          <div className="flex flex-wrap gap-2.5">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition-all duration-200 cursor-default select-none">
                              <Activity size={12} className="text-indigo-400" />
                              <span className="text-[10.5px] text-zinc-300 font-bold">{totalWords} words</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition-all duration-200 cursor-default select-none">
                              <FileText size={12} className={parseabilityColor} />
                              <span className="text-[10.5px] text-zinc-300 font-bold">{parseabilityStatus}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition-all duration-200 cursor-default select-none">
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
                                animate={{ left: `${atsScore.total}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-zinc-950 -ml-1.75 shadow-lg z-10"
                              />
                            </div>
                            <div className="flex justify-between text-[8px] text-zinc-555 font-bold mt-1.5 px-0.5 tracking-wider font-mono">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={14} className="text-zinc-555" />
                            Issues at a glance
                          </h3>
                          <button
                            onClick={() => setActiveTab('audit')}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer select-none"
                          >
                            View all ({totalIssuesCount}) <ArrowRight size={11} className="text-indigo-400" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[...criticalIssues, ...warningIssues].slice(0, 3).map((issue) => {
                            const isCritical = criticalIssues.includes(issue)
                            return (
                              <div
                                key={issue.id}
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
 
                    {/* ─── Category Breakdown ─── */}
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
                )}

                {/* ─── TAB 2: AUDIT CHECKLIST ─── */}
                {activeTab === 'audit' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Checklist Issues */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Critical Issues Section */}
                      {criticalIssues.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 select-none">
                            <ShieldAlert size={14} className="text-red-400" />
                            Critical ({criticalIssues.length})
                          </h4>
                          <div className="space-y-3">
                            {criticalIssues.map((issue) => {
                              const isExpanded = !!expandedIssues[issue.id]
                              const help = ISSUE_EXPLANATIONS[issue.id]
                              const hasDetails = !!(issue.details && issue.details.length > 0)
                              const hasHelpOrDetails = !!(help || hasDetails)
                              const theme = getCategoryTheme(issue.id)
                              const Icon = theme.icon || ShieldAlert
                              
                              return (
                                <div
                                  key={issue.id}
                                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors duration-200 border-l-4 border-l-red-500"
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
                                      {issue.section && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onNavigateToSection(issue.section!)
                                          }}
                                          className="text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          Fix <ArrowRight size={10} />
                                        </button>
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
                                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Items needing review:</p>
                                              <ul className="space-y-1.5">
                                                {issue.details?.map((detail, dIdx) => (
                                                  <li key={dIdx} className="text-xs text-zinc-300 border-l-2 border-red-500/40 pl-3 leading-relaxed py-0.5">
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
                            {warningIssues.map((issue) => {
                              const isExpanded = !!expandedIssues[issue.id]
                              const help = ISSUE_EXPLANATIONS[issue.id]
                              const hasDetails = !!(issue.details && issue.details.length > 0)
                              const hasHelpOrDetails = !!(help || hasDetails)
                              const theme = getCategoryTheme(issue.id)
                              const Icon = theme.icon || AlertTriangle
                              
                              return (
                                <div
                                  key={issue.id}
                                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors duration-200 border-l-4 border-l-amber-500"
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
                                      {issue.section && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onNavigateToSection(issue.section!)
                                          }}
                                          className="text-xs font-bold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-600 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          Edit <ArrowRight size={10} />
                                        </button>
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
                                              <p className="text-[10px] font-bold text-zinc-505 uppercase tracking-wider">Items needing review:</p>
                                              <ul className="space-y-1.5">
                                                {issue.details?.map((detail, dIdx) => (
                                                  <li key={dIdx} className="text-xs text-zinc-300 border-l-2 border-zinc-750 pl-3 leading-relaxed py-0.5">
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
                            {suggestionIssues.map((issue) => {
                              const isExpanded = !!expandedIssues[issue.id]
                              const help = ISSUE_EXPLANATIONS[issue.id]
                              const hasDetails = !!(issue.details && issue.details.length > 0)
                              const hasHelpOrDetails = !!(help || hasDetails)
                              const theme = getCategoryTheme(issue.id)
                              const Icon = theme.icon || Lightbulb
                              
                              return (
                                <div
                                  key={issue.id}
                                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors duration-200 border-l-4 border-l-indigo-500"
                                >
                                  <div 
                                    className={`p-4 flex gap-3.5 justify-between items-start ${hasHelpOrDetails ? 'cursor-pointer select-none hover:bg-zinc-900/20' : ''}`}
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
                                      {issue.section && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onNavigateToSection(issue.section!)
                                          }}
                                          className="text-xs font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-650 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          Edit <ArrowRight size={10} />
                                        </button>
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
                                        <div className="p-4 bg-zinc-950/65 border-t border-zinc-800/20 space-y-4">
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
                                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Items to consider:</p>
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
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: ATS Writing & Formatting Guide */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                        
                        <div className="flex items-center gap-2.5 mb-4 relative select-none">
                          <BookOpen size={15} className="text-indigo-400" />
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-wide">ATS Excellence Guide</h4>
                            <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono">Writing standard &amp; format compliance</p>
                          </div>
                        </div>

                        {/* Guide Navigation */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-850 mb-5 shrink-0 relative" role="tablist" aria-label="ATS guide sections">
                          {(['formula', 'verbs', 'format'] as const).map((tab) => {
                            const isActive = guideTab === tab;
                            const Icon = tab === 'formula' ? Sparkles : tab === 'verbs' ? Zap : Shield;
                            const label = tab === 'formula' ? 'Formula' : tab === 'verbs' ? 'Power Verbs' : 'Safety Rules';
                            return (
                              <button
                                key={tab}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`ats-guide-panel-${tab}`}
                                onClick={() => setGuideTab(tab)}
                                className="relative py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none outline-none"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId="activeGuideTab"
                                    className="absolute inset-0 bg-zinc-900 border border-zinc-800/50 rounded-lg shadow-sm"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                  />
                                )}
                                <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-350'}`}>
                                  <Icon size={11} className={isActive ? 'text-indigo-400' : 'text-zinc-500'} />
                                  {label}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tab Contents */}
                        {guideTab === 'formula' && (
                          <div className="space-y-4 relative z-10">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-zinc-200">The X-Y-Z Action Formula</p>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                Google recommends writing bullet points using this structure to prove scale, method, and results.
                              </p>
                            </div>

                            {/* X-Y-Z Formula Visual Card */}
                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl font-mono text-[11.5px] leading-relaxed text-zinc-400 space-y-1.5 text-center shadow-inner relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                              <span className="text-white font-bold block text-[12px]">Accomplished [X]</span>
                              <span className="text-zinc-400 block">as measured by [Y]</span>
                              <span className="text-zinc-450 block">by doing [Z]</span>
                            </div>

                            {/* Interactive XYZ Builder */}
                            <div className="space-y-3.5 pt-3.5 border-t border-zinc-800/40">
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">Interactive Bullet Builder</p>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">What did you accomplish? (X)</label>
                                  <input
                                    type="text"
                                    value={xyzX}
                                    onChange={(e) => setXyzX(e.target.value)}
                                    placeholder="e.g., reduced database query latency"
                                    className="w-full bg-zinc-950/80 border border-zinc-850 hover:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">How was it measured? (Y)</label>
                                  <input
                                    type="text"
                                    value={xyzY}
                                    onChange={(e) => setXyzY(e.target.value)}
                                    placeholder="e.g., by 40% (saving 12 hours of processing time)"
                                    className="w-full bg-zinc-950/80 border border-zinc-855 hover:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">What action/method did you take? (Z)</label>
                                  <input
                                    type="text"
                                    value={xyzZ}
                                    onChange={(e) => setXyzZ(e.target.value)}
                                    placeholder="e.g., implementing query index caching and Redis stores"
                                    className="w-full bg-zinc-950/80 border border-zinc-855 hover:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                                  />
                                </div>
                              </div>

                              {/* Assembled output preview */}
                              {(xyzX || xyzY || xyzZ) && (
                                <div className="space-y-2 pt-2">
                                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative group transition-all duration-300 hover:border-indigo-500/30">
                                    <div className="bg-zinc-900/80 border-b border-zinc-800/60 px-4 py-2 flex items-center justify-between select-none">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                                        <span className="text-[10px] text-zinc-550 font-mono ml-2">bullet_compiler.sh</span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const firstWordCapitalized = (xyzZ.trim().split(/\s+/)[0] || '').replace(/^[a-z]/, (char) => char.toUpperCase())
                                          const zRest = xyzZ.trim().substring(firstWordCapitalized.length)
                                          const zText = `${firstWordCapitalized}${zRest}`
                                          const resultText = `${zText ? zText + ', ' : ''}${xyzX.trim() ? xyzX.trim() : ''}${xyzY.trim() ? ' ' + xyzY.trim() : ''}.`
                                          navigator.clipboard.writeText(resultText).catch(() => {})
                                          setCopiedBullet(true)
                                          clearTimeout(copiedTimerRef.current)
                                          copiedTimerRef.current = setTimeout(() => setCopiedBullet(false), 2000)
                                        }}
                                        className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-450 hover:text-white transition-colors cursor-pointer hover:bg-zinc-900"
                                        title="Copy compiled bullet"
                                      >
                                        {copiedBullet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                      </button>
                                    </div>
                                    <div className="p-4 min-h-[60px] flex items-center">
                                      <p className="text-xs text-zinc-350 font-mono leading-relaxed whitespace-pre-wrap select-text pr-2">
                                        {(() => {
                                          const firstWordCapitalized = (xyzZ.trim().split(/\s+/)[0] || '').replace(/^[a-z]/, (char) => char.toUpperCase())
                                          const zRest = xyzZ.trim().substring(firstWordCapitalized.length)
                                          const zText = `${firstWordCapitalized}${zRest}`
                                          const resultText = `${zText ? zText + ', ' : ''}${xyzX.trim() ? xyzX.trim() : ''}${xyzY.trim() ? ' ' + xyzY.trim() : ''}.`
                                          return resultText || 'Type above to assemble bullet...'
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                  {copiedBullet && (
                                    <p className="text-[10px] text-emerald-400 font-semibold text-right flex items-center justify-end gap-1"><Check size={10}/> Copied to clipboard!</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {guideTab === 'verbs' && (
                          <div className="space-y-4 relative z-10">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-zinc-200">Verb Reference Directory</p>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                Avoid beginning bullets with soft expressions. Click any verb below to copy it instantly.
                              </p>
                            </div>

                            {/* Search Power Verbs */}
                            <div className="relative mb-3">
                              <input
                                type="text"
                                value={verbSearchQuery}
                                onChange={(e) => setVerbSearchQuery(e.target.value)}
                                placeholder="Search 150+ action verbs..."
                                className="w-full bg-zinc-950/80 border border-zinc-850 rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-650">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              {verbSearchQuery && (
                                <button 
                                  onClick={() => setVerbSearchQuery('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-550 hover:text-zinc-300 text-[10px] bg-zinc-900 border border-zinc-855 px-1.5 py-0.5 rounded-md cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            {(() => {
                              if (verbSearchQuery.trim()) {
                                const query = verbSearchQuery.toLowerCase().trim();
                                const allVerbs = POWER_VERBS.reduce((acc, cat) => {
                                  const matches = cat.verbs.filter(v => v.toLowerCase().includes(query));
                                  if (matches.length > 0) {
                                    acc.push({ category: cat.category, verbs: matches });
                                  }
                                  return acc;
                                }, [] as { category: string; verbs: string[] }[]);

                                if (allVerbs.length === 0) {
                                  return (
                                    <div className="py-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-850 rounded-xl select-none">
                                      No matching verbs found for "{verbSearchQuery}"
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1 font-sans">
                                    {allVerbs.map(group => (
                                      <div key={group.category} className="space-y-1.5">
                                        <span className="text-[8px] font-black text-zinc-550 uppercase tracking-widest block font-mono">{group.category}</span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {group.verbs.map(verb => (
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              key={verb}
                                              onClick={() => {
                                                navigator.clipboard.writeText(verb).catch(() => {})
                                                setCopiedVerb(verb)
                                                clearTimeout(copiedTimerRef.current)
                                                copiedTimerRef.current = setTimeout(() => setCopiedVerb(null), 1500)
                                              }}
                                              className="px-2.5 py-1 rounded bg-zinc-950/80 border border-zinc-850 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer font-mono inline-flex items-center gap-1.5 shadow-sm"
                                            >
                                              {verb}
                                              {copiedVerb === verb ? (
                                                <Check size={9} className="text-emerald-400" />
                                              ) : (
                                                <Copy size={9} className="text-zinc-650" />
                                              )}
                                            </motion.button>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-4">
                                  {/* Verb category picker */}
                                  <div className="flex flex-wrap gap-1 border-b border-zinc-850 pb-2.5">
                                    {POWER_VERBS.map((c) => (
                                      <button
                                        key={c.category}
                                        onClick={() => setSelectedVerbCat(c.category)}
                                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${selectedVerbCat === c.category ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'bg-zinc-950 border border-zinc-850 text-zinc-500 hover:text-zinc-300'}`}
                                      >
                                        {c.category}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Verb selection list */}
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                                      {POWER_VERBS.find((c) => c.category === selectedVerbCat)?.verbs.map((verb) => (
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          key={verb}
                                          onClick={() => {
                                            navigator.clipboard.writeText(verb).catch(() => {})
                                            setCopiedVerb(verb)
                                            setTimeout(() => setCopiedVerb(null), 1500)
                                          }}
                                          className="px-2.5 py-1 rounded bg-zinc-950/80 border border-zinc-850 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer font-mono inline-flex items-center gap-1.5 shadow-sm"
                                        >
                                          {verb}
                                          {copiedVerb === verb ? (
                                            <Check size={9} className="text-emerald-400" />
                                          ) : (
                                            <Copy size={9} className="text-zinc-650" />
                                          )}
                                        </motion.button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                            {copiedVerb && (
                              <p className="text-[10px] text-emerald-400 font-semibold text-right flex items-center justify-end gap-1"><Check size={10}/> Copied "{copiedVerb}"!</p>
                            )}
                          </div>
                        )}

                        {guideTab === 'format' && (
                          <div className="space-y-4 relative z-10">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-zinc-200">Format &amp; Layout Compliance</p>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                Keep styling safe to avoid layout parsing collisions or OCR data omissions.
                              </p>
                            </div>

                            <div className="space-y-4">
                              {/* DOS LIST */}
                              <div className="space-y-3">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                                  <CheckCircle2 size={13} className="text-emerald-400" />
                                  Dos (ATS Safe)
                                </span>
                                <div className="space-y-2">
                                  {FORMATTING_RULES.dos.map((item, idx) => (
                                    <div key={idx} className="text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5 p-2.5 bg-emerald-950/10 border border-emerald-500/10 rounded-lg border-l-4 border-l-emerald-500 hover:bg-emerald-950/15 transition-colors duration-200">
                                      <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" strokeWidth={3} />
                                      <span className="select-text">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* DON'TS LIST */}
                              <div className="space-y-3 pt-3 border-t border-zinc-850">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                                  <XCircle size={13} className="text-rose-400" />
                                  Don'ts (Parser Risk)
                                </span>
                                <div className="space-y-2">
                                  {FORMATTING_RULES.donts.map((item, idx) => (
                                    <div key={idx} className="text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5 p-2.5 bg-rose-950/10 border border-rose-500/10 rounded-lg border-l-4 border-l-rose-500 hover:bg-rose-950/15 transition-colors duration-200">
                                      <XCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                                      <span className="select-text">{item}</span>
                                    </div>
                                  ))}
                                </div>
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
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-5 my-8 relative overflow-hidden">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-855 flex items-center justify-center text-zinc-500 shadow-inner">
                          <Target size={26} className="text-zinc-650" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white tracking-wide">Compare with Job Description</h4>
                          <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
                            Paste a job listing to compare skill keywords automatically. Unlocks the Skills Matrix, matched vocabulary checks, and semantic relevance scores.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowJdInput(true)}
                          className="text-xs font-bold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 select-none"
                        >
                          <Plus size={14} />
                          Paste Target Job Description
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Skills breakdown header info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-750 transition-colors duration-200">
                            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <Target size={20} className="text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-zinc-505 uppercase tracking-widest font-mono">Semantic Overlap</p>
                              <h4 className="text-lg font-black text-white mt-0.5">{report?.semanticScore || 0}% Match</h4>
                              <p className="text-[10px] text-zinc-450 leading-normal mt-0.5">Vocabulary relevance compared to the job description tokens.</p>
                            </div>
                          </div>

                          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-750 transition-colors duration-200">
                            <div className="w-11 h-11 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                              <TrendingUp size={20} className="text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">Target Industry</p>
                              <h4 className="text-lg font-black text-white mt-0.5 capitalize">{resumeDomain.replace(/_/g, ' ')}</h4>
                              <p className="text-[10px] text-zinc-405 leading-normal mt-0.5">Automatic profile detection for standard tech roles.</p>
                            </div>
                          </div>
                        </div>

                                  {/* Keyword list categories */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-display">Indexed Skills & Keywords Matrix</h4>
                          <div className="space-y-3">
                            {skillsMatrix.map((item) => {
                              const matchPercent = item.required > 0 ? Math.round((item.matched.length / (item.matched.length + item.missing.length || 1)) * 100) : 100

                              return (
                                <div
                                  key={item.subject}
                                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-750 transition-colors duration-200"
                                >
                                  {/* Item Header */}
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                      <h5 className="text-[13px] font-bold text-zinc-200 tracking-wide">{item.subject}</h5>
                                      <p className="text-[9.5px] text-zinc-500 mt-0.5 font-mono">
                                        Matched {item.matched.length} of {item.matched.length + item.missing.length} keywords.
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                                      <div className="w-24 sm:w-32 h-2 bg-zinc-950 rounded-full overflow-hidden shrink-0 border border-zinc-900">
                                        <div
                                          className={`h-full rounded-full bg-gradient-to-r ${matchPercent >= 80 ? 'from-emerald-600 to-emerald-450' : matchPercent >= 50 ? 'from-amber-600 to-amber-450' : 'from-rose-600 to-rose-450'}`}
                                          style={{ width: `${matchPercent}%` }}
                                        />
                                      </div>
                                      <span className={`text-[10.5px] font-extrabold tabular-nums font-mono ${matchPercent >= 80 ? 'text-emerald-400' : matchPercent >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {matchPercent}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Keywords lists */}
                                  <div className="space-y-4 pt-4 border-t border-zinc-800/30">
                                    {/* Matched Keywords */}
                                    {item.matched.length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-1.5 select-none">
                                          <Check size={10} strokeWidth={3.5} />
                                          Matched ({item.matched.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {item.matched.map((kw, kwIdx) => {
                                            const spec = weightKeyword(kw)
                                            return (
                                              <span
                                                key={kwIdx}
                                                className="text-[10px] font-bold bg-zinc-950 border border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400/90 px-3 py-1 rounded-full inline-flex items-center gap-2 transition-colors duration-200 cursor-default"
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                {kw}
                                                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wide border ${
                                                  spec === 'high' 
                                                    ? 'bg-rose-500/10 border-rose-500/10 text-rose-400' 
                                                    : spec === 'medium'
                                                    ? 'bg-amber-500/10 border-amber-500/10 text-amber-400'
                                                    : 'bg-zinc-800 border-zinc-700 text-zinc-550'
                                                }`}>
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
                                      <div className="space-y-2">
                                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5 select-none">
                                          <Plus size={10} strokeWidth={3.5} className="text-zinc-500" />
                                          Missing ({item.missing.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {item.missing.map((kw, kwIdx) => (
                                            <span
                                              key={kwIdx}
                                              className="text-[10px] font-bold bg-zinc-950/50 border border-dashed border-zinc-800 text-zinc-500 px-3 py-1 rounded-full inline-flex items-center gap-2 transition-colors duration-200 hover:border-rose-500/20 hover:text-rose-400/80 hover:bg-rose-500/5 select-none cursor-help"
                                              title="Incorporate this keyword to improve score density"
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 shrink-0" />
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
