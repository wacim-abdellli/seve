import { useState, useContext, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, Send, Check, AlertCircle } from 'lucide-react'
import ResumeDataContextInternal from '../../context/resumeDataContextDef'
import { useAi } from '../../hooks/useAi'
import { aiComplete, PROMPTS } from '../../services/aiService'

function makeId() { return Math.random().toString(36).slice(2, 10) }

interface CopilotResponse {
  action: string
  data?: any
  message?: string
}

const QUICK_CHIPS = [
  { label: 'Add AWS Cert', cmd: 'Add AWS Solutions Architect certification' },
  { label: 'Add React Project', cmd: 'Add a React & Tailwind e-commerce portfolio project' },
  { label: 'Add Open Source Volunteer', cmd: 'Add volunteer work contributing to open source projects' },
  { label: 'Suggest Interests', cmd: 'Suggest professional interests for a modern software engineer' },
]

export default function AiChatCopilot() {
  const ctx = useContext(ResumeDataContextInternal)
  const { isConfigured, config } = useAi()

  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  if (!ctx || !isConfigured) return null
  const { resumeData, updateResumeData } = ctx

  const handleCommand = async (cmdText: string) => {
    if (!cmdText.trim() || !config) return
    setStatus('loading')
    setFeedback('')

    try {
      const responseText = await aiComplete(
        PROMPTS.copilotCommand(cmdText.trim(), JSON.stringify(resumeData)),
        config
      )

      // Parse JSON from code fence if any
      let cleaned = responseText.trim()
      const m = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (m) cleaned = m[1].trim()

      const res: CopilotResponse = JSON.parse(cleaned)

      if (res.action === 'unknown') {
        setStatus('error')
        setFeedback(res.message || "I didn't quite understand that command. Try asking to add a project, certification, volunteer experience, language, or to update your summary.")
        return
      }

      // Handle actions
      const updated = { ...resumeData }
      let actionLabel = ''

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
            actionLabel = `Added Project: "${res.data.name}" ✓`
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
            actionLabel = `Added Certification: "${res.data.title}" ✓`
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
            actionLabel = `Added Award: "${res.data.title}" ✓`
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
            actionLabel = `Added Volunteer role at ${res.data.organization} ✓`
          }
          break

        case 'add_language':
          if (res.data) {
            updated.languages = [...(updated.languages || []), {
              id: makeId(),
              name: res.data.name || 'Language',
              proficiency: res.data.proficiency || 'Professional',
            }]
            actionLabel = `Added Language: ${res.data.name} ✓`
          }
          break

        case 'update_summary':
          if (typeof res.data === 'string') {
            updated.summary = res.data
            actionLabel = 'Updated profile summary ✓'
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
            actionLabel = `Added Experience at ${res.data.company} ✓`
          }
          break

        case 'add_skills':
          if (Array.isArray(res.data)) {
            const currentSkills = new Set(updated.skills || [])
            res.data.forEach(s => currentSkills.add(String(s).trim()))
            updated.skills = Array.from(currentSkills)
            actionLabel = `Added skills: ${res.data.join(', ')} ✓`
          }
          break

        case 'add_interest':
          if (res.data) {
            updated.interests = [...(updated.interests || []), {
              id: makeId(),
              name: res.data.name || 'Interest',
              keywords: Array.isArray(res.data.keywords) ? res.data.keywords : [],
            }]
            actionLabel = `Added Interest: ${res.data.name} ✓`
          }
          break

        case 'update_contact':
          if (res.data) {
            updated.contact = {
              ...(updated.contact || { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '' }),
              ...res.data
            }
            const fieldsList = Object.keys(res.data).join(', ')
            actionLabel = `Updated contact details (${fieldsList}) ✓`
          }
          break

        default:
          throw new Error('Unsupported action parsed')
      }

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

  return (
    <div
      ref={containerRef}
      className="mx-3 mb-3 p-3.5 rounded-xl space-y-3"
      style={{
        background: 'linear-gradient(180deg, rgba(185,28,28,0.02) 0%, rgba(0,0,0,0) 100%)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-[#b91c1c]/10 border border-[#b91c1c]/25 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-[#b91c1c]" />
        </div>
        <span className="text-[10px] font-bold text-white uppercase tracking-wider flex-1">AI Copilot</span>
      </div>

      <div className="relative">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Seve to add a project, certification, interest, summary rewrite..."
          rows={3}
          disabled={status === 'loading'}
          className="w-full rounded-xl pl-3.5 pr-9 py-2.5 text-[11px] leading-relaxed text-zinc-200 placeholder-zinc-700 outline-none resize-none transition-all custom-scrollbar"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '16px' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(185,28,28,0.3)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleCommand(input)
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

      {/* Suggestion Chips */}
      {status !== 'loading' && !feedback && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => { setInput(chip.cmd); handleCommand(chip.cmd) }}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 bg-white/[0.02] border border-white/5 hover:border-white/10 px-3 py-1.5 min-h-[32px] rounded-lg transition-all cursor-pointer active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

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
    </div>
  )
}
