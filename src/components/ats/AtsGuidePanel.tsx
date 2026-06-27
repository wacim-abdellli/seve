import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Sparkles, Zap, Shield,
  CheckCircle2, XCircle, Check, Copy
} from 'lucide-react'
import { POWER_VERBS, FORMATTING_RULES } from '../../utils/atsGuideData'
import { copyToClipboard as robustCopyToClipboard } from '../../utils/clipboard'

export default function AtsGuidePanel() {
  const [guideTab, setGuideTab] = useState<'formula' | 'verbs' | 'format'>('formula')
  const [xyzX, setXyzX] = useState('')
  const [xyzY, setXyzY] = useState('')
  const [xyzZ, setXyzZ] = useState('')
  const [selectedVerbCat, setSelectedVerbCat] = useState('Tech & Dev')
  const [copiedVerb, setCopiedVerb] = useState<string | null>(null)
  const [copiedBullet, setCopiedBullet] = useState(false)
  const [verbSearchQuery, setVerbSearchQuery] = useState('')
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(copiedTimerRef.current), [])

  const copyToClipboard = (text: string) => {
    robustCopyToClipboard(text)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center gap-2.5 mb-4 relative select-none">
        <BookOpen size={15} className="text-indigo-400" />
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">ATS Excellence Guide</h4>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Writing standard &amp; format compliance</p>
        </div>
      </div>

      {/* Guide Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-5 shrink-0 relative" role="tablist" aria-label="ATS guide sections">
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
            <span className="text-zinc-400 block">by doing [Z]</span>
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
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">How was it measured? (Y)</label>
                <input
                  type="text"
                  value={xyzY}
                  onChange={(e) => setXyzY(e.target.value)}
                  placeholder="e.g., by 40% (saving 12 hours of processing time)"
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">What action/method did you take? (Z)</label>
                <input
                  type="text"
                  value={xyzZ}
                  onChange={(e) => setXyzZ(e.target.value)}
                  placeholder="e.g., implementing query index caching and Redis stores"
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
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
                      <span className="text-[10px] text-zinc-500 font-mono ml-2">bullet_compiler.sh</span>
                    </div>
                    <button
                      onClick={() => {
                        const firstWordCapitalized = (xyzZ.trim().split(/\s+/)[0] || '').replace(/^[a-z]/, (char) => char.toUpperCase())
                        const zRest = xyzZ.trim().substring(firstWordCapitalized.length)
                        const zText = `${firstWordCapitalized}${zRest}`
                        const resultText = `${zText ? zText + ', ' : ''}${xyzX.trim() ? xyzX.trim() : ''}${xyzY.trim() ? ' ' + xyzY.trim() : ''}.`
                        copyToClipboard(resultText)
                        setCopiedBullet(true)
                        clearTimeout(copiedTimerRef.current)
                        copiedTimerRef.current = setTimeout(() => setCopiedBullet(false), 2000)
                      }}
                      className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer hover:bg-zinc-900"
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
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {verbSearchQuery && (
              <button
                onClick={() => setVerbSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md cursor-pointer"
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
                  <div className="py-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl select-none">
                    No matching verbs found for "{verbSearchQuery}"
                  </div>
                );
              }

              return (
                <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1 font-sans">
                  {allVerbs.map(group => (
                    <div key={group.category} className="space-y-1.5">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block font-mono">{group.category}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.verbs.map(verb => (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            key={verb}
                            onClick={() => {
                              copyToClipboard(verb)
                              setCopiedVerb(verb)
                              clearTimeout(copiedTimerRef.current)
                              copiedTimerRef.current = setTimeout(() => setCopiedVerb(null), 1500)
                            }}
                            className="px-2.5 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer font-mono inline-flex items-center gap-1.5 shadow-sm"
                          >
                            {verb}
                            {copiedVerb === verb ? (
                              <Check size={9} className="text-emerald-400" />
                            ) : (
                              <Copy size={9} className="text-zinc-600" />
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
                <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-2.5">
                  {POWER_VERBS.map((c) => (
                    <button
                      key={c.category}
                      onClick={() => setSelectedVerbCat(c.category)}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${selectedVerbCat === c.category ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
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
                          copyToClipboard(verb)
                          setCopiedVerb(verb)
                          setTimeout(() => setCopiedVerb(null), 1500)
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer font-mono inline-flex items-center gap-1.5 shadow-sm"
                      >
                        {verb}
                        {copiedVerb === verb ? (
                          <Check size={9} className="text-emerald-400" />
                        ) : (
                          <Copy size={9} className="text-zinc-600" />
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
            <div className="space-y-3 pt-3 border-t border-zinc-800">
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
  )
}
