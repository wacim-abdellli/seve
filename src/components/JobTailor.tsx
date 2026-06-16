import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ResumeData } from '../types/resume'
import { useToast } from '../hooks/useToast'
import { generateContent } from '../utils/aiService'
import { Plus, Sparkles, FileText, Activity, Info, CheckCircle2, PlusCircle } from 'lucide-react'

interface JobTailorProps {
  resumeData: ResumeData
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void
  onUpdateResumeData: (updated: ResumeData) => void
  apiKey: string
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'and', 'or', 'but', 'if', 'about', 'by',
  'their', 'them', 'this', 'that', 'these', 'those', 'each', 'every'
])

const COMMON_BIGRAMS = [
  'project management', 'machine learning', 'data analysis', 'content strategy',
  'product design', 'design systems', 'sales pipeline', 'lead generation',
  'digital marketing', 'social media', 'search engine', 'cloud computing',
  'user research', 'agile scrum', 'system design', 'software engineer',
  'frontend developer', 'backend developer', 'full stack'
]

interface KeywordDetail {
  text: string
  frequency: number
}

export default function JobTailor({
  resumeData,
  jobDescription,
  onUpdateJobDescription,
  onUpdateResumeData,
  apiKey,
}: JobTailorProps) {
  const { showToast } = useToast()
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [loadingTailor, setLoadingTailor] = useState(false)
  const [tailorSuggestions, setTailorSuggestions] = useState<{
    summary: { before: string; after: string }
    bullets: { id: string; expIdx: number; bulletIdx: number; before: string; after: string }[]
  } | null>(null)

  // Smarter Keyword & Bi-gram Extraction
  const getKeywordsAnalysis = () => {
    if (!jobDescription.trim()) {
      return { total: 0, matched: [], missing: [], matchScore: 0 }
    }

    const jdLower = jobDescription.toLowerCase()
    let workingJd = jdLower
    const extracted: Record<string, number> = {}

    // 1. Scan and count bi-grams
    COMMON_BIGRAMS.forEach((phrase) => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi')
      const matches = jdLower.match(regex)
      if (matches) {
        extracted[phrase] = matches.length
        workingJd = workingJd.replace(regex, '')
      }
    })

    // 2. Scan remaining words
    const words = workingJd
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w) && isNaN(Number(w)))

    words.forEach((word) => {
      extracted[word] = (extracted[word] || 0) + 1
    })

    // 3. Check resume content (case-insensitive substring matches)
    let resumeText = ` ${resumeData.summary}`
    resumeData.experience.forEach((exp) => {
      resumeText += ` ${exp.jobTitle} ${exp.company} ${exp.bullets.join(' ')}`
    })
    resumeData.skills.forEach((s) => {
      resumeText += ` ${s}`
    })
    const lowerResume = resumeText.toLowerCase()

    const matched: KeywordDetail[] = []
    const missing: KeywordDetail[] = []

    Object.entries(extracted).forEach(([text, frequency]) => {
      const keyword = { text, frequency }
      if (lowerResume.includes(text)) {
        matched.push(keyword)
      } else {
        missing.push(keyword)
      }
    })

    matched.sort((a, b) => b.frequency - a.frequency)
    missing.sort((a, b) => b.frequency - a.frequency)

    // 4. Calculate Job Match Score (0 - 100)
    const totalKeywords = matched.length + missing.length
    const keywordPct = totalKeywords ? (matched.length / totalKeywords) * 70 : 0

    let seniorityMatch: number
    const seniorityKeywords = ['senior', 'lead', 'principal', 'manager', 'director', 'vp', 'head']
    const jdRequiresSeniority = seniorityKeywords.some((s) => jdLower.includes(s))
    const resumeHasSeniority = seniorityKeywords.some((s) => lowerResume.includes(s))

    if (jdRequiresSeniority === resumeHasSeniority) {
      seniorityMatch = 20
    } else if (!jdRequiresSeniority && resumeHasSeniority) {
      seniorityMatch = 20
    } else {
      seniorityMatch = 5
    }

    let completenessMatch = 0
    if (resumeData.skills.length > 0) completenessMatch += 4
    if (resumeData.experience.length > 0) completenessMatch += 4
    if (resumeData.summary) completenessMatch += 2

    const matchScore = Math.min(100, Math.round(keywordPct + seniorityMatch + completenessMatch))

    return {
      total: totalKeywords,
      matched,
      missing,
      matchScore,
    }
  }

  const analysis = getKeywordsAnalysis()

  const handleAnalyze = () => {
    if (!jobDescription.trim()) {
      showToast('Please paste a job description first.', 'warning')
      return
    }
    setIsAnalyzed(true)
  }

  const handleInjectSkill = (skillText: string) => {
    const formatted = skillText
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    if (!resumeData.skills.some((s) => s.toLowerCase() === formatted.toLowerCase())) {
      onUpdateResumeData({
        ...resumeData,
        skills: [...resumeData.skills, formatted],
      })
      showToast(`Added "${formatted}" to your skills checklist.`, 'success')
    }
  }

  const handleTailor = async () => {
    setLoadingTailor(true)
    try {
      const missingString = analysis.missing.slice(0, 5).map((m) => m.text).join(', ')
      
      const summaryPrompt = `Tailor this resume summary to match the job description. Current Summary: "${resumeData.summary}". Integrate these missing keywords naturally: ${missingString}`
      const tailoredSummary = await generateContent(summaryPrompt, apiKey, 'tailor')

      const suggestionsList: { id: string; expIdx: number; bulletIdx: number; before: string; after: string }[] = []
      let count = 0
      
      for (let expIdx = 0; expIdx < resumeData.experience.length; expIdx++) {
        const exp = resumeData.experience[expIdx]
        for (let bulletIdx = 0; bulletIdx < exp.bullets.length; bulletIdx++) {
          const bullet = exp.bullets[bulletIdx]
          if (bullet.trim() && count < 2) {
            const kwToInject = analysis.missing[count]?.text || 'industry practices'
            const bulletPrompt = `Rewrite this resume bullet point to naturally incorporate the keyword: "${kwToInject}". Bullet: "${bullet}"`
            const tailoredBullet = await generateContent(bulletPrompt, apiKey, 'tailor')
            
            suggestionsList.push({
              id: `${exp.id}-${bulletIdx}`,
              expIdx,
              bulletIdx,
              before: bullet,
              after: tailoredBullet,
            })
            count++
          }
        }
      }

      setTailorSuggestions({
        summary: { before: resumeData.summary, after: tailoredSummary },
        bullets: suggestionsList,
      })
      showToast('AI tailoring variants generated successfully!', 'success')
    } catch (e) {
      console.error('Tailoring error:', e)
      showToast('AI optimization failed.', 'error')
    } finally {
      setLoadingTailor(false)
    }
  }

  const applySummary = () => {
    if (!tailorSuggestions) return
    onUpdateResumeData({
      ...resumeData,
      summary: tailorSuggestions.summary.after,
    })
    setTailorSuggestions((prev) => 
      prev ? { ...prev, summary: { ...prev.summary, before: prev.summary.after } } : null
    )
    showToast('Applied optimized summary to resume.', 'success')
  }

  const applyBullet = (expIdx: number, bulletIdx: number, newText: string) => {
    const updatedExp = [...resumeData.experience]
    const updatedBullets = [...updatedExp[expIdx].bullets]
    updatedBullets[bulletIdx] = newText
    updatedExp[expIdx] = { ...updatedExp[expIdx], bullets: updatedBullets }
    
    onUpdateResumeData({
      ...resumeData,
      experience: updatedExp,
    })
    
    if (tailorSuggestions) {
      const updatedSuggestions = tailorSuggestions.bullets.map((b) => {
        if (b.expIdx === expIdx && b.bulletIdx === bulletIdx) {
          return { ...b, before: newText }
        }
        return b
      })
      setTailorSuggestions({ ...tailorSuggestions, bullets: updatedSuggestions })
    }
    showToast('Applied tailored bullet to experience.', 'success')
  }

  // Score styling config
  const getScoreColorClass = () => {
    const score = analysis.matchScore
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
    if (score >= 60) return 'text-red-400 border-red-500/20 bg-red-500/10'
    if (score >= 40) return 'text-amber-400 border-amber-500/20 bg-amber-500/10'
    return 'text-rose-400 border-rose-500/20 bg-rose-500/10'
  }

  return (
    <div className="select-none h-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-0">
        
        {/* Left Column: Input and Flow */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10 border border-border">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                Description Input
              </h3>
            </div>
            
            <div className="relative mb-3">
              <textarea
                value={jobDescription}
                onChange={(e) => onUpdateJobDescription(e.target.value)}
                placeholder="Paste the target job posting details here..."
                className="h-[240px] rounded-xl border border-border bg-zinc-900/60 backdrop-blur-sm p-4 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full resize-none leading-relaxed font-light"
              />
              <div className="absolute bottom-3 right-4 font-mono text-[9px] text-zinc-500">
                {jobDescription.length} chars
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              className="w-full h-10 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all shadow-[0_0_12px_rgba(224, 49, 79,0.05)] flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <Activity className="w-4 h-4" />
              Run ATS Keyword Scan
            </button>
          </div>

          {/* Workflow Instruction Card */}
          <div className="bg-zinc-900 border border-border p-5 rounded-2xl">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-red-400" />
              ATS Parsing Pipeline
            </h4>
            <div className="flex flex-col gap-4">
              {[
                { step: '01', title: 'Context Extraction', desc: 'Isolating nouns, bi-grams, and technical competencies.' },
                { step: '02', title: 'Heuristic Mapping', desc: 'Calculating semantic overlap between JD and Profile.' },
                { step: '03', title: 'Tailoring Logic', desc: 'Generating contextual bullet points using AI variants.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xs font-extrabold text-red-400 shrink-0 opacity-60">{item.step}</span>
                  <div>
                    <div className="text-[11px] font-bold text-zinc-200">{item.title}</div>
                    <p className="text-[10px] text-zinc-500 leading-normal font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Results and Suggestions */}
        <div className="md:col-span-7 flex flex-col min-h-[500px]">
          <AnimatePresence mode="wait">
            {!isAnalyzed || !jobDescription.trim() ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col flex-1 items-center justify-center border border-dashed border-border bg-zinc-900/40 p-6 text-center rounded-2xl min-h-[400px]"
              >
                <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 border border-border">
                    <Sparkles className="w-6 h-6 text-red-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1 animate-pulse">Awaiting Analysis</h3>
                <p className="text-[10.5px] text-muted-foreground leading-normal max-w-[280px] font-light">
                  Paste a job description on the left to activate the intelligence engine and see your match grade.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="analysis-state"
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
                className="flex-1 flex flex-col gap-6"
              >
                {/* Job Match Score Card */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-lg ${getScoreColorClass()}`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 block mb-0.5">
                      Match Alignment
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-black text-white">{analysis.matchScore}</span>
                      <span className="text-[11px] font-bold text-zinc-400">/100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-zinc-950/80 border border-border text-[9px] font-extrabold uppercase tracking-wider text-white rounded-lg mb-1 shadow">
                      {analysis.matchScore >= 80 ? '🔥 High Probability' : analysis.matchScore >= 60 ? '⚡ Strong Match' : '⚠️ Gaps Detected'}
                    </span>
                    <div className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">
                      {analysis.matched.length} OF {analysis.total} KEYWORDS FOUND
                    </div>
                  </div>
                </div>

                {/* Keyword Clouds */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Matched Cloud */}
                  <div className="bg-zinc-900 border border-border p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold uppercase text-emerald-400 tracking-widest mb-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Matched Strengths ({analysis.matched.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.matched.slice(0, 16).map((kw) => (
                        <span
                          key={kw.text}
                          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center"
                        >
                          {kw.text}
                          <span className="font-mono ml-1 opacity-40">x{kw.frequency}</span>
                        </span>
                      ))}
                      {analysis.matched.length === 0 && (
                        <span className="text-[10px] text-zinc-600 italic">No keyword overlap detected yet</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Cloud */}
                  <div className="bg-zinc-900 border border-border p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold uppercase text-red-400 tracking-widest mb-3 flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-red-400" />
                      Critical Gaps ({analysis.missing.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missing.slice(0, 16).map((kw) => (
                        <button
                          key={kw.text}
                          type="button"
                          onClick={() => handleInjectSkill(kw.text)}
                          title="Click to inject into skills list"
                          className="bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 text-red-400 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Plus className="w-2.5 h-2.5 shrink-0" />
                          {kw.text}
                          <span className="font-mono opacity-40">x{kw.frequency}</span>
                        </button>
                      ))}
                      {analysis.missing.length === 0 && (
                        <span className="text-[10px] text-emerald-400 italic font-semibold">Perfect alignment! No gaps.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Tailoring Suggestions Panel */}
                <div className="pt-4 border-t border-border flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-[10px] font-bold uppercase text-zinc-300 tracking-wider">
                      AI Optimization Hub
                    </h4>
                    <button
                      type="button"
                      onClick={handleTailor}
                      disabled={loadingTailor || analysis.missing.length === 0}
                      className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/30 disabled:opacity-50 disabled:pointer-events-none text-red-400 hover:text-red-300 border border-red-900/40 rounded-lg text-[10px] font-bold transition-all shadow-[0_0_12px_rgba(224, 49, 79,0.05)] flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                    >
                      {loadingTailor ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Generate Tailored Variants
                    </button>
                  </div>

                  {tailorSuggestions ? (
                    <div className="flex flex-col gap-4">
                      {/* Summary Suggestion */}
                      {tailorSuggestions.summary.before !== tailorSuggestions.summary.after && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-zinc-900 border border-border p-4 rounded-xl flex flex-col gap-3"
                        >
                          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Optimized Executive Summary</div>
                          <div className="flex flex-col gap-2">
                            <p className="text-[11px] text-zinc-500 line-through italic">{tailorSuggestions.summary.before}</p>
                            <p className="text-[11px] text-zinc-200 font-medium pl-3 border-l border-red-500/50">{tailorSuggestions.summary.after}</p>
                          </div>
                          <button
                            type="button"
                            onClick={applySummary}
                            className="px-3 py-1 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-bold transition-all shadow-[0_0_10px_rgba(224, 49, 79,0.05)] self-start cursor-pointer active:scale-95"
                          >
                            Approve & Apply Change
                          </button>
                        </motion.div>
                      )}

                      {/* Bullets Suggestions */}
                      {tailorSuggestions.bullets.map((bullet) => {
                        const isApplied = bullet.before === bullet.after
                        if (isApplied) return null
                        return (
                          <motion.div
                            key={bullet.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-border border-l-2 border-l-red-500 p-4 rounded-xl flex flex-col gap-3"
                          >
                            <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Tailored Experience Bullet</div>
                            <div className="flex flex-col gap-2">
                              <p className="text-[11px] text-zinc-500 line-through">{bullet.before}</p>
                              <p className="text-[11px] text-zinc-200 font-medium">{bullet.after}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => applyBullet(bullet.expIdx, bullet.bulletIdx, bullet.after)}
                              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-border text-[10px] font-bold text-red-400 rounded-lg hover:text-red-300 transition-colors self-start cursor-pointer active:scale-95"
                            >
                              Apply to Experience Card
                            </button>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="border border-dashed border-border bg-zinc-900/40 p-5 text-center rounded-xl">
                      <p className="text-[10.5px] text-muted-foreground italic font-light">
                        Click "Generate Tailored Variants" to see AI-rewritten content suggestions based on missing keywords.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
