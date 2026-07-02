import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, CheckCircle2, Target, Sparkles, FileCode, XCircle } from 'lucide-react'
import type { ResumeData } from '../types/resume'
import { evaluateResume, calculateSkillsMatrix } from '../utils/atsEvaluator'
import { getResumeHash, SCAN_STAGES } from './ats/AtsCheckerUtils'
import { useAi } from '../hooks/useAi'
import { aiComplete } from '../services/aiService'
import { cleanAndParseJson } from '../utils/jsonParser'

import AtsScoreHeader from './ats/AtsScoreHeader'
import AtsCategorySection from './ats/AtsCategorySection'
import AtsSkillsMatrix from './ats/AtsSkillsMatrix'
import AtsGuidePanel from './ats/AtsGuidePanel'

interface AtsCheckerProps {
  resumeData: ResumeData
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void
  onNavigateToSection: (section: string) => void
  templateFontSize?: number
}

const LAST_AUDITED_RESUME_KEY = 'seve-last-audited-resume'
const LAST_AUDITED_JD_KEY = 'seve-last-audited-jd'

export default function AtsChecker({ resumeData, jobDescription, onUpdateJobDescription, onNavigateToSection, templateFontSize }: AtsCheckerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'keywords'>('overview')
  const [showJdInput, setShowJdInput] = useState(false)
  const [jdDraft, setJdDraft] = useState(jobDescription)
  
  const { isConfigured, config } = useAi()

  const [aiAuditResult, setAiAuditResult] = useState<any>(() => {
    try {
      const hash = getResumeHash(resumeData)
      const cached = localStorage.getItem(`seve-ai-audit-${hash}`)
      return cached ? JSON.parse(cached) : null
    } catch { return null }
  })
  const [aiAuditHash, setAiAuditHash] = useState<string>(() => {
    try {
      const hash = getResumeHash(resumeData)
      const cached = localStorage.getItem(`seve-ai-audit-hash-${hash}`)
      return cached || ''
    } catch { return '' }
  })
  const [isScanning, setIsScanning] = useState(() => {
    try {
      const rHash = localStorage.getItem(LAST_AUDITED_RESUME_KEY)
      const j = localStorage.getItem(LAST_AUDITED_JD_KEY)
      if (rHash !== null && j !== null) {
        const currentHash = getResumeHash(resumeData)
        if (rHash === currentHash && j === jobDescription) return false
      }
    } catch { /* ignore */ }
    return true
  })
  const [lastAudited, setLastAudited] = useState(new Date())
  const [scanStage, setScanStage] = useState(0)
  const [scanPercent, setScanPercent] = useState(0)
  const [resumeScanVersion, setResumeScanVersion] = useState(1)
  const [scanLogs, setScanLogs] = useState<string[]>([])

  const draftTouchedRef = useRef(false)
  const dataRef = useRef<{ rHash: string; j: string } | null>(null)
  const hasInitializedRef = useRef(false)
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scanTimeouts = useRef<ReturnType<typeof setTimeout>[]>([])
  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const scanVersionRef = useRef(0)

  useEffect(() => { hasInitializedRef.current = true }, [])

  if (dataRef.current === null) {
    try {
      const rHash = localStorage.getItem(LAST_AUDITED_RESUME_KEY)
      const j = localStorage.getItem(LAST_AUDITED_JD_KEY)
      if (rHash !== null && j !== null) dataRef.current = { rHash, j }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!draftTouchedRef.current) setJdDraft(jobDescription)
  }, [jobDescription])

  const hashResume = useCallback((data: ResumeData): string => getResumeHash(data), [])

  const currentHash = useMemo(() => hashResume(resumeData), [resumeData, hashResume])

  const activeAiAudit = useMemo(() => {
    if (aiAuditResult && aiAuditHash === currentHash) {
      return aiAuditResult
    }
    return null
  }, [aiAuditResult, aiAuditHash, currentHash])

  const atsScore = useMemo(() => {
    return evaluateResume(resumeData, jobDescription, templateFontSize, activeAiAudit)
  }, [resumeData, jobDescription, templateFontSize, activeAiAudit])

  const runAiAudit = useCallback(async () => {
    if (!isConfigured || !config) return
    try {
      const systemPrompt = "You are an expert ATS auditor, layout parser checker, and senior recruiter. Analyze the resume and job description. Return ONLY a JSON object and nothing else."
      
      const promptText = `Analyze the following resume JSON and the target Job Description (if provided).
Resume JSON:
"""
${JSON.stringify(resumeData, null, 2)}
"""

Target Job Description:
"""
${jobDescription || 'N/A'}
"""

Perform a comprehensive recruiter screening and ATS parsing audit. You MUST return a single JSON object matching this schema. Do NOT wrap in markdown fences or add any explanation text.
{
  "spellingScore": 100, // starts at 100, deduct 8 points per spelling/grammar mistake (min 0)
  "parserScore": 100, // starts at 100, deduct 10-15 points for any layout, date format inconsistency, column reading issues, or contact section misalignment
  "roleFitScore": 100, // (only if JD provided) starts at 100, deduct 15-20 points for gaps in career scope, seniority fit, or strategic vs tactical alignment
  "skillsDepthScore": 100, // (only if JD provided) starts at 100, deduct 15 points for key skills listed in skills list but not proven in experience bullets (keyword stuffing)
  
  "spellingIssues": [
    {
      "issue": "Spelling mistake: 'Enginer' instead of 'Engineer'",
      "fix": "Change 'Enginer' to 'Engineer'",
      "section": "experience" // summary, experience, skills, education, contact, projects
    }
  ],
  "parserIssues": [
    {
      "issue": "Inconsistent date format",
      "fix": "Ensure all dates use MM/YYYY format to prevent parsing errors.",
      "section": "experience"
    }
  ],
  "roleFitIssues": [
    // only if JD provided and mismatch exists
    {
      "issue": "Tactical execution vs Strategic PM role",
      "fix": "The target role requires strategic roadmap ownership, but experience bullets focus heavily on task coordination. Rewrite bullet points to include conversion, user discovery, and product lifecycle strategy.",
      "section": "summary"
    }
  ],
  "unprovenSkills": [
    // only if JD provided and mismatch exists
    {
      "skill": "AWS",
      "fix": "Add a bullet point under Stripe or Datadog showing how you deployed or optimized AWS cloud infrastructure.",
      "section": "skills"
    }
  ],
  "bulletRewrites": [
    // Identify 2-3 weak bullets that lack quantifiable impact (metrics, scale, or results) or action verbs, and suggest rewrites
    {
      "original": "Worked on payment features and helped with deployment",
      "rewritten": "Co-developed API payment integrations that processed $10M/day, reducing checkout failures by 14%",
      "reason": "Missing action verb impact, scope scale, and result metrics.",
      "section": "experience"
    }
  ]
}`

      const response = await aiComplete(promptText, config, { systemPrompt, jsonMode: true, maxTokens: 2000 })
      const parsed = cleanAndParseJson(response)
      
      if (parsed && typeof parsed.spellingScore === 'number' && typeof parsed.parserScore === 'number') {
        const mappedIssues: any[] = []
        
        // 1. spellingIssues -> formatting
        if (Array.isArray(parsed.spellingIssues)) {
          parsed.spellingIssues.forEach((item: any, idx: number) => {
            mappedIssues.push({
              id: `ai-spelling-${idx}`,
              type: 'critical',
              category: 'formatting',
              issue: item.issue,
              fix: item.fix,
              section: item.section || 'experience',
              severityScore: 80,
              autoFixable: false
            })
          })
        }
        
        // 2. parserIssues -> formatting
        if (Array.isArray(parsed.parserIssues)) {
          parsed.parserIssues.forEach((item: any, idx: number) => {
            mappedIssues.push({
              id: `ai-parser-${idx}`,
              type: 'warning',
              category: 'formatting',
              issue: item.issue,
              fix: item.fix,
              section: item.section || 'experience',
              severityScore: 60,
              autoFixable: false
            })
          })
        }
        
        // 3. roleFitIssues -> semantic
        if (Array.isArray(parsed.roleFitIssues)) {
          parsed.roleFitIssues.forEach((item: any, idx: number) => {
            mappedIssues.push({
              id: `ai-rolefit-${idx}`,
              type: 'warning',
              category: 'semantic',
              issue: item.issue,
              fix: item.fix,
              section: item.section || 'summary',
              severityScore: 70,
              autoFixable: false
            })
          })
        }

        // 4. unprovenSkills -> keywords
        if (Array.isArray(parsed.unprovenSkills)) {
          parsed.unprovenSkills.forEach((item: any, idx: number) => {
            mappedIssues.push({
              id: `ai-unproven-${idx}`,
              type: 'warning',
              category: 'keywords',
              issue: `Unproven skill: '${item.skill}' has no context in your work history.`,
              fix: item.fix,
              section: item.section || 'skills',
              severityScore: 50,
              autoFixable: false
            })
          })
        }

        // 5. bulletRewrites -> bulletQuality
        if (Array.isArray(parsed.bulletRewrites)) {
          parsed.bulletRewrites.forEach((item: any, idx: number) => {
            mappedIssues.push({
              id: `ai-bulletrewrite-${idx}`,
              type: 'suggestion',
              category: 'bulletQuality',
              issue: `Weak bullet point: lacks STAR metrics or results.`,
              fix: `Consider this AI rewrite: "${item.rewritten}"`,
              section: item.section || 'experience',
              severityScore: 40,
              autoFixable: false,
              details: [
                `Original Bullet: "${item.original}"`,
                `Suggested Rewrite: "${item.rewritten}"`,
                `Reason: ${item.reason}`
              ]
            })
          })
        }

        const finalResult = {
          spellingScore: parsed.spellingScore,
          parserScore: parsed.parserScore,
          roleFitScore: parsed.roleFitScore ?? 100,
          skillsDepthScore: parsed.skillsDepthScore ?? 100,
          grammarIssuesCount: (parsed.spellingIssues?.length || 0) + (parsed.parserIssues?.length || 0) + (parsed.roleFitIssues?.length || 0) + (parsed.unprovenSkills?.length || 0) + (parsed.bulletRewrites?.length || 0),
          issues: mappedIssues
        }

        setAiAuditResult(finalResult)
        setAiAuditHash(currentHash)
        localStorage.setItem(`seve-ai-audit-${currentHash}`, JSON.stringify(finalResult))
        localStorage.setItem(`seve-ai-audit-hash-${currentHash}`, currentHash)
      } else {
        throw new Error("Invalid response format from AI")
      }
    } catch (e) {
      console.error("AI Audit failed:", e)
      alert("AI Audit failed. Please verify your AI API key and connection.")
    }
  }, [resumeData, config, isConfigured, currentHash, jobDescription])

  const runAiAuditRef = useRef(runAiAudit)
  useEffect(() => {
    runAiAuditRef.current = runAiAudit
  }, [runAiAudit])

  const isConfiguredRef = useRef(isConfigured)
  const configRef = useRef(config)
  const aiAuditResultRef = useRef(aiAuditResult)
  const aiAuditHashRef = useRef(aiAuditHash)

  useEffect(() => { isConfiguredRef.current = isConfigured }, [isConfigured])
  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { aiAuditResultRef.current = aiAuditResult }, [aiAuditResult])
  useEffect(() => { aiAuditHashRef.current = aiAuditHash }, [aiAuditHash])

  useEffect(() => {
    if (dataRef.current !== null) {
      const currentHash = hashResume(resumeData)
      const isSameResume = dataRef.current.rHash === currentHash
      const isSameJd = dataRef.current.j === jobDescription
      if (isSameResume && isSameJd) return
    }

    if (scanTimer.current) clearTimeout(scanTimer.current)
    scanTimer.current = setTimeout(() => {
      const currentVersion = ++scanVersionRef.current
      setIsScanning(true)
      setScanPercent(0)
      setScanStage(0)
      dataRef.current = { rHash: hashResume(resumeData), j: jobDescription }
      setResumeScanVersion(v => v + 1)
      setScanLogs([])
      scanTimeouts.current = []

      // Trigger AI audit immediately at the start of the scan so it completes in the background
      // while the 6-second loader is cooking. This prevents the final score from jumping or
      // decreasing by itself after the loader finishes.
      const hasResult = aiAuditResultRef.current && aiAuditHashRef.current === currentHash
      if (isConfiguredRef.current && configRef.current && !hasResult) {
        runAiAuditRef.current()
      }

      const duration = 6000
      const intervalMs = 30
      let elapsed = 0
      let lastPct = 0

      if (scanInterval.current) clearInterval(scanInterval.current)
      scanInterval.current = setInterval(() => {
        if (scanVersionRef.current !== currentVersion) {
          clearInterval(scanInterval.current!)
          return
        }
        elapsed += intervalMs
        
        if (elapsed >= duration) {
          clearInterval(scanInterval.current!)
          setScanPercent(100)
          setScanStage(3)
          const finalTimer = setTimeout(() => {
            if (scanVersionRef.current !== currentVersion) return
            setIsScanning(false)
            setLastAudited(new Date())
            try {
              localStorage.setItem(LAST_AUDITED_RESUME_KEY, hashResume(resumeData))
              localStorage.setItem(LAST_AUDITED_JD_KEY, jobDescription)
            } catch { /* ignore */ }
          }, 300)
          scanTimeouts.current.push(finalTimer)
          return
        }

        const t = elapsed / duration
        const ease = 1 - Math.pow(1 - t, 3)
        const targetPct = ease * 100
        
        const noise = (Math.random() * 2 - 1) * 0.6
        let nextPct = Math.round(targetPct + noise)
        
        nextPct = Math.max(lastPct, Math.min(99, nextPct))
        lastPct = nextPct
        setScanPercent(nextPct)

        if (nextPct < 20) setScanStage(0)
        else if (nextPct < 50) setScanStage(1)
        else if (nextPct < 85) setScanStage(2)
        else setScanStage(3)

        setScanLogs(() => {
          const expectedLogsCount = Math.floor(nextPct / 25) + 1
          const activeLogs: string[] = []
          for (let i = 0; i < Math.min(expectedLogsCount, SCAN_STAGES.length); i++) {
            activeLogs.push(SCAN_STAGES[i].log)
          }
          return activeLogs.slice(-5)
        })
      }, intervalMs)
    }, 500)

    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current)
      scanTimeouts.current.forEach(clearTimeout)
      if (scanInterval.current) clearInterval(scanInterval.current)
    }
  }, [resumeData, jobDescription, hashResume, currentHash])

  const report = atsScore.reportV2
  const resumeDomain = report?.resumeDomain || 'unknown'
  const jdDomain = report?.jdDomain || 'unknown'

  const criticalIssues = report?.critical || []
  const warningIssues = report?.warnings || []
  const suggestionIssues = report?.suggestions || []
  const totalIssuesCount = criticalIssues.length + warningIssues.length + suggestionIssues.length

  const skillsMatrix = useMemo(() => {
    return report?.skillsMatrix || calculateSkillsMatrix(resumeData, jobDescription)
  }, [resumeData, jobDescription, report])

  const handleSaveJd = useCallback(() => {
    onUpdateJobDescription(jdDraft)
    setShowJdInput(false)
  }, [jdDraft, onUpdateJobDescription])

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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJdInput(true)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5 select-none"
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
                  <motion.div layoutId="activeAtsTab" className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-lg"
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
                        ? criticalIssues.length > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : criticalIssues.length > 0 ? 'bg-red-500/10 text-red-500/70 border border-red-500/10' : 'bg-amber-500/10 text-amber-500/75 border border-amber-500/10'
                    }`}>{totalIssuesCount}</span>
                  )}
                  {isKeywords && jobDescription && (
                    <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-full transition-colors duration-200 ${
                      isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500/10 text-emerald-550/70 border border-emerald-500/10'
                    }`}>Linked</span>
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
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <FileCode size={13} className="text-indigo-400" />
                    Target Job Description
                  </h4>
                  <button onClick={() => { setShowJdInput(false); setJdDraft(jobDescription); draftTouchedRef.current = false }}
                    className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer" aria-label="Close job description input"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mb-2.5">Paste a job description to analyze keyword overlap and weighted ATS scoring.</p>
                <textarea value={jdDraft} onChange={e => { setJdDraft(e.target.value); draftTouchedRef.current = true }}
                  placeholder="Paste a job description here..."
                  className="w-full h-28 bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => { setShowJdInput(false); setJdDraft(jobDescription); draftTouchedRef.current = false }}
                    className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 hover:text-white border border-zinc-800 rounded-lg hover:bg-zinc-800/30 transition-all cursor-pointer"
                  >Cancel</button>
                  <button onClick={handleSaveJd}
                    className="px-3 py-1.5 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer"
                  >Update Target</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div key="scanning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center py-6"
              >
                <div className="w-full max-w-sm">
                  <div className="relative rounded-2xl border border-zinc-800/40 bg-zinc-950/80 p-6 overflow-hidden backdrop-blur-md shadow-2xl">
                    <motion.div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none"
                      animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="flex flex-col items-center gap-4 relative">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                          <circle cx="48" cy="48" r="42" fill="none" stroke="rgb(24 24 27)" strokeWidth="4" />
                          <motion.circle cx="48" cy="48" r="42" fill="none" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            animate={{ strokeDashoffset: `${2 * Math.PI * 42 * (1 - scanPercent / 100)}` }}
                            transition={{ duration: 0.05, ease: 'linear' }}
                            style={{ filter: 'drop-shadow(0 0 6px rgba(45, 212, 191, 0.35))' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.span key={scanPercent}
                            className="text-xl font-bold text-white tabular-nums leading-none"
                            initial={{ y: 2, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.03 }}
                          >
                            {scanPercent}<span className="text-[10px] text-zinc-500">%</span>
                          </motion.span>
                        </div>
                      </div>
                      <div className="text-center h-10 flex flex-col items-center justify-center">
                        <motion.p key={SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].label}
                          className="text-sm font-medium text-white/90"
                          initial={{ y: 4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
                        >{SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length - 1)].label}</motion.p>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                          animate={{ width: `${scanPercent}%` }}
                          transition={{ duration: 0.05, ease: 'linear' }}
                        />
                      </div>
                      <div className="w-full bg-zinc-950 rounded-lg border border-zinc-800/20 p-3 min-h-[72px]" aria-live="polite" aria-atomic="true">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">scan log</span>
                          <span className="text-[7px] text-zinc-600 font-mono ml-auto">{Math.min(scanStage + 1, SCAN_STAGES.length)}/{SCAN_STAGES.length}</span>
                        </div>
                        <div className="space-y-0.5">
                          {scanLogs.map((log, i) => (
                            <motion.div key={`${resumeScanVersion}-${i}`} initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }}
                              className="text-[10px] text-zinc-400 font-mono leading-relaxed"
                            ><span className="text-emerald-500/50">❯</span> {log}</motion.div>
                          ))}
                          <motion.div className="text-[10px] text-zinc-700 font-mono"
                            animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 0.8, repeat: Infinity }}
                          ><span className="text-emerald-500/30">❯</span> _</motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-6">
                {activeTab === 'overview' && (
                  <AtsScoreHeader
                    report={report}
                    totalScore={atsScore.total}
                    resumeDomain={resumeDomain}
                    jdDomain={jdDomain}
                    jobDescription={jobDescription}
                    criticalIssues={criticalIssues}
                    warningIssues={warningIssues}
                    totalIssuesCount={totalIssuesCount}
                    onNavigateToSection={onNavigateToSection}
                    onViewAllIssues={() => setActiveTab('audit')}
                  />
                )}

                {activeTab === 'audit' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 space-y-6">
                      <AtsCategorySection
                        categories={report?.categories || []}
                        criticalIssues={criticalIssues}
                        warningIssues={warningIssues}
                        suggestionIssues={suggestionIssues}
                        onNavigateToSection={onNavigateToSection}
                      />
                    </div>
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
                      <AtsGuidePanel />
                    </div>
                  </div>
                )}

                {activeTab === 'keywords' && (
                  <AtsSkillsMatrix
                    skillsMatrix={skillsMatrix}
                    semanticScore={report?.semanticScore || 0}
                    resumeDomain={resumeDomain}
                    onOpenJdInput={() => setShowJdInput(true)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
