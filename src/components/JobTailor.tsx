import { useState } from 'react'
import type { ResumeData } from '../types/resume'
import { generateContent } from '../utils/aiService'

interface JobTailorProps {
  resumeData: ResumeData
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void
  onUpdateResumeData: (updated: ResumeData) => void
  apiKey: string
}

// Stopwords for local analysis
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'and', 'or', 'but', 'if', 'about', 'by'
])

export default function JobTailor({
  resumeData,
  jobDescription,
  onUpdateJobDescription,
  onUpdateResumeData,
  apiKey,
}: JobTailorProps) {
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [loadingTailor, setLoadingTailor] = useState(false)
  const [tailorSuggestions, setTailorSuggestions] = useState<{
    summary: { before: string; after: string }
    bullets: { id: string; expIdx: number; bulletIdx: number; before: string; after: string }[]
  } | null>(null)

  // Extract keywords locally
  const getKeywordsAnalysis = () => {
    if (!jobDescription.trim()) return { total: 0, matched: [], missing: [], percent: 0 }
    
    const words = jobDescription
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    
    const uniqueKeywords = Array.from(new Set(words))

    // Check resume content
    let fullResumeText = ` ${resumeData.summary}`
    resumeData.experience.forEach((exp) => {
      fullResumeText += ` ${exp.jobTitle} ${exp.company} ${exp.bullets.join(' ')}`
    })
    resumeData.skills.forEach((s) => {
      fullResumeText += ` ${s}`
    })
    const lowerResume = fullResumeText.toLowerCase()

    const matched: string[] = []
    const missing: string[] = []

    uniqueKeywords.forEach((kw) => {
      if (lowerResume.includes(kw)) {
        matched.push(kw)
      } else {
        missing.push(kw)
      }
    })

    const percent = uniqueKeywords.length ? Math.round((matched.length / uniqueKeywords.length) * 100) : 0

    return { total: uniqueKeywords.length, matched, missing, percent }
  }

  const analysis = getKeywordsAnalysis()

  const handleAnalyze = () => {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first.')
      return
    }
    setIsAnalyzed(true)
  }

  const handleTailor = async () => {
    setLoadingTailor(true)
    try {
      const missingString = analysis.missing.slice(0, 5).join(', ')
      
      // Tailor Summary
      const summaryPrompt = `Tailor this resume summary to match the job description. Summary: "${resumeData.summary}". Integrate these missing keywords naturally: ${missingString}`
      const tailoredSummary = await generateContent(summaryPrompt, apiKey, 'tailor')

      // Tailor Bullets (find up to 2 bullets to tailor)
      const suggestionsList: { id: string; expIdx: number; bulletIdx: number; before: string; after: string }[] = []
      
      let count = 0
      for (let expIdx = 0; expIdx < resumeData.experience.length; expIdx++) {
        const exp = resumeData.experience[expIdx]
        for (let bulletIdx = 0; bulletIdx < exp.bullets.length; bulletIdx++) {
          const bullet = exp.bullets[bulletIdx]
          if (bullet.trim() && count < 2) {
            const kwToInject = analysis.missing[count] || 'advanced skills'
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
    } catch (e) {
      console.error('Tailor error:', e)
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
    alert('Summary updated!')
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
    alert('Bullet point updated!')
  }

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Job Description Tailoring</h3>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Target Job Description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => onUpdateJobDescription(e.target.value)}
          placeholder="Paste the target job posting / description here..."
          className="w-full h-44 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm leading-relaxed"
        />
        <button
          onClick={handleAnalyze}
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-lg py-2.5 text-xs font-semibold transition-all"
        >
          Analyze Keywords
        </button>
      </div>

      {isAnalyzed && jobDescription.trim() !== '' && (
        <div className="space-y-4 pt-3 border-t border-slate-700">
          {/* Analysis Dashboard */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wide">Keyword Match</span>
              <span className="text-3xl font-black text-white">{analysis.percent}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wide">Matched / Total</span>
              <span className="text-sm font-bold text-indigo-400">{analysis.matched.length} / {analysis.total} keywords</span>
            </div>
          </div>

          {/* Keywords Lists */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">Matched ({analysis.matched.length})</h4>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                {analysis.matched.map((kw) => (
                  <span key={kw} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase text-red-400 tracking-wider">Missing ({analysis.missing.length})</h4>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                {analysis.missing.slice(0, 15).map((kw) => (
                  <span key={kw} className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Tailoring panel */}
          <button
            onClick={handleTailor}
            disabled={loadingTailor || analysis.missing.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg py-2.5 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            {loadingTailor ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            AI Tailor Resume
          </button>

          {/* Suggested edits display */}
          {tailorSuggestions && (
            <div className="space-y-3 pt-3 border-t border-slate-700">
              <h4 className="text-xs font-bold uppercase text-slate-300">Suggested Bullet & Summary Edits</h4>
              
              {/* Summary Suggestion */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="font-bold text-slate-200">Tailored Summary</div>
                <div className="text-red-400 line-through leading-relaxed">{tailorSuggestions.summary.before}</div>
                <div className="text-emerald-400 leading-relaxed font-medium">{tailorSuggestions.summary.after}</div>
                <button
                  onClick={applySummary}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded px-2.5 py-1 text-[10px] font-semibold"
                >
                  Apply to Resume
                </button>
              </div>

              {/* Bullets Suggestions */}
              {tailorSuggestions.bullets.map((bullet) => (
                <div key={bullet.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="font-bold text-slate-200">
                    Tailored Bullet (Experience role #{bullet.expIdx + 1})
                  </div>
                  <div className="text-red-400 line-through leading-relaxed">{bullet.before}</div>
                  <div className="text-emerald-400 leading-relaxed font-medium">{bullet.after}</div>
                  <button
                    onClick={() => applyBullet(bullet.expIdx, bullet.bulletIdx, bullet.after)}
                    className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded px-2.5 py-1 text-[10px] font-semibold"
                  >
                    Apply to Resume
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
