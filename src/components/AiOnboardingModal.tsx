import { createPortal } from 'react-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Copy, Check, FileCode, CheckCircle2, AlertCircle, X, Brain, ArrowRight } from 'lucide-react'
import type { ResumeData } from '../types/resume'
import { normalizeResumeData } from '../utils/resumeNormalizer'

interface AiOnboardingModalProps {
  onClose: () => void
  onImport: (data: ResumeData) => void
}

const EMPTY_RESUME_TEMPLATE = {
  contact: { fullName: 'John Doe', email: 'john@example.com', phone: '+1234567890', linkedin: 'linkedin.com/in/johndoe', location: 'New York, NY', website: 'johndoe.com' },
  summary: 'Professional summary of your career and skills.',
  experience: [{ id: 'exp-1', jobTitle: 'Software Engineer', company: 'Tech Inc', location: 'San Francisco, CA', startDate: '2022-01', endDate: 'Present', current: true, bullets: ['Developed cloud-based applications.', 'Collaborated with cross-functional teams.'] }],
  education: [{ id: 'edu-1', degree: 'B.S. Computer Science', school: 'State University', location: 'Boston, MA', graduationDate: '2021-05', gpa: '3.8' }],
  skills: ['React', 'TypeScript', 'Node.js', 'TailwindCSS'],
  languages: [{ id: 'lang-1', name: 'English', proficiency: 'Native' }],
  projects: [{ id: 'proj-1', name: 'Resume Builder', description: 'Interactive AI-powered resume builder.', technologies: ['React', 'TypeScript'] }],
  awards: [{ id: 'award-1', title: 'Outstanding Dev', awarder: 'Tech Inc', date: '2023-12', description: 'Awarded for exceptional product delivery.' }],
  certifications: [{ id: 'cert-1', title: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', date: '2022-06', description: '' }],
  interests: [{ id: 'int-1', name: 'Open Source Coding', keywords: ['GitHub', 'React'] }],
  publications: [],
  references: [],
  volunteer: []
}

export default function AiOnboardingModal({ onClose, onImport }: AiOnboardingModalProps) {
  const [copiedTemplate, setCopiedTemplate] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ResumeData | null>(null)

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(EMPTY_RESUME_TEMPLATE, null, 2))
    setCopiedTemplate(true)
    setTimeout(() => setCopiedTemplate(false), 2000)
  }

  const getAiPrompt = () => {
    return `Here is a structured JSON template representing a resume schema:
${JSON.stringify(EMPTY_RESUME_TEMPLATE, null, 2)}

And here is my old resume/CV details:
[PASTE YOUR OLD CV TEXT HERE]

Instructions for the AI:
1. Extract all details from my old CV and format them to match this exact JSON template structure.
2. Fill in the fields accurately, do not omit any work experience bullet points or other details.
3. Make sure the output is strictly valid JSON format. Return ONLY the JSON object. Do not add markdown formatting backticks (like \`\`\`json) or extra conversational text outside the JSON.`
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getAiPrompt())
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const handlePasteChange = (val: string) => {
    setPasteValue(val)
    if (!val.trim()) {
      setValidationError(null)
      setParsedData(null)
      return
    }

    try {
      // Clean up markdown block if the AI wrapped it in ```json ... ```
      let cleaned = val.trim()
      if (cleaned.startsWith('```')) {
        const lines = cleaned.split('\n')
        if (lines[0].startsWith('```')) lines.shift()
        if (lines[lines.length - 1].startsWith('```')) lines.pop()
        cleaned = lines.join('\n').trim()
      }

      const raw = JSON.parse(cleaned)
      if (!raw || typeof raw !== 'object') {
        throw new Error('JSON is not an object.')
      }

      const normalized = normalizeResumeData(raw)
      setParsedData(normalized)
      setValidationError(null)
    } catch (err) {
      setParsedData(null)
      setValidationError(err instanceof Error ? err.message : 'Invalid JSON format')
    }
  }

  const handleImportClick = () => {
    if (parsedData) {
      onImport(parsedData)
      localStorage.setItem('seve_ai_onboarded', 'true')
      onClose()
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('seve_ai_onboarded', 'true')
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={handleDismiss}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, y: 15, filter: 'blur(8px)' }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
        className="relative w-full max-w-[620px] bg-[#0c0d12] border border-[#e0314f]/25 rounded-2xl shadow-[0_0_50px_rgba(224,49,79,0.08)] p-6 md:p-8 overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Glow ambient */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#e0314f]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5 flex-shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e0314f]/15 border border-[#e0314f]/35 flex items-center justify-center text-[#e0314f] shrink-0 shadow-lg shadow-[#e0314f]/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight uppercase font-display flex items-center gap-1.5">
                AI Resume Fast Fill
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Let AI build your resume in seconds using our JSON template</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Step list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar mb-6">
          {/* Step 1 */}
          <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-3 relative group hover:border-[#e0314f]/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-[#e0314f] shrink-0 font-mono">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Get the Resume Schema</h4>
                <p className="text-[11px] text-zinc-400 leading-normal mt-0.5 font-light">
                  Copy our standardized JSON template structure. This outlines exactly what sections and fields Seve supports.
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyTemplate}
              className={`w-full h-9 rounded-lg flex items-center justify-center gap-2 text-[11px] font-bold transition-all cursor-pointer border ${
                copiedTemplate
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850'
              }`}
            >
              {copiedTemplate ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied Template!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy JSON Schema Template
                </>
              )}
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-3 relative group hover:border-purple-500/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-purple-400 shrink-0 font-mono">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instruct your AI</h4>
                <p className="text-[11px] text-zinc-400 leading-normal mt-0.5 font-light">
                  Copy our custom AI prompt and paste it into ChatGPT, Claude, Gemini, or any AI. Paste your old CV text at the end.
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyPrompt}
              className={`w-full h-9 rounded-lg flex items-center justify-center gap-2 text-[11px] font-bold transition-all cursor-pointer border ${
                copiedPrompt
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850'
              }`}
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied Prompt & Instructions!
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" /> Copy AI Instruction Prompt
                </>
              )}
            </button>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-3 relative group hover:border-[#e0314f]/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-[#e0314f] shrink-0 font-mono">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Paste the Result Here</h4>
                <p className="text-[11px] text-zinc-400 leading-normal mt-0.5 font-light">
                  Once your AI generates the populated JSON code, copy it and paste it into the box below.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <textarea
                value={pasteValue}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="Paste AI-generated JSON code here..."
                className="w-full h-32 bg-zinc-950/50 border border-zinc-850 rounded-lg p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-[#e0314f]/50 resize-none font-mono custom-scrollbar"
              />

              {validationError && (
                <div className="flex items-center gap-1.5 text-[10px] text-rose-455 font-bold bg-rose-500/5 border border-rose-950/30 p-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Invalid JSON: {validationError}</span>
                </div>
              )}

              {parsedData && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-450 font-bold bg-emerald-500/5 border border-emerald-950/30 p-2 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Valid CV schema parsed successfully! Ready to import.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-900/60 pt-4 flex flex-col sm:flex-row gap-2 flex-shrink-0 relative font-display">
          <button
            onClick={handleDismiss}
            className="flex-1 h-10 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-450 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Start Manual (Scratch)
          </button>
          <button
            onClick={handleImportClick}
            disabled={!parsedData}
            className={`flex-1 h-10 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              parsedData
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/20 active:scale-98'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-550 cursor-not-allowed'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Import AI JSON Resume
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
