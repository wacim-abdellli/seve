import { useState, useContext, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, Send, Check, AlertCircle, ChevronDown, ChevronUp, Sliders, Play } from 'lucide-react'
import ResumeDataContextInternal from '../../context/resumeDataContextDef'
import { useAi } from '../../hooks/useAi'
import { aiComplete, PROMPTS } from '../../services/aiService'
import { extractAllJsonObjects } from '../../utils/jsonParser'

function makeId() { return Math.random().toString(36).slice(2, 10) }

interface CopilotResponse {
  action: string
  data?: any
  message?: string
}

const TONE_OPTIONS = ['Professional', 'Bold & Confident', 'Creative', 'Direct & Minimal']
const LEVEL_OPTIONS = ['Junior', 'Mid-level', 'Senior', 'Lead / Executive']
const FOCUS_OPTIONS = ['Technical Skills', 'Team Leadership', 'Metrics & Outcomes', 'Project Delivery', 'Revenue/Sales Growth']

export default function AiChatCopilot({ defaultCollapsed = false }: { defaultCollapsed?: boolean }) {
  const ctx = useContext(ResumeDataContextInternal)
  const { config, isUsingAppKey } = useAi()

  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')
  
  // Wizard state parameters
  const [showWizard, setShowWizard] = useState(false)
  const [selectedTone, setSelectedTone] = useState('Professional')
  const [selectedLevel, setSelectedLevel] = useState('Senior')
  const [selectedFocus, setSelectedFocus] = useState<string[]>(['Technical Skills'])

  // Dynamic clarification state
  const [clarification, setClarification] = useState<{
    question: string
    options: string[]
    pendingCommand: string
  } | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)

  if (!ctx) return null
  const { resumeData, updateResumeData } = ctx

  const handleCommand = async (cmdText: string) => {
    if (!cmdText.trim()) return
    setStatus('loading')
    setFeedback('')

    try {
      const { prompt, systemPrompt } = PROMPTS.copilotCommand(cmdText.trim(), JSON.stringify(resumeData))
      const responseText = await aiComplete(
        prompt,
        config,
        { systemPrompt, jsonMode: true, maxTokens: 1024 },
      )

      const rawObjects = extractAllJsonObjects(responseText)
      if (rawObjects.length === 0) {
        throw new Error('Failed to parse command response from AI.')
      }

      // Flatten actions: extract nested actions if the model wraps them in an object
      const actions: CopilotResponse[] = []
      for (const obj of rawObjects) {
        if (obj && Array.isArray(obj.actions)) {
          actions.push(...obj.actions)
        } else if (obj && obj.action) {
          actions.push(obj)
        }
      }

      if (actions.length === 0) {
        throw new Error('No valid actions could be parsed from AI response.')
      }

      // Handle clarification action
      if (actions.length === 1 && actions[0].action === 'clarify' && actions[0].data) {
        setClarification({
          question: actions[0].data.question || 'Could you clarify your request?',
          options: Array.isArray(actions[0].data.options) ? actions[0].data.options : [],
          pendingCommand: cmdText
        })
        setStatus('idle')
        return
      }

      // If the only action is 'unknown', show the conversational message
      if (actions.length === 1 && actions[0].action === 'unknown') {
        setStatus('error')
        setFeedback(actions[0].message || "I didn't quite understand that command. Try asking to add a project, certification, volunteer experience, language, or to update your summary.")
        return
      }

      // Handle all actions sequentially on the same state
      const updated = { ...resumeData }
      const labels: string[] = []

      for (const res of actions) {
        if (res.action === 'unknown') continue

        switch (res.action) {
          case 'add_project':
            if (res.data) {
              updated.projects = [...(updated.projects || []), {
                id: makeId(),
                name: res.data.name || 'New Project',
                description: res.data.description || '',
                technologies: Array.isArray(res.data.technologies) ? res.data.technologies : [],
                link: res.data.link || '',
              }]
              labels.push(`Added Project: "${res.data.name}"`)
            }
            break

          case 'add_certification':
            if (res.data) {
              updated.certifications = [...(updated.certifications || []), {
                id: makeId(),
                title: res.data.title || 'Certification',
                issuer: res.data.issuer || '',
                date: res.data.date || '',
                description: res.data.description || '',
              }]
              labels.push(`Added Certification: "${res.data.title}"`)
            }
            break

          case 'add_award':
            if (res.data) {
              updated.awards = [...(updated.awards || []), {
                id: makeId(),
                title: res.data.title || 'Award',
                awarder: res.data.awarder || '',
                date: res.data.date || '',
                description: res.data.description || '',
              }]
              labels.push(`Added Award: "${res.data.title}"`)
            }
            break

          case 'add_volunteer':
            if (res.data) {
              updated.volunteer = [...(updated.volunteer || []), {
                id: makeId(),
                organization: res.data.organization || 'Volunteer Organization',
                location: res.data.location || '',
                period: res.data.period || '',
                description: res.data.description || '',
              }]
              labels.push(`Added Volunteer role at ${res.data.organization}`)
            }
            break

          case 'add_language':
            if (res.data) {
              updated.languages = [...(updated.languages || []), {
                id: makeId(),
                name: res.data.name || 'Language',
                proficiency: res.data.proficiency || 'Professional',
              }]
              labels.push(`Added Language: ${res.data.name}`)
            }
            break

          case 'update_summary':
            if (typeof res.data === 'string') {
              updated.summary = res.data
              labels.push('Updated profile summary')
            }
            break

          case 'add_experience':
            if (res.data) {
              updated.experience = [...(updated.experience || []), {
                id: makeId(),
                jobTitle: res.data.jobTitle || 'Role',
                company: res.data.company || '',
                location: res.data.location || '',
                startDate: res.data.startDate || '',
                endDate: res.data.endDate || '',
                current: res.data.current ?? true,
                bullets: Array.isArray(res.data.bullets) ? res.data.bullets : [],
              }]
              labels.push(`Added Experience at ${res.data.company}`)
            }
            break

          case 'add_skills':
            if (Array.isArray(res.data)) {
              const currentSkills = new Set(updated.skills || [])
              res.data.forEach(s => currentSkills.add(String(s).trim()))
              updated.skills = Array.from(currentSkills)
              labels.push(`Added skills: ${res.data.join(', ')}`)
            }
            break

          case 'add_interest':
            if (res.data) {
              updated.interests = [...(updated.interests || []), {
                id: makeId(),
                name: res.data.name || 'Interest',
                keywords: Array.isArray(res.data.keywords) ? res.data.keywords : [],
              }]
              labels.push(`Added Interest: ${res.data.name}`)
            }
            break

          case 'update_contact':
            if (res.data) {
              updated.contact = {
                ...(updated.contact || { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '' }),
                ...res.data
              }
              const fieldsList = Object.keys(res.data).join(', ')
              labels.push(`Updated contact details (${fieldsList})`)
            }
            break

          case 'update_experience':
            if (res.data) {
              const expIdx = updated.experience.findIndex(
                e => (res.data.id && e.id === res.data.id) ||
                     (res.data.company && e.company.toLowerCase().includes(res.data.company.toLowerCase())) ||
                     (res.data.jobTitle && e.jobTitle.toLowerCase().includes(res.data.jobTitle.toLowerCase()))
              )
              if (expIdx !== -1) {
                updated.experience = updated.experience.map((e, idx) => {
                  if (idx === expIdx) {
                    return {
                      ...e,
                      ...res.data,
                      id: e.id, // preserve original ID
                    }
                  }
                  return e
                })
                labels.push(`Updated Experience at ${updated.experience[expIdx].company}`)
              }
            }
            break

          case 'update_project':
            if (res.data) {
              const prjIdx = (updated.projects || []).findIndex(
                p => (res.data.id && p.id === res.data.id) ||
                     (res.data.name && p.name.toLowerCase().includes(res.data.name.toLowerCase()))
              )
              if (prjIdx !== -1 && updated.projects) {
                updated.projects = updated.projects.map((p, idx) => {
                  if (idx === prjIdx) {
                    return {
                      ...p,
                      ...res.data,
                      id: p.id, // preserve original ID
                    }
                  }
                  return p
                })
                labels.push(`Updated Project: "${updated.projects[prjIdx].name}"`)
              }
            }
            break

          default:
            // Skip unsupported actions silently or throw
            break
        }
      }

      if (labels.length === 0) {
        throw new Error('No valid actions could be parsed from AI response.')
      }

      const actionLabel = labels.join(', ') + ' ✓'

      updateResumeData(updated)
      setStatus('success')
      setFeedback(actionLabel)
      setInput('')

      // Auto clear success message after 4s
      setTimeout(() => {
        setFeedback(prev => prev === actionLabel ? '' : prev)
        setStatus(prev => prev === 'success' ? 'idle' : prev)
      }, 4000)

    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setFeedback(err?.message || 'Failed to process command. Please verify your connection and try again.')
    }
  }

  const handleWizardGenerate = async () => {
    setStatus('loading')
    setFeedback('')
    try {
      const jobTitle = resumeData.experience?.[0]?.jobTitle || 'Professional'
      const skillsList = resumeData.skills || []
      const yearsExp = Math.max(1, resumeData.experience?.length || 1)

      const { prompt, systemPrompt } = (PROMPTS as any).generateSummaryWithOptions(
        jobTitle,
        skillsList,
        yearsExp,
        selectedTone,
        selectedFocus,
        selectedLevel
      )

      const result = await aiComplete(prompt, config, { systemPrompt, maxTokens: 1024 })
      
      updateResumeData({
        ...resumeData,
        summary: result.trim()
      })

      setStatus('success')
      setFeedback('Profile Summary updated via Wizard ✓')
      setShowWizard(false)
      
      setTimeout(() => {
        setFeedback(prev => prev === 'Profile Summary updated via Wizard ✓' ? '' : prev)
        setStatus(prev => prev === 'success' ? 'idle' : prev)
      }, 4000)

    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setFeedback(err?.message || 'Wizard failed to generate summary.')
    }
  }

  const toggleFocus = (focus: string) => {
    setSelectedFocus(prev => 
      prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]
    )
  }

  return (
    <div
      ref={containerRef}
      className="mx-3 mb-3 p-3.5 rounded-xl space-y-3"
      style={{
        background: 'linear-gradient(180deg, rgba(185,28,28,0.02) 0%, rgba(0,0,0,0) 100%)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <button onClick={() => setCollapsed(v => !v)} className="flex items-center gap-2 w-full text-left">
        <div className="w-5 h-5 rounded-md bg-[#b91c1c]/10 border border-[#b91c1c]/25 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-[#b91c1c]" />
        </div>
        <span className="text-[10px] font-bold text-white uppercase tracking-wider flex-1">AI Copilot</span>
        {collapsed ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronUp className="w-3 h-3 text-zinc-500" />}
        {isUsingAppKey ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(185,28,28,0.12)', color: 'rgba(252,165,165,0.8)', border: '1px solid rgba(185,28,28,0.2)' }}>
            Seve AI · Free
          </span>
        ) : (
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
            {config?.provider ?? 'custom'}
          </span>
        )}
      </button>

      {!collapsed && (<>
      
      {/* Wizard Bento Toggle/Panel */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowWizard(w => !w)}
          disabled={status === 'loading'}
          className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            showWizard 
              ? 'bg-[#b91c1c]/10 border-[#b91c1c]/35 text-[#b91c1c]' 
              : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
          }`}
        >
          <Sliders className="w-3 h-3" />
          {showWizard ? 'Close Wizard' : 'Summary Wizard'}
        </button>
      </div>

      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border border-white/5 bg-white/[0.01] rounded-xl p-3.5 space-y-4"
          >
            {/* Tone Selector */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Tone of Voice</span>
              <div className="flex flex-wrap gap-1">
                {TONE_OPTIONS.map(tone => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold border transition-colors cursor-pointer ${
                      selectedTone === tone
                        ? 'bg-[#b91c1c]/10 border-[#b91c1c]/30 text-white'
                        : 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Selector */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Experience Level</span>
              <div className="flex flex-wrap gap-1">
                {LEVEL_OPTIONS.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold border transition-colors cursor-pointer ${
                      selectedLevel === lvl
                        ? 'bg-[#b91c1c]/10 border-[#b91c1c]/30 text-white'
                        : 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Checklist */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Focus Areas (Select all that apply)</span>
              <div className="grid grid-cols-2 gap-1.5">
                {FOCUS_OPTIONS.map(focus => {
                  const active = selectedFocus.includes(focus)
                  return (
                    <button
                      key={focus}
                      onClick={() => toggleFocus(focus)}
                      className={`px-2 py-1.5 rounded-lg border text-left text-[9px] font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        active
                          ? 'bg-[#b91c1c]/10 border-[#b91c1c]/25 text-white'
                          : 'bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-[#b91c1c]' : 'bg-zinc-800'}`} />
                      <span className="truncate">{focus}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleWizardGenerate}
              disabled={status === 'loading'}
              className="w-full py-2 bg-[#b91c1c] hover:bg-[#c62828] active:scale-[0.98] transition-all text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Generate Profile Summary
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clarification Multiple-Choice Selector */}
      <AnimatePresence>
        {clarification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="border border-[#b91c1c]/25 bg-black/40 rounded-xl p-3.5 space-y-3 shadow-xl"
            style={{ background: 'linear-gradient(180deg, rgba(185,28,28,0.04) 0%, rgba(17,17,22,0.98) 100%)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-300 leading-tight pr-4">
                {clarification.question}
              </span>
              <span className="text-[8px] text-[#b91c1c] font-bold uppercase tracking-wider bg-[#b91c1c]/10 px-1.5 py-0.5 rounded shrink-0">
                Clarifying
              </span>
            </div>

            <div className="space-y-1.5">
              {clarification.options.map((opt, idx) => (
                <button
                  key={opt}
                  onClick={() => {
                    const nextCmd = `${clarification.pendingCommand} (Selection Context: ${opt})`
                    setClarification(null)
                    handleCommand(nextCmd)
                  }}
                  className="w-full text-left px-3 py-2 bg-white/[0.01] border border-white/5 hover:border-[#b91c1c]/30 hover:bg-[#b91c1c]/5 rounded-lg text-[10px] font-medium text-zinc-400 hover:text-white transition-all flex items-center gap-2.5 group cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-md bg-white/5 group-hover:bg-[#b91c1c]/10 text-zinc-500 group-hover:text-[#b91c1c] text-[9px] font-bold flex items-center justify-center shrink-0 border border-white/5 transition-colors">
                    {idx + 1}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] text-zinc-600">
                Or reply directly below...
              </span>
              <button
                onClick={() => setClarification(null)}
                className="text-[9px] font-bold text-zinc-500 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/5 transition-all cursor-pointer active:scale-95"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Seve to add a project, certification, interest, summary rewrite..."
          rows={3}
          disabled={status === 'loading'}
          className="w-full rounded-xl pl-3.5 pr-9 py-2.5 text-[16px] lg:text-[11px] leading-relaxed text-zinc-200 placeholder-zinc-700 outline-none resize-none transition-all custom-scrollbar"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(185,28,28,0.3)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
              e.preventDefault()
              handleCommand(input.trim())
            }
          }}
        />
        <button
          onClick={() => handleCommand(input)}
          disabled={!input.trim() || status === 'loading'}
          className="absolute right-1.5 bottom-2 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors cursor-pointer rounded-lg hover:bg-white/5 active:scale-90"
        >
          {status === 'loading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Status Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-start gap-2 text-[10px] font-bold px-3 py-2 rounded-lg ${
              status === 'success'
                ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10'
                : 'text-red-400 bg-red-500/5 border border-red-500/10'
            }`}
          >
            {status === 'success' ? (
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>
      </>)}
    </div>
  )
}
