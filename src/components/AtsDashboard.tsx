import { useState, useEffect } from 'react'
import type { AtsScore, ResumeData } from '../types/resume'
import { autoFix, calculateLocalSemanticScore } from '../utils/atsEvaluator'
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Target,
  Brain,
  RefreshCw,
  AlertTriangle,
  PenLine
} from 'lucide-react'
import { useToast } from '../hooks/useToast'

interface AtsDashboardProps {
  atsScore: AtsScore & { language?: 'en' | 'fr' }
  resumeData: ResumeData
  onFix: (fixed: ResumeData) => void
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void
  onOpenSection?: (section: any) => void
  apiKey?: string
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
let globalAiAssessment: string | null = null
let globalAiActionPoints: string[] = []

export default function AtsDashboard({ 
  atsScore, 
  resumeData, 
  onFix,
  jobDescription,
  onUpdateJobDescription,
  onOpenSection,
  apiKey
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
  const [aiAssessment, setAiAssessment] = useState<string | null>(globalAiAssessment)
  const [aiActionPoints, setAiActionPoints] = useState<string[]>(globalAiActionPoints)

  // ATS Auditor Scan States
  const [hasRunAnalysis, setHasRunAnalysis] = useState(globalHasRunAnalysis)
  const [isAnalyzing, setIsAnalyzing] = useState(globalIsAnalyzing)
  const [analysisStep, setAnalysisStep] = useState(globalAnalysisStep)
  const [scanProgress, setScanProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

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
        
        // Generate a high-quality local description for the worker result
        let desc = ''
        let pts: string[] = []
        if (resScore >= 80) {
          desc = language === 'fr' 
            ? 'Excellent alignement. Les concepts et l\'expérience de votre CV répondent parfaitement aux attentes du poste.'
            : 'Excellent semantic fit. Your resume concepts and experience map very well to the target job.'
          pts = language === 'fr'
            ? ['Votre expérience correspond très bien.', 'Pensez à insérer plus de réalisations quantifiées.']
            : ['Your experience aligns beautifully.', 'Make sure to add more quantified achievements.']
        } else if (resScore >= 60) {
          desc = language === 'fr'
            ? 'Adéquation modérée. L\'alignement sémantique est bon, mais des améliorations sont possibles.'
            : 'Moderate semantic fit. The alignment is good, but some key sections could be improved.'
          pts = language === 'fr'
            ? ['Détaillez vos compétences clés du poste.', 'Utilisez des verbes d\'action au début de vos descriptions.']
            : ['Detail your primary competencies for the job.', 'Use strong action verbs to start your bullet points.']
        } else {
          desc = language === 'fr'
            ? 'Faible adéquation. Vos compétences actuelles et les mots-clés sémantiques divergent de l\'offre.'
            : 'Low semantic fit. Try tailoring your experience description to focus on target role competencies.'
          pts = language === 'fr'
            ? ['Ajoutez les mots-clés clés demandés.', 'Décrivez vos responsabilités passées avec plus de détails.']
            : ['Add key requested competencies.', 'Flesh out past roles with more descriptive details.']
        }
        
        globalAiAssessment = desc
        globalAiActionPoints = pts
        setAiAssessment(desc)
        setAiActionPoints(pts)

        globalAiStatus = 'ready'
        setAiStatus('ready')
        setIsJdDirty(false)
      } else if (type === 'error') {
        // Fall back to local similarity scorer if the worker fails
        console.warn('Worker error: ' + error + '. Falling back to main-thread scorer.')
        const resumeText = getResumeText()
        runMainThreadFallbackScan(resumeText, jobDescription)
      }
    }

    globalWorker.onmessage = handleWorkerMessage

    return () => {
      if (globalWorker) {
        globalWorker.onmessage = null
      }
    }
  }, [jobDescription, language])

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

  // Fallback local semantic scan in main thread
  const runMainThreadFallbackScan = (resumeText: string, jobDescription: string) => {
    setAiStatus('computing')
    globalAiStatus = 'computing'

    setTimeout(() => {
      try {
        const scoreVal = calculateLocalSemanticScore(resumeText, jobDescription, language === 'fr' ? 'fr' : 'en')
        globalSemanticScore = scoreVal
        setSemanticScore(scoreVal)
        
        let desc = ''
        let pts: string[] = []
        if (scoreVal >= 80) {
          desc = language === 'fr' 
            ? 'Excellent alignement. Votre CV correspond très bien aux compétences cibles.'
            : 'Excellent match. Your resume concepts map very well to the target role.'
          pts = language === 'fr'
            ? ['Conservez ce ciblage précis.', 'Pensez à ajouter plus de métriques.']
            : ['Maintain this precise targeting.', 'Consider adding more quantified metrics.']
        } else if (scoreVal >= 60) {
          desc = language === 'fr'
            ? 'Adéquation modérée. L\'alignement est bon, mais des améliorations sont possibles.'
            : 'Moderate match. The alignment is good, but some key sections could be improved.'
          pts = language === 'fr'
            ? ['Ajoutez plus de détails sur vos projets techniques.', 'Utilisez des verbes d\'action plus forts.']
            : ['Add more details to your technical project descriptions.', 'Incorporate stronger action verbs.']
        } else {
          desc = language === 'fr'
            ? 'Faible adéquation. Essayez de reformuler vos expériences pour cibler ce poste.'
            : 'Low match. Try rewriting your experience bullet points to focus on target role competencies.'
          pts = language === 'fr'
            ? ['Ajoutez les mots-clés manquants de l\'offre.', 'Détaillez vos responsabilités clés.']
            : ['Add missing keywords directly from the job description.', 'Flesh out details of your primary responsibilities.']
        }
        
        globalAiAssessment = desc
        globalAiActionPoints = pts
        setAiAssessment(desc)
        setAiActionPoints(pts)
        
        globalAiStatus = 'ready'
        setAiStatus('ready')
        setIsJdDirty(false)
      } catch (err: any) {
        globalAiStatus = 'error'
        setAiStatus('error')
        setAiError(err.message || 'Local similarity calculation failed')
      }
    }, 800)
  }

  // Call Gemini Semantic Scan API
  const callGeminiSemanticScan = async (resumeText: string, jobDescription: string, key: string) => {
    setAiStatus('computing')
    globalAiStatus = 'computing'
    
    try {
      const promptText = `
Analyze the semantic relevance and alignment between this resume and this job description.
Assess how well the candidate's skills, experience, and accomplishments match the job requirements, competencies, and responsibilities.

Provide:
1. A semantic relevance score as an integer from 0 to 100.
2. A brief, professional assessment paragraph (1-2 sentences) detailing the overall alignment.
3. 2-3 specific action points for the candidate to improve their semantic match.

Resume text:
${resumeText}

Target Job Description:
${jobDescription}

Respond STRICTLY in JSON format with the following keys:
{
  "score": 85,
  "assessment": "...",
  "actionPoints": ["...", "..."]
}
Do not return any markdown code block formatting or backticks around the JSON string. Just return the raw JSON object.
`
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: promptText }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 800,
              temperature: 0.2,
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error('Gemini API call failed with status ' + response.status)
      }

      const data = await response.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const cleanJsonStr = rawText.replace(/```json|```/g, '').trim()
      const result = JSON.parse(cleanJsonStr)
      
      if (typeof result.score === 'number') {
        globalSemanticScore = result.score
        setSemanticScore(result.score)
        
        globalAiAssessment = result.assessment
        globalAiActionPoints = result.actionPoints
        setAiAssessment(result.assessment)
        setAiActionPoints(result.actionPoints)
        
        globalAiStatus = 'ready'
        setAiStatus('ready')
        setIsJdDirty(false)
        showToast(language === 'fr' ? 'Analyse sémantique IA terminée !' : 'AI Semantic Scan complete!', 'success')
      } else {
        throw new Error('Invalid JSON format returned from Gemini')
      }
    } catch (e: any) {
      console.error('Gemini Semantic Scan failed:', e)
      showToast(language === 'fr' ? 'Scan IA en échec. Utilisation du scanner local...' : 'Gemini AI scan failed. Falling back to local scanner...', 'warning')
      
      // Fallback: try to run model or fall back to main thread calculation
      if (globalWorker) {
        globalWorker.postMessage({
          type: 'compare',
          resumeText,
          jobDescription
        })
      } else {
        runMainThreadFallbackScan(resumeText, jobDescription)
      }
    }
  }

  // Trigger semantic analysis
  const runAiDeepScan = () => {
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

    if (apiKey && apiKey.trim() !== '') {
      callGeminiSemanticScan(resumeText, jobDescription, apiKey)
    } else {
      // If no API key, check if worker is ready, otherwise run worker or main-thread fallback
      if (globalWorker) {
        setAiStatus('loading')
        globalAiStatus = 'loading'
        setDownloadProgress(0)
        
        // Timeout fallback after 12s in case CDN downloads are too slow or blocked
        setTimeout(() => {
          if (globalAiStatus === 'loading' || globalAiStatus === 'computing') {
            console.warn('Web worker loading timed out. Switching to local JS scan.')
            runMainThreadFallbackScan(resumeText, jobDescription)
          }
        }, 12000)

        globalWorker.postMessage({
          type: 'compare',
          resumeText,
          jobDescription
        })
      } else {
        runMainThreadFallbackScan(resumeText, jobDescription)
      }
    }
  }

  const startAtsScan = () => {
    globalIsAnalyzing = true
    setIsAnalyzing(true)
    setScanProgress(0)
    setCompletedSteps([])
    
    const duration = 2450 // 2.45s
    const startTime = performance.now()
    
    const updateProgress = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentPercent = Math.round(progress * 100)
      
      setScanProgress(currentPercent)
      
      const steps: string[] = []
      if (currentPercent >= 25) steps.push('structure')
      if (currentPercent >= 50) steps.push('formatting')
      if (currentPercent >= 75) steps.push('verbs')
      if (currentPercent >= 100) steps.push('keywords')
      setCompletedSteps(steps)
      
      if (currentPercent < 25) {
        globalAnalysisStep = language === 'fr' ? 'Analyse de la structure des sections...' : 'Analyzing resume structure & completeness...'
      } else if (currentPercent < 50) {
        globalAnalysisStep = language === 'fr' ? 'Recherche de caractères spéciaux...' : 'Scanning layouts for special characters...'
      } else if (currentPercent < 75) {
        globalAnalysisStep = language === 'fr' ? 'Évaluation des verbes d\'action...' : 'Evaluating strong action verbs...'
      } else {
        globalAnalysisStep = language === 'fr' ? 'Corrélation des mots-clés...' : 'Correlating keywords against job description...'
      }
      setAnalysisStep(globalAnalysisStep)
      
      if (progress < 1) {
        requestAnimationFrame(updateProgress)
      } else {
        globalIsAnalyzing = false
        setIsAnalyzing(false)
        globalHasRunAnalysis = true
        setHasRunAnalysis(true)
        showToast(language === 'fr' ? 'Audit ATS terminé !' : 'ATS Audit complete!', 'success')
      }
    }
    
    requestAnimationFrame(updateProgress)
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
      <div className="h-full flex items-center justify-center p-6 bg-zinc-950/20 font-sans select-none animate-fade-in">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes laser {
            0% { top: 0%; opacity: 0.8; }
            50% { top: 100%; opacity: 0.8; }
            100% { top: 0%; opacity: 0.8; }
          }
          .laser-line {
            animation: laser 2s infinite linear;
          }
        ` }} />
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Top/Bottom subtle glows */}
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

          {/* Large circular percentage & scanning doc mockup */}
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden shadow-inner">
            {/* Holographic doc outline */}
            <div className="w-16 h-20 border border-zinc-800 bg-zinc-900/50 rounded p-2 flex flex-col justify-between relative">
              {/* Laser beam line */}
              <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] laser-line" />
              
              <div className="w-full h-1 bg-zinc-700 rounded" />
              <div className="space-y-1">
                <div className="w-4/5 h-0.5 bg-zinc-800 rounded" />
                <div className="w-full h-0.5 bg-zinc-800 rounded" />
                <div className="w-2/3 h-0.5 bg-zinc-800 rounded" />
              </div>
              <div className="space-y-1">
                <div className="w-full h-0.5 bg-zinc-800 rounded" />
                <div className="w-3/4 h-0.5 bg-zinc-800 rounded" />
              </div>
            </div>

            {/* Glowing progress overlay */}
            <div className="absolute bottom-2 right-2 bg-rose-600/90 text-white text-[11px] font-black font-mono px-2 py-0.5 rounded shadow-lg shadow-rose-600/30">
              {scanProgress}%
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Smart ATS Analysis Engine</h3>
            <p className="text-[11px] text-zinc-400 font-medium min-h-[16px] leading-relaxed">
              {analysisStep}
            </p>
          </div>

          {/* Detailed step checklist */}
          <div className="space-y-2 text-left pt-2 border-t border-zinc-800/40">
            {/* Step 1: Structure */}
            <div className="flex items-center justify-between text-[11px] py-1">
              <span className="text-zinc-400 font-medium">1. Section Completeness</span>
              {completedSteps.includes('structure') ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> PASS
                </span>
              ) : (
                <span className="text-zinc-600 font-medium animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-zinc-600 shrink-0" /> Running
                </span>
              )}
            </div>

            {/* Step 2: Formatting */}
            <div className="flex items-center justify-between text-[11px] py-1">
              <span className="text-zinc-400 font-medium">2. Formatting & Characters</span>
              {completedSteps.includes('formatting') ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> PASS
                </span>
              ) : (
                <span className="text-zinc-650 font-medium flex items-center gap-1">
                  {scanProgress >= 25 ? (
                    <span className="text-zinc-400 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-rose-500 shrink-0" /> Running
                    </span>
                  ) : (
                    'Pending'
                  )}
                </span>
              )}
            </div>

            {/* Step 3: Verbs */}
            <div className="flex items-center justify-between text-[11px] py-1">
              <span className="text-zinc-400 font-medium">3. Action Verb Analytics</span>
              {completedSteps.includes('verbs') ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> PASS
                </span>
              ) : (
                <span className="text-zinc-650 font-medium flex items-center gap-1">
                  {scanProgress >= 50 ? (
                    <span className="text-zinc-400 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-rose-500 shrink-0" /> Running
                    </span>
                  ) : (
                    'Pending'
                  )}
                </span>
              )}
            </div>

            {/* Step 4: Keywords */}
            <div className="flex items-center justify-between text-[11px] py-1">
              <span className="text-zinc-400 font-medium">4. Keyword Correlation</span>
              {completedSteps.includes('keywords') ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> PASS
                </span>
              ) : (
                <span className="text-zinc-655 font-medium flex items-center gap-1">
                  {scanProgress >= 75 ? (
                    <span className="text-zinc-400 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-rose-500 shrink-0" /> Running
                    </span>
                  ) : (
                    'Pending'
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-805 p-0.5 relative">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-rose-650 to-rose-400 transition-all duration-75 ease-out" 
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (!hasRunAnalysis) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-zinc-950/20 font-sans select-none animate-fade-in">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/10 transition-all duration-300 pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-455">
            <CheckCircle2 className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Smart ATS Auditor</h2>
            <p className="text-[12px] text-zinc-400 leading-relaxed font-light font-sans">
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
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-fade-in">

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
          <p className="text-[13px] text-zinc-400 max-w-sm leading-relaxed mx-auto sm:mx-0 font-sans">
            {total >= 80 ? content.advicePass : content.adviceFail}
          </p>
        </div>

        {/* Auto-fix button — TOP RIGHT */}
        <button
          onClick={handleAutoFix}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-95 flex-shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {content.autoFixBtn}
        </button>
      </div>

      {/* Local AI Deep Scan Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group shadow-xl">
        {/* Background glow decoration */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-violet-650/10 blur-3xl pointer-events-none group-hover:bg-violet-650/15 transition-all duration-300" />
        
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
            <p className="text-[12px] text-zinc-400 leading-relaxed max-w-xl font-sans">
              {content.aiDescIdle}
            </p>
            <button
              onClick={runAiDeepScan}
              className="flex items-center gap-2 bg-violet-650 hover:bg-violet-500 text-white text-[12px] font-medium px-4 py-2 rounded-xl transition-all duration-150 active:scale-95 shadow-md shadow-violet-600/25 cursor-pointer"
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
              <div className="w-1.5 h-4 bg-violet-505 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-3 bg-violet-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Calculation Completed / Ready */}
        {(aiStatus === 'ready' || aiStatus === 'idle') && semanticScore !== null && (
          <div className="space-y-4">
            
            {/* Score block */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              
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

              {/* Explanatory text & recommendations */}
              <div className="sm:col-span-8 space-y-3">
                <p className="text-[12px] text-zinc-400 leading-relaxed font-sans">
                  {aiAssessment || getSemanticTier(semanticScore).desc}
                </p>
                {aiActionPoints && aiActionPoints.length > 0 && (
                  <div className="space-y-1.5 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/50 font-sans">
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Key Recommendations:</p>
                    <ul className="list-disc pl-4 text-[11px] text-zinc-550 space-y-1">
                      {aiActionPoints.map((pt, i) => (
                        <li key={i} className="leading-normal">{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Gauge visual meter */}
            <div className="h-1.5 bg-zinc-955 rounded-full overflow-hidden border border-zinc-800">
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
                className="flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white text-[11px] font-medium px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95 bg-zinc-950/40 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                {content.aiBtnRerun}
              </button>
            </div>

          </div>
        )}

        {/* Error State */}
        {aiStatus === 'error' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-rose-455">
              <XCircle className="w-4 h-4 text-rose-400" />
              <p className="text-[12px] font-semibold">AI Scan Failed</p>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              {aiError}
            </p>
            <button
              onClick={runAiDeepScan}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

      </div>

      {/* 8 category score bars */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-[13px] font-semibold text-white mb-4">{content.scoreBreakdown}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {categories.map(cat => (
            <div key={cat.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[12px] text-zinc-400 font-sans">{cat.label}</span>
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Failing — left */}
        <div className="md:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-[13px] font-semibold text-white">
              {content.actionItems} ({failing.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {failing.map((item, index) => {
              // Map section to a human-readable category badge
              let category = 'General'
              if (item.section === 'contact') category = 'Contact Info'
              else if (item.section === 'skills') category = 'Skills & Stack'
              else if (item.section === 'summary') category = 'Profile Summary'
              else if (item.section === 'experience') category = 'Work Experience'
              else if (item.section === 'education') category = 'Education History'
              else if (item.section === 'languages') category = 'Languages'
              else if (item.section === 'projects') category = 'Projects'
              else if (item.section === 'awards') category = 'Awards'
              else if (item.section === 'certifications') category = 'Certifications'
              else if (item.section === 'volunteer') category = 'Volunteer'

              return (
                <div key={index} className="bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/10 select-none">
                        {category}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-white leading-snug">{item.issue}</p>
                    <p className="text-[11.5px] text-zinc-450 leading-relaxed font-sans font-light mt-1.5">{item.fix}</p>
                  </div>
                  
                  {item.section && onOpenSection && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onOpenSection(item.section)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/10 cursor-pointer"
                      >
                        <PenLine className="w-3 h-3" />
                        Fix in Editor
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {failing.length === 0 && (
              <div className="text-center py-12 text-zinc-550 space-y-2 font-sans">
                <p className="text-2xl">🎉</p>
                <p className="text-[12px] font-medium text-zinc-400">{content.noIssues}</p>
              </div>
            )}
          </div>
        </div>

        {/* Passing — right */}
        <div className="md:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-white">
              {content.checksPassed} ({passing.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {passing.map(item => (
              <div key={item} className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2.5 transition-colors duration-150">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-emerald-300 font-medium leading-snug font-sans">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Description Tailor Box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-blue-450 text-blue-400" />
          <h3 className="text-[13px] font-semibold text-white">{content.targetJd}</h3>
          <span className="ml-auto text-[11px] text-zinc-500">{content.jdPoints}</span>
        </div>
        <textarea
          value={jobDescription}
          onChange={e => onUpdateJobDescription(e.target.value)}
          placeholder={content.jdPlaceholder}
          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-[13px] text-zinc-300 placeholder:text-zinc-650 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 resize-none h-28 transition-all duration-150 font-sans"
        />
        {jobDescription && (
          <div className="mt-3 flex flex-wrap gap-2">
            {extractedKeywords.map(kw => (
              <span key={kw.word}
                className={`text-[11px] px-2 py-1 rounded-full font-medium font-sans select-none transition-all ${
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
