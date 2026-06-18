import { useState, useEffect } from 'react'
import type { AtsScore, ResumeData } from '../types/resume'
import { autoFix } from '../utils/atsEvaluator'
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Target,
  Brain,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '../hooks/useToast'

interface AtsDashboardProps {
  atsScore: AtsScore & { language?: 'en' | 'fr' }
  resumeData: ResumeData
  onFix: (fixed: ResumeData) => void
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void
}

// Module-level globals to keep the worker and state persistent across component unmounts/tab-switches
let globalWorker: Worker | null = null
let globalSemanticScore: number | null = null
let globalAiStatus: 'idle' | 'loading' | 'computing' | 'ready' | 'error' = 'idle'
let globalDownloadProgress = 0
let globalLoadingFile = ''
let globalHasRunAnalysis = false
let globalIsAnalyzing = false
let globalAnalysisStep = ''

export default function AtsDashboard({ 
  atsScore, 
  resumeData, 
  onFix,
  jobDescription,
  onUpdateJobDescription
}: AtsDashboardProps) {
  const { total, grade, sections, passing, failing, language = 'en' } = atsScore
  const { showToast } = useToast()

  const [score, setScore] = useState(0)

  // AI Matching States initialized from module globals
  const [semanticScore, setSemanticScore] = useState<number | null>(globalSemanticScore)
  const [aiStatus, setAiStatus] = useState<typeof globalAiStatus>(globalAiStatus)
  const [downloadProgress, setDownloadProgress] = useState(globalDownloadProgress)
  const [loadingFile, setLoadingFile] = useState(globalLoadingFile)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isJdDirty, setIsJdDirty] = useState(false)

  // ATS Auditor Scan States
  const [hasRunAnalysis, setHasRunAnalysis] = useState(globalHasRunAnalysis)
  const [isAnalyzing, setIsAnalyzing] = useState(globalIsAnalyzing)
  const [analysisStep, setAnalysisStep] = useState(globalAnalysisStep)

  // Animated score counter for traditional ATS Score
  useEffect(() => {
    let start = score
    const end = total
    if (start === end) return

    const duration = 800
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress * (2 - progress)
      const current = Math.round(start + (end - start) * easeProgress)
      
      setScore(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [total])

  // Track if job description changed since the last AI calculation
  useEffect(() => {
    if (semanticScore !== null) {
      setIsJdDirty(true)
    }
  }, [jobDescription])

  // Initialize and bind worker
  useEffect(() => {
    if (!globalWorker) {
      // Vite handles this URL syntax to bundle Web Workers
      globalWorker = new Worker(
        new URL('../utils/atsWorker.ts', import.meta.url),
        { type: 'module' }
      )
    }

    const handleWorkerMessage = (event: MessageEvent) => {
      const { type, status, progress, file, score: resScore, error } = event.data

      if (type === 'status') {
        globalAiStatus = status
        setAiStatus(status)
      } else if (type === 'progress') {
        globalDownloadProgress = Math.round(progress)
        setDownloadProgress(Math.round(progress))
        if (file) {
          const fileName = file.split('/').pop() || ''
          globalLoadingFile = fileName
          setLoadingFile(fileName)
        }
      } else if (type === 'result') {
        globalSemanticScore = resScore
        setSemanticScore(resScore)
        globalAiStatus = 'ready'
        setAiStatus('ready')
        setIsJdDirty(false)
      } else if (type === 'error') {
        setAiError(error)
        globalAiStatus = 'error'
        setAiStatus('error')
      }
    }

    globalWorker.onmessage = handleWorkerMessage

    return () => {
      if (globalWorker) {
        globalWorker.onmessage = null
      }
    }
  }, [])

  const handleAutoFix = () => {
    const fixedResume = autoFix(resumeData)
    onFix(fixedResume)
    showToast(language === 'fr' ? 'Auto-correction appliquée avec succès' : 'Auto-Fix applied successfully', 'success')
  }

  // Compile full resume text for semantic analyzer
  const getResumeText = () => {
    let text = ''
    if (resumeData.contact) {
      text += ` ${resumeData.contact.fullName} ${resumeData.contact.email} ${resumeData.contact.phone} ${resumeData.contact.linkedin} ${resumeData.contact.location}`
    }
    text += ` ${resumeData.summary}`
    resumeData.experience.forEach((exp) => {
      text += ` ${exp.jobTitle} ${exp.company} ${exp.location} ${exp.bullets.join(' ')}`
    })
    resumeData.education.forEach((edu) => {
      text += ` ${edu.degree} ${edu.school} ${edu.location}`
    })
    text += ` ${resumeData.skills.join(' ')}`
    if (resumeData.projects) {
      resumeData.projects.forEach((proj) => {
        text += ` ${proj.name} ${proj.description} ${proj.technologies.join(' ')}`
      })
    }
    return text
  }

  // Trigger semantic analysis
  const runAiDeepScan = () => {
    if (!globalWorker) return
    if (!jobDescription || !jobDescription.trim()) {
      showToast(
        language === 'fr' 
          ? 'Veuillez saisir une description de poste cible d\'abord.' 
          : 'Please enter a target job description first.', 
        'error'
      )
      return
    }

    setAiError(null)
    const resumeText = getResumeText()
    globalWorker.postMessage({
      type: 'compare',
      resumeText,
      jobDescription
    })
  }

  const startAtsScan = () => {
    globalIsAnalyzing = true
    setIsAnalyzing(true)
    globalAnalysisStep = language === 'fr' ? 'Analyse de la structure des sections...' : 'Analyzing resume sections & completeness...'
    setAnalysisStep(globalAnalysisStep)
    
    const steps = [
      { time: 600, text: language === 'fr' ? 'Recherche de caractères spéciaux et formatage...' : 'Scanning for ATS-breaking symbols & formatting...' },
      { time: 1200, text: language === 'fr' ? 'Évaluation des verbes d\'action...' : 'Evaluating strong action verbs...' },
      { time: 1800, text: language === 'fr' ? 'Calcul de la pertinence des mots-clés...' : 'Matching keyword density against job description...' },
    ]

    steps.forEach((step) => {
      setTimeout(() => {
        globalAnalysisStep = step.text
        setAnalysisStep(step.text)
      }, step.time)
    })

    setTimeout(() => {
      globalIsAnalyzing = false
      setIsAnalyzing(false)
      globalHasRunAnalysis = true
      setHasRunAnalysis(true)
      showToast(language === 'fr' ? 'Audit ATS terminé !' : 'ATS Audit complete!', 'success')
    }, 2450)
  }

  // Reset the audit result when the resume data or job description changes, requiring a re-scan
  useEffect(() => {
    globalHasRunAnalysis = false
    setHasRunAnalysis(false)
  }, [resumeData, jobDescription])

  // Dual-language localizations
  const content = {
    en: {
      gradeLabel: total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Needs Work' : 'Poor',
      statusReady: 'ATS Ready',
      statusNeedsWork: 'Needs Work',
      statusCritical: 'Critical',
      advicePass: 'Your resume passes most ATS filters. Focus on keyword matching.',
      adviceFail: 'Fix the action items below to improve your chances of passing ATS screening.',
      autoFixBtn: 'Auto-Fix Issues',
      scoreBreakdown: 'Score Breakdown',
      actionItems: 'Action Items',
      noIssues: 'No issues found 🎉',
      checksPassed: 'Checks Passed',
      targetJd: 'Target Job Description',
      jdPoints: '+25 pts for keyword match',
      jdPlaceholder: 'Paste the job description here to unlock keyword matching score...',
      
      // AI Panel Localizations
      aiTitle: 'AI Semantic Fit Analyzer',
      aiPrivateTag: '100% Local & Private',
      aiDescIdle: 'Run a local WebAssembly neural network to compare your resume\'s concepts and experience structure with the target job. (Downloads ~47MB model once).',
      aiBtnRun: 'Run AI Deep Scan',
      aiBtnRerun: 'Recalculate Semantic Match',
      aiStatusDownloading: 'Downloading Local Neural Network...',
      aiStatusComputing: 'Extracting semantic vector embeddings...',
      aiStatusFile: 'Downloading:',
      aiResultTitle: 'Semantic Relevance',
      aiDirtyAlert: 'Job description changed. Recalculate to update AI score.',
      
      aiTierHigh: 'Excellent Match — Your resume concepts map very well to the target role.',
      aiTierMedium: 'Moderate Match — The alignment is good, but adding more detailed contexts could help.',
      aiTierLow: 'Low Match — Try rewriting sections to focus on target role competencies.',

      // Categories
      sectionCompleteness: 'Section Completeness',
      keywordMatch: 'Keyword Match',
      formattingSafety: 'Formatting Safety',
      actionVerbs: 'Action Verbs Usage',
      quantifiedResults: 'Quantified Impact',
      contactInfo: 'Contact Info Completeness',
      dateConsistency: 'Date Formatting Consistency',
      lengthAppropriateness: 'Word Count & Page Length',
    },
    fr: {
      gradeLabel: total >= 80 ? 'Excellent' : total >= 60 ? 'Bon' : total >= 40 ? 'À améliorer' : 'Insuffisant',
      statusReady: 'Prêt pour ATS',
      statusNeedsWork: 'À améliorer',
      statusCritical: 'Critique',
      advicePass: 'Votre CV passe la plupart des filtres ATS. Concentrez-vous sur les mots-clés.',
      adviceFail: 'Corrigez les éléments ci-dessous pour améliorer vos chances d\'être sélectionné.',
      autoFixBtn: 'Auto-corriger les problèmes',
      scoreBreakdown: 'Détails du score',
      actionItems: 'Actions recommandées',
      noIssues: 'Aucun problème trouvé 🎉',
      checksPassed: 'Vérifications validées',
      targetJd: 'Description du poste cible',
      jdPoints: '+25 pts pour les mots-clés',
      jdPlaceholder: 'Collez la description du poste ici pour débloquer le score de mots-clés...',
      
      // AI Panel Localizations
      aiTitle: 'Analyseur de pertinence sémantique IA',
      aiPrivateTag: '100% Local & Privé',
      aiDescIdle: 'Lancez un réseau de neurones WebAssembly local pour comparer les concepts de votre CV et de l\'offre. (Télécharge un modèle de ~47 Mo la première fois).',
      aiBtnRun: 'Lancer l\'analyse IA',
      aiBtnRerun: 'Recalculer l\'adéquation IA',
      aiStatusDownloading: 'Téléchargement du modèle IA local...',
      aiStatusComputing: 'Extraction des vecteurs sémantiques...',
      aiStatusFile: 'Téléchargement :',
      aiResultTitle: 'Pertinence Sémantique',
      aiDirtyAlert: 'La description a changé. Recalculez pour mettre à jour le score IA.',
      
      aiTierHigh: 'Excellente adéquation — Les concepts de votre CV correspondent parfaitement au poste ciblé.',
      aiTierMedium: 'Adéquation modérée — L\'alignement est bon, mais détailler certains projets pourrait aider.',
      aiTierLow: 'Faible adéquation — Essayez de réécrire certaines sections pour cibler les compétences demandées.',

      // Categories
      sectionCompleteness: 'Sections complètes',
      keywordMatch: 'Mots-clés trouvés',
      formattingSafety: 'Sécurité du formatage',
      actionVerbs: 'Verbes d\'action utilisés',
      quantifiedResults: 'Impact chiffré',
      contactInfo: 'Coordonnées fournies',
      dateConsistency: 'Cohérence des dates',
      lengthAppropriateness: 'Longueur & Mots',
    }
  }[language]

  const gradeBadgeStyle = total >= 80 
    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
    : total >= 60 
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
      : 'bg-red-500/10 text-red-400 border border-red-500/20'

  const categories = [
    { key: 'sectionCompleteness', label: content.sectionCompleteness, score: sections.sectionCompleteness, max: 20 },
    { key: 'keywordMatch', label: content.keywordMatch, score: sections.keywordMatch, max: 25 },
    { key: 'formattingSafety', label: content.formattingSafety, score: sections.formattingSafety, max: 20 },
    { key: 'actionVerbs', label: content.actionVerbs, score: sections.actionVerbs, max: 10 },
    { key: 'quantifiedResults', label: content.quantifiedResults, score: sections.quantifiedResults, max: 10 },
    { key: 'contactInfo', label: content.contactInfo, score: sections.contactInfo, max: 5 },
    { key: 'dateConsistency', label: content.dateConsistency, score: sections.dateConsistency, max: 5 },
    { key: 'lengthAppropriateness', label: content.lengthAppropriateness, score: sections.lengthAppropriateness, max: 5 },
  ]

  // Helper to extract keywords for visual representation
  const getExtractedKeywords = () => {
    if (!jobDescription || !jobDescription.trim()) return []
    const stopwordsList = language === 'fr' 
      ? new Set(['le', 'la', 'les', 'un', 'une', 'des', 'est', 'sont', 'a', 'de', 'en', 'pour', 'sur', 'avec', 'dans', 'par', 'du', 'au', 'aux', 'et', 'ou', 'mais', 'si'])
      : new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'and', 'or', 'but', 'if'])
    
    const resumeText = getResumeText().toLowerCase()

    const jdWords = jobDescription
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u00FF-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
    
    const uniqueKeywords = Array.from(new Set(jdWords.filter(w => !stopwordsList.has(w)))).slice(0, 15)
    
    return uniqueKeywords.map(word => ({
      word,
      matched: resumeText.includes(word)
    }))
  }

  const extractedKeywords = getExtractedKeywords()

  // Calculate semantic tier formatting
  const getSemanticTier = (val: number) => {
    if (val >= 80) return { label: 'Excellent', style: 'text-emerald-400', barBg: 'bg-emerald-500', desc: content.aiTierHigh }
    if (val >= 60) return { label: 'Good', style: 'text-amber-400', barBg: 'bg-amber-500', desc: content.aiTierMedium }
    return { label: 'Low', style: 'text-rose-400', barBg: 'bg-rose-500', desc: content.aiTierLow }
  }

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-zinc-950/20 font-sans select-none">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scanner {
            0% { transform: translateX(-150%); }
            50% { transform: translateX(150%); }
            100% { transform: translateX(-150%); }
          }
          .scanner-bar {
            animation: scanner 2s infinite ease-in-out;
          }
        ` }} />
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-rose-500/5 blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 flex items-center justify-center mx-auto text-rose-500 border border-zinc-850 relative">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-400" />
            <div className="absolute inset-0 rounded-2xl border border-rose-500/10 animate-ping" />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Auditing Resume...</h3>
            <div className="min-h-[36px] flex items-center justify-center px-4">
              <p className="text-[12px] text-zinc-400 font-medium animate-pulse leading-normal">
                {analysisStep}
              </p>
            </div>
          </div>

          {/* Simulated scanning animation line */}
          <div className="h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850 p-0.5 max-w-[200px] mx-auto relative">
            <div className="h-full rounded-full bg-rose-500 scanner-bar w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasRunAnalysis) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-zinc-950/20 font-sans select-none">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/10 transition-all duration-300 pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-455">
            <CheckCircle2 className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Smart ATS Auditor</h2>
            <p className="text-[12px] text-zinc-400 leading-relaxed font-light">
              Run a comprehensive 8-point audit on your resume. We will scan layout formatting safety, action verb density, date consistency, and match keywords against your target job.
            </p>
          </div>

          <button
            type="button"
            onClick={startAtsScan}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white text-[13px] font-bold py-3 px-4 rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-98 cursor-pointer"
          >
            Start ATS Audit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">

      {/* Header with score hero */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

        {/* Circular score */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r="40"
              fill="none" stroke="#27272a" 
              strokeWidth="8" />
            <circle cx="50" cy="50" r="40"
              fill="none"
              stroke={total >= 80 ? '#10b981' : 
                      total >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score * 2.51} 251`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white tabular-nums">{score}</span>
            <span className="text-[10px] text-zinc-500">/100</span>
          </div>
        </div>

        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-1">
            <span className="text-xl font-bold text-white">
              {grade} — {content.gradeLabel}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${gradeBadgeStyle}`}>
              {total >= 80 ? content.statusReady : 
               total >= 60 ? content.statusNeedsWork : content.statusCritical}
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 uppercase">
              {language}
            </span>
          </div>
          <p className="text-[13px] text-zinc-400 max-w-sm leading-relaxed mx-auto sm:mx-0">
            {total >= 80 ? content.advicePass : content.adviceFail}
          </p>
        </div>

        {/* Auto-fix button — TOP RIGHT */}
        <button
          onClick={handleAutoFix}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-95 flex-shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {content.autoFixBtn}
        </button>
      </div>

      {/* Local AI Deep Scan Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group shadow-xl">
        {/* Background glow decoration */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-violet-600/10 blur-3xl pointer-events-none group-hover:bg-violet-600/15 transition-all duration-300" />
        
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
              {content.aiTitle}
              <span className="text-[9px] font-semibold uppercase text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/15">
                {content.aiPrivateTag}
              </span>
            </h3>
          </div>
        </div>

        {/* Idle Mode */}
        {aiStatus === 'idle' && semanticScore === null && (
          <div className="space-y-4">
            <p className="text-[12px] text-zinc-400 leading-relaxed max-w-xl">
              {content.aiDescIdle}
            </p>
            <button
              onClick={runAiDeepScan}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-medium px-4 py-2 rounded-xl transition-all duration-150 active:scale-95 shadow-md shadow-violet-600/25"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {content.aiBtnRun}
            </button>
          </div>
        )}

        {/* Loading / Downloading model progress */}
        {aiStatus === 'loading' && (
          <div className="space-y-3 py-1">
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-zinc-300 font-medium flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin text-violet-400" />
                {content.aiStatusDownloading}
              </span>
              <span className="text-violet-400 font-mono font-bold">{downloadProgress}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            {loadingFile && (
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                {content.aiStatusFile} {loadingFile}
              </p>
            )}
          </div>
        )}

        {/* Computing Similarity Embedding */}
        {aiStatus === 'computing' && (
          <div className="space-y-3 py-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
              <p className="text-[12px] text-zinc-300 font-medium">
                {content.aiStatusComputing}
              </p>
            </div>
            {/* Pulsing bars to indicate computing activity */}
            <div className="flex gap-1 justify-center sm:justify-start pt-1.5 pl-0.5">
              <div className="w-1.5 h-3 bg-violet-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-4 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-3 bg-violet-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Calculation Completed / Ready */}
        {(aiStatus === 'ready' || aiStatus === 'idle') && semanticScore !== null && (
          <div className="space-y-4">
            
            {/* Score block */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              
              {/* Score Display */}
              <div className="sm:col-span-4 flex items-center gap-3">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-mono tracking-tight">
                  {semanticScore}%
                </span>
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {content.aiResultTitle}
                  </h4>
                  <span className={`text-[12px] font-semibold ${getSemanticTier(semanticScore).style}`}>
                    {getSemanticTier(semanticScore).label}
                  </span>
                </div>
              </div>

              {/* Explanatory text */}
              <div className="sm:col-span-8">
                <p className="text-[12px] text-zinc-400 leading-relaxed">
                  {getSemanticTier(semanticScore).desc}
                </p>
              </div>
            </div>

            {/* Gauge visual meter */}
            <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className={`h-full rounded-full ${getSemanticTier(semanticScore).barBg} transition-all duration-700 ease-out`}
                style={{ width: `${semanticScore}%` }}
              />
            </div>

            {/* Bottom buttons & alerts */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-800/40">
              {isJdDirty ? (
                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[10px] font-medium leading-none">{content.aiDirtyAlert}</span>
                </div>
              ) : <div />}
              
              <button
                onClick={runAiDeepScan}
                className="flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95 bg-zinc-950/40"
              >
                <RefreshCw className="w-3 h-3" />
                {content.aiBtnRerun}
              </button>
            </div>

          </div>
        )}

        {/* Error State */}
        {aiStatus === 'error' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <XCircle className="w-4 h-4" />
              <p className="text-[12px] font-semibold">AI Scan Failed</p>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              {aiError}
            </p>
            <button
              onClick={runAiDeepScan}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        )}

      </div>

      {/* 8 category score bars */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h3 className="text-[13px] font-semibold text-white mb-4">{content.scoreBreakdown}</h3>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[12px] text-zinc-400">{cat.label}</span>
                <span className="text-[12px] font-mono text-white">
                  {cat.score}/{cat.max}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(cat.score/cat.max)*100}%`,
                    backgroundColor: 
                      cat.score === cat.max ? '#10b981' :
                      cat.score >= cat.max * 0.6 ? '#f59e0b' :
                      '#ef4444'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items and Passes — 2 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Failing — left */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-[13px] font-semibold text-white">
              {content.actionItems} ({failing.length})
            </h3>
          </div>
          <div className="space-y-2">
            {failing.map(item => (
              <div key={item.issue} className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <p className="text-[12px] font-medium text-red-300">{item.issue}</p>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{item.fix}</p>
              </div>
            ))}
            {failing.length === 0 && (
              <p className="text-[12px] text-zinc-500 text-center py-4">
                {content.noIssues}
              </p>
            )}
          </div>
        </div>

        {/* Passing — right */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-white">
              {content.checksPassed} ({passing.length})
            </h3>
          </div>
          <div className="space-y-2">
            {passing.map(item => (
              <div key={item} className="flex items-center gap-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <p className="text-[12px] text-emerald-300 font-medium">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Description Tailor Box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-blue-400" />
          <h3 className="text-[13px] font-semibold text-white">{content.targetJd}</h3>
          <span className="ml-auto text-[11px] text-zinc-500">{content.jdPoints}</span>
        </div>
        <textarea
          value={jobDescription}
          onChange={e => onUpdateJobDescription(e.target.value)}
          placeholder={content.jdPlaceholder}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 resize-none h-28 transition-all duration-150"
        />
        {jobDescription && (
          <div className="mt-3 flex flex-wrap gap-2">
            {extractedKeywords.map(kw => (
              <span key={kw.word}
                className={`text-[11px] px-2 py-1 rounded-full font-medium ${
                  kw.matched 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {kw.matched ? '✓' : '+'} {kw.word}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
