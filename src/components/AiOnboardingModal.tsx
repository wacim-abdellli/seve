import { createPortal } from 'react-dom'
import { useState, useEffect, useCallback, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Check, X, ArrowRight, Loader2,
  User, Briefcase, GraduationCap, Code2,
  ChevronRight, FileCode, Copy,
  Trophy, Globe, CheckCircle2, AlertCircle
} from 'lucide-react'
import type { ResumeData, Experience, Education, Language, Certification, Project } from '../types/resume'
import { normalizeResumeData } from '../utils/resumeNormalizer'
import { useAi } from '../hooks/useAi'
import { aiComplete, PROMPTS } from '../services/aiService'
import AiSettingsModal from './ai/AiSettingsModal'
import ResumeDataContextInternal from '../context/resumeDataContextDef'

interface AiOnboardingModalProps {
  onClose: () => void
  onImport: (data: ResumeData) => void
}

function makeId() { return Math.random().toString(36).slice(2, 10) }

function parseJson(val: string): ResumeData {
  let cleaned = val.trim()
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) cleaned = match[1].trim()

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  const raw = JSON.parse(cleaned)
  if (!raw || typeof raw !== 'object') throw new Error('Not a valid JSON object.')
  if (raw.resumes && raw.selectedResumeId) {
    const r = raw.resumes[raw.selectedResumeId] || Object.values(raw.resumes)[0] as any
    if (r?.resumeData) return normalizeResumeData(r.resumeData)
  }
  if (raw.resumeData) {
    return normalizeResumeData(raw.resumeData)
  }
  return normalizeResumeData(raw)
}

function safeParseArray(text: string): any[] | null {
  try {
    let cleaned = text.trim()
    const m = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (m) cleaned = m[1].trim()
    const r = JSON.parse(cleaned)
    return Array.isArray(r) ? r : null
  } catch { return null }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', hint, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        {label}{required && <span className="text-[#b91c1c] ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(185,28,28,0.45)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      />
      {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
    </div>
  )
}

const LANG_SUGGESTIONS = ['English', 'French', 'Arabic', 'Spanish', 'German', 'Chinese', 'Portuguese']

// ═══════════════════════════════════════════════════════════════════════════════
export default function AiOnboardingModal({ onClose, onImport }: AiOnboardingModalProps) {
  const { isConfigured, config } = useAi()
  const ctx = useContext(ResumeDataContextInternal)
  const existing = ctx?.resumeData

  const [tab, setTab] = useState<'wizard' | 'json'>('wizard')
  const [showSetupModal, setShowSetupModal] = useState(false)

  type Step = 'contact' | 'role' | 'extras' | 'building'
  const [step, setStep] = useState<Step>('contact')

  // Pre-fill from existing resume data
  const [name, setName] = useState(existing?.contact?.fullName || '')
  const [email, setEmail] = useState(existing?.contact?.email || '')
  const [phone, setPhone] = useState(existing?.contact?.phone || '')
  const [location, setLocation] = useState(existing?.contact?.location || '')
  const [linkedin, setLinkedin] = useState(existing?.contact?.linkedin || '')

  const existingExp = existing?.experience?.[0]
  const [jobTitle, setJobTitle] = useState(existingExp?.jobTitle || '')
  const [company, setCompany] = useState(existingExp?.company || '')
  const [years, setYears] = useState('')
  const [wins, setWins] = useState(existingExp?.bullets?.filter(Boolean).join('. ') || '')

  const existingEdu = existing?.education?.[0]
  const [degree, setDegree] = useState(existingEdu?.degree || '')
  const [school, setSchool] = useState(existingEdu?.school || '')

  const existingSkills = Array.isArray(existing?.skills) ? (existing?.skills as string[]).join(', ') : ''
  const [skillsRaw, setSkillsRaw] = useState(existingSkills)

  const existingLangs = existing?.languages?.map((l: any) => ({ name: l.name, proficiency: l.proficiency || 'Professional' })) || []
  const [selectedLangs, setSelectedLangs] = useState<{name: string; proficiency: string}[]>(existingLangs)

  // Auto-generation options
  const [autoGenProjects, setAutoGenProjects] = useState(true)
  const [autoGenCerts, setAutoGenCerts] = useState(true)
  const [autoGenAwards, setAutoGenAwards] = useState(true)
  const [autoGenVolunteer, setAutoGenVolunteer] = useState(true)
  const [autoGenInterests, setAutoGenInterests] = useState(true)

  // Build
  const [buildLog, setBuildLog] = useState<{msg: string; status: 'loading'|'done'|'warn'}[]>([])
  const [buildError, setBuildError] = useState<string | null>(null)

  // JSON tab
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ResumeData | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  const dismiss = () => { localStorage.setItem('seve_ai_onboarded', 'true'); onClose() }

  const contactOk = name.trim().length > 1 && email.includes('@')
  const roleOk = jobTitle.trim().length > 1

  const toggleLang = (name: string) => {
    setSelectedLangs(prev => prev.find(l => l.name === name)
      ? prev.filter(l => l.name !== name)
      : [...prev, { name, proficiency: 'Professional' }]
    )
  }


  // ── Build ─────────────────────────────────────────────────────────────────
  const runBuild = useCallback(async () => {
    setStep('building')
    setBuildLog([])
    setBuildError(null)

    const log = (msg: string, status: 'loading'|'done'|'warn' = 'loading') =>
      setBuildLog(prev => [...prev, { msg, status }])
    const updateLast = (msg: string, status: 'done'|'warn') =>
      setBuildLog(prev => prev.map((l, i) => i === prev.length - 1 ? { msg, status } : l))

    const skillsList = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)

    let summary = ''
    let bullets: string[] = []
    let extraCerts: Certification[] = []
    let extraProjects: Project[] = []
    let extraAwards: any[] = []
    let extraVolunteer: any[] = []
    let extraInterests: any[] = []

    try {
      if (config && isConfigured) {
        // 1. Summary
        log('Writing professional summary...')
        try {
          summary = await aiComplete(PROMPTS.generateSummary(jobTitle, skillsList, parseInt(years) || 3), config)
          updateLast('Summary written ✓', 'done')
        } catch { updateLast('Summary skipped — write it later', 'warn') }

        // 2. Bullets — use REAL wins if provided, otherwise generic
        if (jobTitle) {
          log(`Crafting achievement bullets for ${company || jobTitle}...`)
          try {
            const prompt = wins.trim()
              ? PROMPTS.generateBulletsFromWins(jobTitle, company || 'Company', wins.trim())
              : PROMPTS.generateBullets(jobTitle, company || 'Company', 3)
            const raw = await aiComplete(prompt, config)
            bullets = raw.split('\n')
              .map(l => l.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
              .filter(Boolean).slice(0, 3)
            updateLast('Achievements crafted ✓', 'done')
          } catch { updateLast('Bullets skipped — add them later', 'warn') }
        }

        // 3. Projects
        if (autoGenProjects && skillsList.length > 0) {
          log('Generating sample projects...')
          try {
            const raw = await aiComplete(PROMPTS.suggestSectionContent('projects', jobTitle, skillsList), config)
            const arr = safeParseArray(raw)
            if (arr) {
              extraProjects = arr.slice(0, 2).map((p: any) => ({
                id: makeId(), name: p.name || 'Project', description: p.description || '', technologies: Array.isArray(p.technologies) ? p.technologies : [], link: ''
              }))
              updateLast('Projects generated ✓', 'done')
            }
          } catch { updateLast('Projects skipped', 'warn') }
        }

        // 4. Certifications
        if (autoGenCerts && skillsList.length > 0) {
          log('Finding certifications...')
          try {
            const raw = await aiComplete(PROMPTS.suggestSectionContent('certifications', jobTitle, skillsList), config)
            const arr = safeParseArray(raw)
            if (arr) {
              extraCerts = arr.slice(0, 2).map((c: any) => ({
                id: makeId(), title: c.title || 'Certification', issuer: c.issuer || '', date: '', description: ''
              }))
              updateLast('Certifications suggestions added ✓', 'done')
            }
          } catch { updateLast('Certifications skipped', 'warn') }
        }

        // 5. Awards
        if (autoGenAwards) {
          log('Generating awards...')
          try {
            const raw = await aiComplete(PROMPTS.suggestSectionContent('awards', jobTitle, skillsList), config)
            const arr = safeParseArray(raw)
            if (arr) {
              extraAwards = arr.slice(0, 1).map((a: any) => ({
                id: makeId(), title: a.title || 'Award', awarder: a.awarder || '', date: '', description: a.description || ''
              }))
              updateLast('Awards suggested ✓', 'done')
            }
          } catch { updateLast('Awards skipped', 'warn') }
        }

        // 6. Volunteer
        if (autoGenVolunteer) {
          log('Generating volunteer work...')
          try {
            const raw = await aiComplete(PROMPTS.suggestSectionContent('volunteer', jobTitle, skillsList), config)
            const arr = safeParseArray(raw)
            if (arr) {
              extraVolunteer = arr.slice(0, 1).map((v: any) => ({
                id: makeId(), organization: v.organization || 'Volunteer Org', location: v.location || '', period: v.period || '', description: v.description || ''
              }))
              updateLast('Volunteer work generated ✓', 'done')
            }
          } catch { updateLast('Volunteer work skipped', 'warn') }
        }

        // 7. Interests
        if (autoGenInterests) {
          log('Suggesting tech interests...')
          try {
            const raw = await aiComplete(PROMPTS.suggestSectionContent('interests', jobTitle, skillsList), config)
            const arr = safeParseArray(raw)
            if (arr) {
              extraInterests = arr.slice(0, 2).map((i: any) => ({
                id: makeId(), name: i.name || 'Interest', keywords: Array.isArray(i.keywords) ? i.keywords : []
              }))
              updateLast('Interests suggested ✓', 'done')
            }
          } catch { updateLast('Interests skipped', 'warn') }
        }
      }

      log('Assembling your resume...', 'loading')

      const experience: Experience[] = jobTitle ? [{
        id: makeId(), jobTitle: jobTitle.trim(), company: company.trim(), location: '',
        startDate: '', endDate: '', current: true,
        bullets: bullets.length ? bullets : [''],
      }] : []

      const education: Education[] = (degree || school) ? [{
        id: makeId(), degree: degree.trim(), school: school.trim(),
        location: '', graduationDate: '', gpa: '',
      }] : []

      const langs: Language[] = selectedLangs.length
        ? selectedLangs.map(l => ({ id: makeId(), name: l.name, proficiency: l.proficiency as any }))
        : [{ id: makeId(), name: 'English', proficiency: 'Professional' }]

      const resumeData: ResumeData = {
        contact: { fullName: name.trim(), email: email.trim(), phone: phone.trim(), location: location.trim(), linkedin: linkedin.trim(), website: '' },
        summary: summary.trim(),
        experience,
        education,
        skills: skillsList,
        languages: langs,
        projects: extraProjects,
        awards: extraAwards,
        certifications: extraCerts,
        interests: extraInterests,
        publications: [],
        references: [],
        volunteer: extraVolunteer,
      }

      updateLast('Resume ready! ✓', 'done')
      await new Promise(r => setTimeout(r, 500))
      onImport(normalizeResumeData(resumeData))
      localStorage.setItem('seve_ai_onboarded', 'true')
      onClose()
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : 'Something went wrong.')
      setStep('extras')
    }
  }, [config, isConfigured, name, email, phone, location, linkedin, jobTitle, company, years, wins, degree, school, skillsRaw, selectedLangs, autoGenProjects, autoGenCerts, autoGenAwards, autoGenVolunteer, autoGenInterests, onImport, onClose])

  // ── JSON tab ──────────────────────────────────────────────────────────────
  const handlePasteChange = (val: string) => {
    setPasteValue(val)
    if (!val.trim()) { setPasteError(null); setParsedData(null); return }
    try { setParsedData(parseJson(val)); setPasteError(null) }
    catch (err) { setParsedData(null); setPasteError(err instanceof Error ? err.message : 'Invalid JSON') }
  }

  const TEMPLATE = { contact: { fullName: '', email: '', phone: '', linkedin: '', location: '' }, summary: '', experience: [{ id: 'e1', jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [] }], education: [{ id: 'd1', degree: '', school: '', location: '', graduationDate: '' }], skills: [] }

  // ── Render ────────────────────────────────────────────────────────────────
  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }} transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
        className="relative z-10 w-full max-w-[500px] rounded-2xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg,#131318 0%,#0e0e12 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#b91c1c]/15 border border-[#b91c1c]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#b91c1c]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Quick Resume Setup</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {tab === 'wizard' ? 'Fill key details — AI builds the rest' : 'Paste JSON from ChatGPT / Claude'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab(t => t === 'wizard' ? 'json' : 'wizard')}
              className="text-[10px] font-bold text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5">
              {tab === 'wizard' ? 'JSON mode ›' : '‹ Wizard'}
            </button>
            <button onClick={dismiss} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── WIZARD ── */}
        {tab === 'wizard' && step !== 'building' && (
          <>
            {/* Step pills */}
            <div className="flex items-center gap-1 px-5 pt-3 pb-1 flex-shrink-0">
              {[{id:'contact',label:'You',icon:User},{id:'role',label:'Role',icon:Briefcase},{id:'extras',label:'More',icon:Trophy}].map((s, i, arr) => {
                const steps = ['contact','role','extras']
                const idx = steps.indexOf(step)
                const sIdx = steps.indexOf(s.id)
                const done = sIdx < idx
                const active = s.id === step
                return (
                  <div key={s.id} className="flex items-center gap-1">
                    <button
                      onClick={() => done ? setStep(s.id as Step) : undefined}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${done ? 'cursor-pointer text-emerald-400 hover:bg-emerald-500/5' : active ? 'text-white cursor-default' : 'text-zinc-700 cursor-not-allowed'}`}
                      style={active ? { background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)' } : {}}
                    >
                      {done ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                      {s.label}
                    </button>
                    {i < arr.length - 1 && <div className="w-4 h-px bg-zinc-800" />}
                  </div>
                )
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              <AnimatePresence mode="wait">

                {/* STEP 1: Contact */}
                {step === 'contact' && (
                  <motion.div key="contact" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                    <p className="text-[11px] text-zinc-500 mb-1">The basics — takes 30 seconds.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><Field label="Full Name" value={name} onChange={setName} placeholder="Sarah Mitchell" required /></div>
                      <Field label="Email" value={email} onChange={setEmail} placeholder="sarah@email.com" type="email" required />
                      <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 000 1234" />
                      <Field label="City, Country" value={location} onChange={setLocation} placeholder="New York, US" />
                      <Field label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/sarah" />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Role */}
                {step === 'role' && (
                  <motion.div key="role" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                    <Field label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="Senior Software Engineer" required />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Company" value={company} onChange={setCompany} placeholder="Google" />
                      <Field label="Years of experience" value={years} onChange={setYears} placeholder="4" />
                    </div>

                    {/* KEY field: real wins */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        Key Wins <span className="text-zinc-700 font-normal normal-case">(optional but makes AI much better)</span>
                      </label>
                      <textarea
                        value={wins}
                        onChange={e => setWins(e.target.value)}
                        placeholder={"e.g. Reduced API load time by 40%, led team of 5, shipped mobile app with 50k users, cut infra costs by $20k/yr"}
                        rows={3}
                        className="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white placeholder-zinc-700 outline-none resize-none transition-all custom-scrollbar"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(185,28,28,0.45)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                      <p className="text-[10px] text-zinc-600">Your real numbers → no fake placeholders. Type anything — AI polishes it.</p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Extras */}
                {step === 'extras' && (
                  <motion.div key="extras" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">

                    {/* Education */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <GraduationCap className="w-3 h-3" /> Education <span className="text-zinc-700 font-normal normal-case">(optional)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Degree" value={degree} onChange={setDegree} placeholder="B.Sc. Computer Science" />
                        <Field label="School" value={school} onChange={setSchool} placeholder="MIT" />
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <Code2 className="w-3 h-3" /> Skills
                      </div>
                      <textarea
                        value={skillsRaw}
                        onChange={e => setSkillsRaw(e.target.value)}
                        placeholder="React, TypeScript, Node.js, PostgreSQL, AWS, Docker..."
                        rows={2}
                        className="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white placeholder-zinc-700 outline-none resize-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(185,28,28,0.45)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>

                    {/* Languages */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <Globe className="w-3 h-3" /> Languages
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {LANG_SUGGESTIONS.map(lang => {
                          const selected = selectedLangs.find(l => l.name === lang)
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => toggleLang(lang)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                                selected
                                  ? 'bg-[#b91c1c]/10 border-[#b91c1c]/30 text-[#b91c1c]'
                                  : 'border-white/7 text-zinc-500 hover:text-zinc-300 hover:border-white/15'
                              }`}
                              style={selected ? {} : { background: 'rgba(255,255,255,0.02)' }}
                            >
                              {selected && <Check className="w-2.5 h-2.5" />}
                              {lang}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* AI Auto-Generation Options */}
                    {isConfigured && (
                      <div className="rounded-xl p-3.5 space-y-2.5" style={{ background: 'rgba(185,28,28,0.03)', border: '1px solid rgba(185,28,28,0.10)' }}>
                        <p className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-widest">AI Auto-Build Options</p>
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          {[
                            { id: 'projects', label: 'Sample Projects', val: autoGenProjects, set: setAutoGenProjects, hint: 'Build 2 projects' },
                            { id: 'certs', label: 'Relevant Certs', val: autoGenCerts, set: setAutoGenCerts, hint: 'Suggest 2 certs' },
                            { id: 'awards', label: 'Industry Awards', val: autoGenAwards, set: setAutoGenAwards, hint: 'Suggest 1 award' },
                            { id: 'volunteer', label: 'Volunteer Work', val: autoGenVolunteer, set: setAutoGenVolunteer, hint: 'Add 1 tech role' },
                            { id: 'interests', label: 'Tech Interests', val: autoGenInterests, set: setAutoGenInterests, hint: 'Optimize keywords' },
                          ].map(opt => (
                            <label key={opt.id} className="flex items-start gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={opt.val}
                                onChange={e => opt.set(e.target.checked)}
                                className="mt-0.5 accent-[#b91c1c] rounded border-zinc-800 bg-zinc-950"
                              />
                              <div>
                                <p className="text-[11px] font-bold text-zinc-300 leading-none">{opt.label}</p>
                                <p className="text-[9px] text-zinc-600 mt-0.5">{opt.hint}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {buildError && (
                      <div className="flex items-center gap-2 text-[11px] text-red-400 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {buildError}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3 border-t border-white/5 flex items-center gap-2 flex-shrink-0">
              {step === 'contact'
                ? <button onClick={dismiss} className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-white transition-colors cursor-pointer">Skip</button>
                : <button onClick={() => setStep(step === 'extras' ? 'role' : 'contact')}
                    className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
                    ← Back
                  </button>
              }
              <div className="flex-1" />
              {step !== 'extras' ? (
                <button
                  onClick={() => setStep(step === 'contact' ? 'role' : 'extras')}
                  disabled={step === 'contact' && !contactOk}
                  className={`h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    step === 'contact' && !contactOk ? 'text-zinc-600 cursor-not-allowed' : 'bg-[#b91c1c] hover:bg-[#c62828] text-white active:scale-[0.97]'
                  }`}
                  style={step === 'contact' && !contactOk ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } : {}}
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={runBuild}
                  disabled={!contactOk || !roleOk}
                  className={`h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    contactOk && roleOk ? 'bg-[#b91c1c] hover:bg-[#c62828] text-white shadow-lg shadow-rose-950/20 active:scale-[0.97]' : 'text-zinc-600 cursor-not-allowed'
                  }`}
                  style={!contactOk || !roleOk ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } : {}}
                >
                  {isConfigured ? <><Sparkles className="w-3.5 h-3.5" />Build with AI</> : <>Build Resume <ArrowRight className="w-3.5 h-3.5" /></>}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── BUILDING ── */}
        {tab === 'wizard' && step === 'building' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#b91c1c]/10 border border-[#b91c1c]/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#b91c1c] animate-pulse" />
            </div>
            <div className="w-full max-w-[300px] space-y-2">
              {buildLog.map((entry, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 text-[11px] ${entry.status === 'done' ? 'text-emerald-400' : entry.status === 'warn' ? 'text-amber-400' : 'text-zinc-400'}`}
                >
                  {entry.status === 'loading' && i === buildLog.length - 1 && <Loader2 className="w-3 h-3 animate-spin text-[#b91c1c] shrink-0" />}
                  {entry.status === 'done' && <Check className="w-3 h-3 shrink-0" />}
                  {entry.status === 'warn' && <span className="text-amber-400 shrink-0">!</span>}
                  {entry.msg}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── JSON TAB ── */}
        {tab === 'json' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar">
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Use ChatGPT or Claude to convert your existing CV to JSON. Copy the prompt, paste your CV, paste the result here.
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Convert my CV below into this JSON structure. Return ONLY valid JSON, no markdown:\n\n${JSON.stringify(TEMPLATE, null, 2)}\n\nMy CV:\n[PASTE YOUR CV TEXT HERE]`)
                  setCopiedPrompt(true); setTimeout(() => setCopiedPrompt(false), 2000)
                }}
                className={`w-full h-9 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all cursor-pointer border ${copiedPrompt ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-zinc-400 hover:text-white border-white/7'}`}
                style={copiedPrompt ? {} : { background: 'rgba(255,255,255,0.03)' }}
              >
                {copiedPrompt ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Prompt for ChatGPT/Claude</>}
              </button>
              <textarea
                value={pasteValue} onChange={e => handlePasteChange(e.target.value)}
                placeholder='{"contact":{"fullName":"..."},...}'
                rows={8}
                className="w-full rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 placeholder-zinc-700 outline-none resize-none font-mono custom-scrollbar"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              />
              {pasteError && <div className="flex items-start gap-2 text-[10px] text-red-400"><AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /><span>{pasteError}</span></div>}
              {parsedData && <div className="flex items-center gap-2 text-[10px] text-emerald-400"><CheckCircle2 className="w-3 h-3 shrink-0" />Ready — {parsedData.contact?.fullName || 'Resume parsed'}</div>}
            </div>
            <div className="px-5 pb-5 pt-3 border-t border-white/5 flex items-center gap-2 flex-shrink-0">
              <button onClick={dismiss} className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-white transition-colors cursor-pointer">Skip</button>
              <div className="flex-1" />
              <button
                onClick={() => { if (parsedData) { onImport(parsedData); localStorage.setItem('seve_ai_onboarded', 'true'); onClose() } }}
                disabled={!parsedData}
                className={`h-9 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${parsedData ? 'bg-[#b91c1c] hover:bg-[#c62828] text-white active:scale-[0.97]' : 'text-zinc-600 cursor-not-allowed'}`}
                style={!parsedData ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } : {}}
              >
                <FileCode className="w-3.5 h-3.5" /> Import Resume <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {showSetupModal && <AiSettingsModal onClose={() => setShowSetupModal(false)} />}
      </AnimatePresence>
    </div>,
    document.body
  )
}
