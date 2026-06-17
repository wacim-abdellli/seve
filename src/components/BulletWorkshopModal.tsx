import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight, ChevronLeft, Check, Bot, RotateCcw, X } from 'lucide-react'
import { generateContent } from '../utils/aiService'
import { useToast } from '../hooks/useToast'

interface BulletWorkshopModalProps {
  isOpen: boolean
  bulletText: string
  jobTitle: string
  apiKey: string
  onClose: () => void
  onApply: (optimizedBullet: string) => void
  isInline?: boolean
}

export default function BulletWorkshopModal({
  isOpen,
  bulletText,
  jobTitle,
  apiKey,
  onClose,
  onApply,
  isInline = true,
}: BulletWorkshopModalProps) {
  const { showToast } = useToast()

  // State for the wizard steps: 1 = Action Verb, 2 = Outcome, 3 = Metric, 4 = Tech/Methods, 5 = Review
  const [step, setStep] = useState(1)
  const [verb, setVerb] = useState('')
  const [outcome, setOutcome] = useState('')
  const [metric, setMetric] = useState('')
  const [tech, setTech] = useState('')
  const [generatedBullet, setGeneratedBullet] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditingBullet, setIsEditingBullet] = useState(false)

  // Guidance messages that will animate
  const [ariaMessage, setAriaMessage] = useState('')

  const isTechJob = /developer|engineer|software|architect|programmer|qa|data|cloud|devops|system/i.test(jobTitle)

  // Get suggestions based on job title
  const getVerbSuggestions = () => {
    return isTechJob
      ? ['Spearheaded', 'Optimized', 'Engineered', 'Streamlined', 'Architected', 'Automated']
      : ['Directed', 'Executed', 'Orchestrated', 'Formulated', 'Supervised', 'Maximized']
  }

  const getOutcomeSuggestions = () => {
    return isTechJob
      ? [
          'reducing database query latency',
          'increasing user engagement rate',
          'improving API performance',
          'scaling cloud infrastructure',
          'automating test pipelines',
        ]
      : [
          'boosting sales revenue',
          'reducing project delivery time',
          'cutting operational costs',
          'increasing customer satisfaction',
          'growing team productivity',
        ]
  }

  const getMetricSuggestions = () => {
    return [
      'by 40%',
      'by $50K+',
      'saving 12 hours weekly',
      'for 100K+ active users',
      'by 2.5x',
      'under budget by 15%',
    ]
  }

  const getTechSuggestions = () => {
    return isTechJob
      ? ['using React & Node.js', 'via Docker & AWS ECS', 'by refactoring SQL paths', 'using CI/CD pipelines']
      : [
          'through Scrum agile practices',
          'by implementing new training protocols',
          'via vendor renegotiations',
          'through marketing campaigns',
        ]
  }

  // Set Aria's message
  useEffect(() => {
    if (!isOpen) return

    let text = ''
    switch (step) {
      case 1:
        text = `Hello! Let's supercharge this bullet point. First, let's select a powerful Action Verb. Which one best describes what you did?`
        break
      case 2:
        text = `Great! Now, what was the core outcome or result of your action? Select a template below or write your own.`
        break
      case 3:
        text = `Perfect. Quantifying your impact is key for ATS scores. What numbers, metrics, or timelines can we add?`
        break
      case 4:
        text = `Almost done! What tools, technologies, frameworks, or methodologies did you use to accomplish this?`
        break
      case 5:
        text = `We have everything we need. Here is the optimized bullet point I compiled for you. Feel free to tweak it before applying.`
        break
    }

    setAriaMessage(text)
  }, [step, isOpen])

  // Try to pre-extract existing verb from the current bullet on open
  useEffect(() => {
    if (isOpen && bulletText.trim()) {
      const words = bulletText.trim().split(/\s+/)
      if (words.length > 0) {
        const potentialVerb = words[0].replace(/[^a-zA-Z]/g, '')
        // Capitalize
        if (potentialVerb.length > 2) {
          const capitalized = potentialVerb.charAt(0).toUpperCase() + potentialVerb.slice(1).toLowerCase()
          setVerb(capitalized)
        }
      }
    }
  }, [isOpen, bulletText])

  const handleNext = () => {
    if (step === 1 && !verb.trim()) {
      showToast('Please select or type an action verb.', 'warning')
      return
    }
    if (step === 2 && !outcome.trim()) {
      showToast('Please provide a core outcome.', 'warning')
      return
    }

    if (step === 4) {
      generateFinalBullet()
    }
    setStep((prev) => Math.min(5, prev + 1))
  }

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1))
  }

  const generateFinalBullet = async () => {
    if (!apiKey || !apiKey.trim()) {
      showToast('Google Gemini API Key is required for AI writing. Please set it in Settings.', 'warning')
      const fallback = `${verb} ${outcome} ${metric ? metric + ' ' : ''}${tech ? tech : ''}.`
        .replace(/\s+/g, ' ')
        .trim()
      setGeneratedBullet(fallback)
      setIsGenerating(false)
      return
    }
    setIsGenerating(true)
    setGeneratedBullet('')
    try {
      const prompt = `You are an expert resume writer. Improve this experience achievement bullet point:
      - Action Verb: ${verb}
      - Core Action/Outcome: ${outcome}
      - Measurable Metric: ${metric}
      - Tools/Technologies/Methods: ${tech}
      
      Start it with the action verb and make it read like an elite resume bullet point. Avoid personal pronouns (I, me, my, we). Keep it to one concise sentence.`

      const result = await generateContent(prompt, apiKey, 'improve')
      const cleanedResult = result.trim().replace(/^•|-|\*|\d+\.\s*/, '').trim()
      setGeneratedBullet(cleanedResult)
    } catch (e) {
      console.error(e)
      const fallback = `${verb} ${outcome} ${metric ? metric + ' ' : ''}${tech ? tech : ''}.`
        .replace(/\s+/g, ' ')
        .trim()
      setGeneratedBullet(fallback)
      showToast('Completed with local engine format.', 'info')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = () => {
    if (!generatedBullet.trim()) return
    onApply(generatedBullet)
    showToast('Bullet point updated in resume!', 'success')
    onClose()
  }

  const resetWorkshop = () => {
    setVerb('')
    setOutcome('')
    setMetric('')
    setTech('')
    setGeneratedBullet('')
    setStep(1)
    setIsEditingBullet(false)
  }

  if (!isOpen) return null

  // INLINE CARD RENDERING FOR THE DRAWER
  if (isInline) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-3 flex flex-col no-print select-text animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-white">
            ARIA's Bullet Workshop
          </span>
          <span className="text-[10px] text-zinc-550 ml-auto">
            Step {step} of 5
          </span>
          <button
            onClick={onClose}
            className="text-zinc-550 hover:text-white transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Tracker Dots */}
        <div className="flex items-center justify-center mb-4 gap-1.5 flex-shrink-0">
          {[1, 2, 3, 4, 5].map((s) => {
            const isCurrent = s === step
            const isPast = s < step
            return (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-200 ${
                  isCurrent
                    ? 'bg-rose-500 w-5 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                    : isPast
                    ? 'bg-rose-500/40 w-2'
                    : 'bg-zinc-800 w-2'
                }`}
              />
            )
          })}
        </div>

        {/* AI Dialog Msg */}
        <div className="bg-zinc-950/40 rounded-xl p-3 border border-zinc-800/50 mb-4 flex-shrink-0 flex gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Bot className="w-3 h-3 text-rose-400" />
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans pt-0.5">
            {ariaMessage}
          </p>
        </div>

        {/* Step Content Area */}
        <div className="flex-1 min-h-[120px] mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {/* STEP 1: Action Verb */}
              {step === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                    {getVerbSuggestions().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setVerb(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                          verb === s
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={verb}
                    onChange={(e) => setVerb(e.target.value)}
                    placeholder="Or type custom verb..."
                    className="drawer-input px-3 py-2 text-xs"
                  />
                </div>
              )}

              {/* STEP 2: Core Outcome */}
              {step === 2 && (
                <div className="flex flex-col gap-3">
                  <div className="max-h-[110px] overflow-y-auto flex flex-col gap-1.5 pr-1">
                    {getOutcomeSuggestions().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setOutcome(s)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all border cursor-pointer ${
                          outcome === s
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={outcome}
                    rows={2}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Or write custom result..."
                    className="drawer-input px-3 py-2 text-xs resize-none"
                  />
                </div>
              )}

              {/* STEP 3: Metric */}
              {step === 3 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {getMetricSuggestions().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMetric(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                          metric === s
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    placeholder="Or type specific numbers..."
                    className="drawer-input px-3 py-2 text-xs"
                  />
                </div>
              )}

              {/* STEP 4: Tech & Tools */}
              {step === 4 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {getTechSuggestions().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTech(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                          tech === s
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                    placeholder="Or specify tools..."
                    className="drawer-input px-3 py-2 text-xs"
                  />
                </div>
              )}

              {/* STEP 5: Review & Apply */}
              {step === 5 && (
                <div>
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-5 gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider animate-pulse">
                        Aria is generating...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-lg">
                        <span className="text-[8px] font-bold uppercase text-zinc-650 tracking-wider mb-1 block">
                          Before:
                        </span>
                        <p className="text-[11.5px] text-zinc-550 italic leading-relaxed">
                          {bulletText.trim() ? bulletText : '(Empty Bullet Point)'}
                        </p>
                      </div>

                      <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-bold uppercase text-rose-400 tracking-widest flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Optimized:
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingBullet(!isEditingBullet)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold bg-transparent border-0 cursor-pointer"
                          >
                            {isEditingBullet ? 'Save' : 'Edit'}
                          </button>
                        </div>
                        {isEditingBullet ? (
                          <textarea
                            value={generatedBullet}
                            onChange={(e) => setGeneratedBullet(e.target.value)}
                            rows={3}
                            className="drawer-input px-3 py-2 text-xs resize-none"
                          />
                        ) : (
                          <p className="text-xs text-white font-medium leading-relaxed">
                            {generatedBullet}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls bar */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 flex-shrink-0">
          <div>
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {step === 5 && !isGenerating && (
              <button
                type="button"
                onClick={resetWorkshop}
                className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Over
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 text-rose-400 hover:text-rose-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {step === 4 ? (
                  <>
                    <span>Build Bullet</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            ) : (
              !isGenerating && (
                <>
                  <button
                    type="button"
                    onClick={generateFinalBullet}
                    className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.98, y: 10, filter: 'blur(4px)' }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
        className="relative w-full max-w-[600px] bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10 border border-border">
              <Bot className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-sans">Aria's Bullet Workshop</h3>
              <span className="text-[10px] text-muted-foreground block mt-0.5 font-sans">
                Step {step} of 5 · Guided Optimization
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider bg-transparent border-0 cursor-pointer"
            type="button"
          >
            Close
          </button>
        </div>

        {/* Progress Tracker Dots */}
        <div className="flex items-center justify-center mb-5 gap-2">
          {[1, 2, 3, 4, 5].map((s) => {
            const isCurrent = s === step
            const isPast = s < step
            return (
              <motion.div
                key={s}
                layout
                className={`h-1.5 rounded-full ${
                  isCurrent
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    : isPast
                    ? 'bg-red-500/40'
                    : 'bg-zinc-800'
                }`}
                style={{ width: isCurrent ? '24px' : '8px' }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
              />
            )
          })}
        </div>

        {/* AI Coach dialogue bubble */}
        <div className="bg-zinc-900 border border-border p-4 rounded-xl mb-5 flex gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 shrink-0 text-white shadow-[0_0_8px_rgba(239, 68, 68,0.25)]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-0.5">Aria</span>
            <p className="text-xs text-zinc-200 leading-relaxed font-light">
              {ariaMessage}
            </p>
          </div>
        </div>

        {/* Interactive Steps Controls */}
        <div className="min-h-[140px] mb-5 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15, filter: 'blur(2px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -15, filter: 'blur(2px)' }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
              className="w-full"
            >
              {/* STEP 1: Action Verb */}
              {step === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 mb-1">
                    {getVerbSuggestions().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setVerb(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          verb === s
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-850 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={verb}
                    onChange={(e) => setVerb(e.target.value)}
                    placeholder="Or type custom action verb (e.g. Spearheaded)..."
                    className="h-9 rounded-lg border border-border bg-zinc-950 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full"
                  />
                </div>
              )}

              {/* STEP 2: Core Outcome */}
              {step === 2 && (
                <div className="flex flex-col gap-3">
                  <div className="max-h-[120px] overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                    {getOutcomeSuggestions().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setOutcome(s)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all border cursor-pointer ${
                          outcome === s
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold'
                            : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-850 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={outcome}
                    rows={2}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Or write custom core result (e.g. reduced load times by streamlining workflows)..."
                    className="rounded-lg border border-border bg-zinc-950 p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full resize-none"
                  />
                </div>
              )}

              {/* STEP 3: Metric */}
              {step === 3 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 mb-1">
                    {getMetricSuggestions().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMetric(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          metric === s
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-850 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    placeholder="Or type specific numbers (e.g. reducing server costs by $1,200/month)..."
                    className="h-9 rounded-lg border border-border bg-zinc-950 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full"
                  />
                </div>
              )}

              {/* STEP 4: Tech & Tools */}
              {step === 4 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 mb-1">
                    {getTechSuggestions().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTech(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          tech === s
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-850 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                    placeholder="Or specify tools (e.g. using React and TypeScript)..."
                    className="h-9 rounded-lg border border-border bg-zinc-950 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full"
                  />
                </div>
              )}

              {/* STEP 5: Review & Apply */}
              {step === 5 && (
                <div>
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-5 gap-3">
                      <div className="w-8 h-8 rounded-full border-[3px] border-red-500 border-t-transparent animate-spin" />
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider animate-pulse font-sans">
                        Aria is compiling achievements...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 font-sans">
                      <div className="bg-zinc-900 border border-border p-3.5 rounded-xl font-sans">
                        <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider mb-1 block">
                          Before:
                        </span>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          {bulletText.trim() ? bulletText : '(Empty Bullet Point)'}
                        </p>
                      </div>

                      <div className="bg-red-500/5 border border-red-500/20 p-3.5 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-bold uppercase text-red-400 tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Aria's Optimized Bullet:
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingBullet(!isEditingBullet)}
                            className="text-[10px] text-red-400 hover:text-red-300 underline font-semibold bg-transparent border-0 cursor-pointer"
                          >
                            {isEditingBullet ? 'Save' : 'Edit'}
                          </button>
                        </div>
                        {isEditingBullet ? (
                          <textarea
                            value={generatedBullet}
                            onChange={(e) => setGeneratedBullet(e.target.value)}
                            rows={3}
                            className="rounded-lg border border-border bg-zinc-950 p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full resize-none font-medium"
                          />
                        ) : (
                          <p className="text-xs text-white font-medium leading-relaxed">
                            {generatedBullet}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls bar */}
        <div className="flex items-center justify-between pt-4 border-t border-border flex-shrink-0">
          <div>
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-border rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {step === 5 && !isGenerating && (
              <button
                type="button"
                onClick={resetWorkshop}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-border rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Over
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(224,49,79,0.05)] flex items-center gap-1 cursor-pointer"
              >
                {step === 4 ? (
                  <>
                    <span>Build Bullet</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            ) : (
              !isGenerating && (
                <>
                  <button
                    type="button"
                    onClick={generateFinalBullet}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-border rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(224,49,79,0.05)] flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply to Resume
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
