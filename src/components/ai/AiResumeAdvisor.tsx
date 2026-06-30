import { useState, useContext, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, Check, ChevronRight, ChevronDown, ChevronUp, X } from 'lucide-react'
import ResumeDataContextInternal from '../../context/resumeDataContextDef'
import { useAi } from '../../hooks/useAi'
import { aiComplete, PROMPTS } from '../../services/aiService'
import AiSettingsModal from './AiSettingsModal'
import { cleanAndParseJson } from '../../utils/jsonParser'

/**
 * Post-import advisor: scans resume for empty sections and offers
 * AI-powered one-click completion for each. Shows in the editor sidebar.
 */

function makeId() { return Math.random().toString(36).slice(2, 10) }

function safeParseArray(text: string): any[] | null {
  try {
    const r = cleanAndParseJson(text)
    return Array.isArray(r) ? r : null
  } catch { return null }
}

interface SuggestionTask {
  id: string
  label: string
  hint: string
  atsBoost: number
  run: () => Promise<void>
}

export default function AiResumeAdvisor({ defaultCollapsed = false }: { defaultCollapsed?: boolean }) {
  const ctx = useContext(ResumeDataContextInternal)
  const { isConfigured, config } = useAi()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [loading, setLoading] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [showSetupModal, setShowSetupModal] = useState(false)

  if (!ctx) return null
  const { resumeData, updateResumeData } = ctx
  const { experience, skills, languages, projects, certifications, summary } = resumeData
  const jobTitle = experience?.[0]?.jobTitle || ''
  const skillsList = typeof skills?.[0] === 'string' ? skills as string[] : []

  const doRun = useCallback(async (id: string, fn: () => Promise<void>) => {
    if (!config) return
    setLoading(id)
    try {
      await fn()
      setDone(prev => [...prev, id])
    } catch (e) {
      console.error('AiAdvisor error', e)
    } finally {
      setLoading(null)
    }
  }, [config])

  // ── Build task list based on what's empty ─────────────────────────────────
  const tasks: SuggestionTask[] = []

  // Languages missing
  if (!languages?.length && !done.includes('languages') && !dismissed.includes('languages')) {
    tasks.push({
      id: 'languages',
      label: 'Add Languages',
      hint: 'Most ATS systems scan for language skills',
      atsBoost: 4,
      run: async () => {
        if (!config) return
        const { prompt: p1, systemPrompt: s1 } = PROMPTS.suggestSectionContent('languages', jobTitle, skillsList)
        const raw = await aiComplete(p1, config, { systemPrompt: s1, jsonMode: true, maxTokens: 1024 })
        const arr = safeParseArray(raw)
        const langs = arr
          ? arr.slice(0, 3).map((l: any) => ({ id: makeId(), name: l.name || 'English', proficiency: l.proficiency || 'Professional' }))
          : [{ id: makeId(), name: 'English', proficiency: 'Professional' }]
        updateResumeData({ ...resumeData, languages: langs })
      }
    })
  }

  // Projects missing
  if (!projects?.length && skillsList.length >= 2 && !done.includes('projects') && !dismissed.includes('projects')) {
    tasks.push({
      id: 'projects',
      label: 'Generate Sample Project',
      hint: 'Projects differentiate you from other candidates',
      atsBoost: 6,
      run: async () => {
        if (!config) return
        const { prompt: p2, systemPrompt: s2 } = PROMPTS.suggestSectionContent('projects', jobTitle, skillsList)
        const raw = await aiComplete(p2, config, { systemPrompt: s2, jsonMode: true, maxTokens: 1024 })
        const arr = safeParseArray(raw)
        if (arr?.[0]) {
          const p = arr[0]
          updateResumeData({
            ...resumeData,
            projects: [{ id: makeId(), name: p.name || '', description: p.description || '', technologies: Array.isArray(p.technologies) ? p.technologies : [], link: '' }]
          })
        }
      }
    })
  }

  // Certifications missing
  if (!certifications?.length && skillsList.length > 0 && !done.includes('certifications') && !dismissed.includes('certifications')) {
    tasks.push({
      id: 'certifications',
      label: 'Suggest Certifications',
      hint: 'Relevant certs boost ATS keyword match rate',
      atsBoost: 7,
      run: async () => {
        if (!config) return
        const { prompt: p3, systemPrompt: s3 } = PROMPTS.suggestSectionContent('certifications', jobTitle, skillsList)
        const raw = await aiComplete(p3, config, { systemPrompt: s3, jsonMode: true, maxTokens: 1024 })
        const arr = safeParseArray(raw)
        if (arr) {
          const certs = arr.slice(0, 2).map((c: any) => ({
            id: makeId(), title: c.title || '', issuer: c.issuer || '', date: '', description: ''
          }))
          updateResumeData({ ...resumeData, certifications: certs })
        }
      }
    })
  }

  // Summary weak (< 50 chars)
  if ((!summary || summary.length < 50) && jobTitle && !done.includes('summary') && !dismissed.includes('summary')) {
    tasks.push({
      id: 'summary',
      label: 'Improve Summary',
      hint: 'A strong summary is read by 98% of recruiters',
      atsBoost: 8,
      run: async () => {
        if (!config) return
        const { prompt, systemPrompt } = PROMPTS.generateSummary(jobTitle, skillsList, 3)
        const result = await aiComplete(prompt, config, { systemPrompt, maxTokens: 1024 })
        updateResumeData({ ...resumeData, summary: result.trim() })
      }
    })
  }

  // Bullets weak or missing (< 2 bullets)
  const firstExp = experience?.[0]
  if (firstExp && (!firstExp.bullets?.length || firstExp.bullets.filter(Boolean).length < 2) && !done.includes('bullets') && !dismissed.includes('bullets')) {
    tasks.push({
      id: 'bullets',
      label: 'Generate Achievement Bullets',
      hint: 'Quantified bullets increase ATS score significantly',
      atsBoost: 10,
      run: async () => {
        if (!config) return
        const { prompt, systemPrompt } = PROMPTS.generateBullets(firstExp.jobTitle, firstExp.company || 'Company', 3)
        const raw = await aiComplete(prompt, config, { systemPrompt, maxTokens: 1024 })
        const bullets = raw.split('\n')
          .map((l: string) => l.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
          .filter(Boolean).slice(0, 3)
        const newExp = resumeData.experience.map((e, i) => i === 0 ? { ...e, bullets } : e)
        updateResumeData({ ...resumeData, experience: newExp })
      }
    })
  }

  // Nothing to do
  const visibleTasks = tasks.filter(t => !dismissed.includes(t.id) && !done.includes(t.id))
  if (!visibleTasks.length || !isConfigured) return null

  return (
    <>
      <div className="mx-3 mb-3 rounded-xl overflow-hidden" style={{ background: 'rgba(185,28,28,0.04)', border: '1px solid rgba(185,28,28,0.12)' }}>
        {/* Header */}
        <button onClick={() => setCollapsed(v => !v)} className="flex items-center gap-2 px-3 py-2.5 border-b border-[#b91c1c]/10 w-full text-left">
          <Sparkles className="w-3.5 h-3.5 text-[#b91c1c]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wide flex-1">AI Resume Advisor</span>
          {collapsed ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronUp className="w-3 h-3 text-zinc-500" />}
          <span className="text-[9px] text-[#b91c1c] font-bold">{visibleTasks.length} tip{visibleTasks.length > 1 ? 's' : ''}</span>
        </button>

        {/* Tasks */}
        {!collapsed && (<div className="divide-y divide-white/[0.03]">
          {visibleTasks.slice(0, 3).map(task => (
            <div key={task.id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-zinc-200 truncate">{task.label}</p>
                <p className="text-[9px] text-zinc-600 truncate">{task.hint}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/8 px-1.5 py-0.5 rounded-md">+{task.atsBoost}pts</span>
                {done.includes(task.id) ? (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                ) : (
                  <button
                    onClick={() => doRun(task.id, task.run)}
                    disabled={loading === task.id}
                    title="Generate with AI"
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-[#b91c1c]/10 hover:bg-[#b91c1c]/20 text-[#b91c1c] border border-[#b91c1c]/15 disabled:opacity-50"
                  >
                    {loading === task.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                <button
                  onClick={() => setDismissed(prev => [...prev, task.id])}
                  className="w-5 h-5 rounded flex items-center justify-center text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <AnimatePresence>
        {showSetupModal && <AiSettingsModal onClose={() => setShowSetupModal(false)} />}
      </AnimatePresence>
    </>
  )
}
