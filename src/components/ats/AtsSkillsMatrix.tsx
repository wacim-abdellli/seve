import type { SkillsMatrixItem } from '../../types/resume'
import { weightKeyword } from '../../utils/atsEvaluator'
import { Check, Plus, Target, TrendingUp } from 'lucide-react'

interface AtsSkillsMatrixProps {
  skillsMatrix: SkillsMatrixItem[]
  semanticScore: number
  resumeDomain: string
  onOpenJdInput: () => void
}

export default function AtsSkillsMatrix({ skillsMatrix, semanticScore, resumeDomain, onOpenJdInput }: AtsSkillsMatrixProps) {
  return (
    <div className="space-y-5">
      {/* Skills breakdown header info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-750 transition-colors duration-200">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Target size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-505 uppercase tracking-widest font-mono">Keyword Overlap</p>
            <h4 className="text-lg font-black text-white mt-0.5">{semanticScore || 0}% Match</h4>
            <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">Vocabulary relevance compared to the job description tokens.</p>
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
          {skillsMatrix.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-5 my-8 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
                <Target size={26} className="text-zinc-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-wide">Compare with Job Description</h4>
                <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
                  Paste a job listing to compare skill keywords automatically. Unlocks the Skills Matrix, matched vocabulary checks, and keyword overlap scores.
                </p>
              </div>
              <button
                onClick={onOpenJdInput}
                className="text-xs font-bold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 select-none"
              >
                <Plus size={14} />
                Paste Target Job Description
              </button>
            </div>
          ) : (
            skillsMatrix.map((item) => {
              const matchPercent = item.required > 0
                ? Math.round((item.matched.length / (item.matched.length + item.missing.length || 1)) * 100)
                : 100

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
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'
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
            })
          )}
        </div>
      </div>
    </div>
  )
}
