import { useState, useEffect, useRef } from 'react'
import type { AtsScore, ResumeData } from '../types/resume'
import { autoFix } from '../utils/aiService'

interface AtsDashboardProps {
  atsScore: AtsScore
  resumeData: ResumeData
  onFix: (fixed: ResumeData) => void
}

export default function AtsDashboard({ atsScore, resumeData, onFix }: AtsDashboardProps) {
  const { total, grade, sections, passing, failing } = atsScore

  const [displayScore, setDisplayScore] = useState(0)
  const [pulseScore, setPulseScore] = useState(false)
  const prevScoreRef = useRef(total)

  useEffect(() => {
    let start = displayScore
    const end = total
    if (start === end) return

    const duration = 600 // ms
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = Math.round(start + (end - start) * progress)
      
      setDisplayScore(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        if (end > prevScoreRef.current) {
          setPulseScore(true)
          const t = setTimeout(() => setPulseScore(false), 2000)
          return () => clearTimeout(t)
        }
        prevScoreRef.current = end
      }
    }

    requestAnimationFrame(animate)
  }, [total])

  const handleAutoFix = () => {
    const fixed = autoFix(resumeData)
    onFix(fixed)
    alert('Auto-fix applied! Removed pronouns, standardized date formats, and removed special characters.')
  }

  // Circular progress math
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (circumference * displayScore) / 100

  // Color mappings
  const getThemeColor = () => {
    if (total >= 90) return { stroke: 'stroke-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
    if (total >= 70) return { stroke: 'stroke-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }
    if (total >= 50) return { stroke: 'stroke-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    return { stroke: 'stroke-red-500', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  }

  const colors = getThemeColor()

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* SVG Score Circle */}
      <div className={`p-4 rounded-xl text-center border transition-all duration-300 ${colors.bg} ${colors.border} ${pulseScore ? 'animate-pulse-success' : ''} flex flex-col items-center justify-center`}>
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-slate-700 fill-transparent"
              strokeWidth="8"
            />
            {/* Active circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className={`${colors.stroke} fill-transparent transition-all duration-500 ease-out`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-black text-white">{displayScore}</span>
            <span className="text-slate-400 text-xs block -mt-1">/100</span>
          </div>
        </div>
        <div className="mt-3">
          <span className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>{grade}</span>
        </div>
      </div>

      {/* Auto-Fix Trigger */}
      {failing.length > 0 && (
        <button
          onClick={handleAutoFix}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20"
        >
          ✨ Run One-Click Auto-Fix
        </button>
      )}

      {/* Progress Bars for Categories */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Breakdown</h4>
        <div className="space-y-2">
          {Object.entries({
            'Section Completeness': { score: sections.sectionCompleteness, max: 20 },
            'Keyword Matching': { score: sections.keywordMatch, max: 25 },
            'Formatting Safety': { score: sections.formattingSafety, max: 20 },
            'Action Verbs': { score: sections.actionVerbs, max: 10 },
            'Quantified Results': { score: sections.quantifiedResults, max: 10 },
            'Contact Information': { score: sections.contactInfo, max: 5 },
            'Date Consistency': { score: sections.dateConsistency, max: 5 },
            'Length Appropriateness': { score: sections.lengthAppropriateness, max: 5 },
          }).map(([name, val]) => {
            const pct = (val.score / val.max) * 100
            return (
              <div key={name} className="text-xs">
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>{name}</span>
                  <span className="text-slate-400">{val.score}/{val.max}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Passing / Failing checklist tab */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Failing items */}
        {failing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-red-400 tracking-wider">Needs Fixing ({failing.length})</h4>
            <div className="space-y-2">
              {failing.map((item, idx) => (
                <div key={idx} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-xs">
                  <div className="font-semibold text-red-400 flex gap-1.5 items-start">
                    <span className="shrink-0 mt-0.5">❌</span>
                    <span>{item.issue}</span>
                  </div>
                  <p className="text-slate-400 mt-1 leading-relaxed pl-5">{item.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passing items */}
        {passing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Passing ({passing.length})</h4>
            <div className="space-y-2">
              {passing.map((item, idx) => (
                <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                  <span>✅</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
