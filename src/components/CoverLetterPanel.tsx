import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ResumeData } from '../types/resume'
import { generateContent } from '../utils/aiService'
import {
  Sparkles, Copy, Printer, RefreshCw, Check, FileText,
  ChevronDown, ChevronUp, Edit3, Wand2
} from 'lucide-react'
import { useToast } from '../hooks/useToast'

interface CoverLetterPanelProps {
  resumeData: ResumeData
  jobDescription: string
  apiKey: string
  onUpdateJobDescription: (jd: string) => void
}

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Formal, corporate-ready' },
  { id: 'confident', label: 'Confident', desc: 'Direct, impactful language' },
  { id: 'enthusiastic', label: 'Enthusiastic', desc: 'Passionate, energetic tone' },
  { id: 'concise', label: 'Concise', desc: 'Brief, punchy, lean' },
] as const

type Tone = typeof TONES[number]['id']

function buildLocalCoverLetter(resumeData: ResumeData, jobDescription: string, tone: Tone): string {
  const name = resumeData.contact.fullName || 'Candidate'
  const email = resumeData.contact.email || ''
  const linkedin = resumeData.contact.linkedin || ''
  const location = resumeData.contact.location || ''
  const firstJob = resumeData.experience[0]
  const role = firstJob?.jobTitle || 'Professional'
  const company = firstJob?.company || 'your previous company'
  const summary = resumeData.summary || ''
  const topSkills = resumeData.skills.slice(0, 5).join(', ')

  const jobTitle = jobDescription
    ? (jobDescription.match(/(?:seeking|hiring|looking for|role of|position of|as a|for a)[\s:]*([A-Z][a-zA-Z\s]+?)(?:\.|,|\n)/)?.[1]?.trim() || 'this exciting role')
    : 'this exciting role'

  const toneOpener: Record<Tone, string> = {
    professional: 'I am writing to express my sincere interest in',
    confident: 'I am an ideal candidate for',
    enthusiastic: 'I am thrilled to apply for',
    concise: 'I am applying for',
  }

  const toneCloser: Record<Tone, string> = {
    professional: 'I welcome the opportunity to discuss how my background aligns with your team\'s objectives.',
    confident: 'I am confident I will deliver immediate value and am ready to discuss this further.',
    enthusiastic: 'I would love to connect and explore how I can contribute to your mission!',
    concise: 'I look forward to connecting.',
  }

  return `${name}${email ? '\n' + email : ''}${location ? ' · ' + location : ''}${linkedin ? ' · ' + linkedin : ''}

[Today's Date]

Hiring Manager
[Company Name]

Dear Hiring Manager,

${toneOpener[tone]} ${jobTitle}. With my background as ${role} at ${company}, I bring a proven track record of delivering results through ${topSkills}.

${summary ? summary + '\n\n' : ''}During my career, I have consistently demonstrated the ability to ${firstJob?.bullets?.[0] || 'drive measurable improvements across complex systems'}. My experience encompasses ${topSkills}, which I believe aligns directly with the requirements outlined${jobDescription ? ' in your job description' : ' for this position'}.

${firstJob?.bullets?.[1] ? 'Notably, I ' + firstJob.bullets[1].charAt(0).toLowerCase() + firstJob.bullets[1].slice(1) + '\n\n' : ''}${toneCloser[tone]}

Sincerely,
${name}
${email}
${linkedin}`.trim()
}

export default function CoverLetterPanel({
  resumeData,
  jobDescription,
  apiKey,
  onUpdateJobDescription,
}: CoverLetterPanelProps) {
  const { showToast } = useToast()
  const [letterText, setLetterText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTone, setSelectedTone] = useState<Tone>('professional')
  const [showJdInput, setShowJdInput] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasResume = resumeData.contact.fullName.trim() || resumeData.experience.length > 0

  const generateLetter = async () => {
    setIsGenerating(true)
    setLetterText('')

    try {
      if (apiKey?.trim()) {
        const prompt = `Write a tailored, ATS-optimized cover letter with a ${selectedTone} tone for a job application.

Resume Data:
- Candidate Name: ${resumeData.contact.fullName}
- Location: ${resumeData.contact.location}
- Email: ${resumeData.contact.email}
- LinkedIn: ${resumeData.contact.linkedin}
- Current/Recent Role: ${resumeData.experience[0]?.jobTitle || 'N/A'} at ${resumeData.experience[0]?.company || 'N/A'}
- Professional Summary: ${resumeData.summary || 'Not provided'}
- Top Skills: ${resumeData.skills.slice(0, 8).join(', ')}
- Key Achievements: ${resumeData.experience[0]?.bullets?.slice(0, 3).join('; ') || 'N/A'}

Job Description:
${jobDescription || 'No job description provided — write a general compelling cover letter.'}

Instructions:
- Write in first person, formal letter format.
- Start with contact info header, then greeting, 3-4 paragraphs, and sign-off.
- Include a [Today's Date] and [Company Name] placeholder.
- Tone: ${selectedTone}.
- Length: 250-400 words.
- Include quantified achievements where possible.
- Output ONLY the letter text, no markdown formatting, no preamble.`

        const result = await generateContent(prompt, apiKey, 'improve')
        setLetterText(result.trim())
      } else {
        // Local fallback
        await new Promise(r => setTimeout(r, 900))
        setLetterText(buildLocalCoverLetter(resumeData, jobDescription, selectedTone))
      }
    } catch {
      const fallback = buildLocalCoverLetter(resumeData, jobDescription, selectedTone)
      setLetterText(fallback)
      showToast('AI generation failed — generated using local template instead.', 'warning')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!letterText) return
    await navigator.clipboard.writeText(letterText)
    setCopied(true)
    showToast('Cover letter copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    const printWin = window.open('', '_blank')
    if (!printWin) return
    printWin.document.write(`<!DOCTYPE html><html><head><title>Cover Letter — ${resumeData.contact.fullName || 'Candidate'}</title>
    <style>
      body { font-family: Georgia, serif; margin: 40px; font-size: 14px; line-height: 1.8; color: #111; }
      pre { white-space: pre-wrap; font-family: Georgia, serif; }
    </style></head><body><pre>${letterText}</pre></body></html>`)
    printWin.document.close()
    printWin.print()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar actions */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border flex-wrap gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-red-400" />
            Cover Letter Generator
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">AI-crafted, ATS-optimized, fully editable</p>
        </div>
        {letterText && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(v => !v)}
              className={`px-2.5 py-1.5 border rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isEditing 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-zinc-900 border-border text-zinc-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              {isEditing ? 'Lock Edit' : 'Edit'}
            </button>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-border rounded-lg text-[10px] font-bold text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-border rounded-lg text-[10px] font-bold text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
              Print
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {/* Config Panel */}
        <div className="bg-zinc-900 border border-border p-5 rounded-2xl mb-4">
          
          {/* Tone Selector */}
          <div className="flex flex-col gap-2.5 mb-4">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Writing Tone
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {TONES.map((t) => {
                const isSelected = selectedTone === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTone(t.id)}
                    className={`text-left p-3 rounded-xl border flex flex-col gap-0.5 transition-all relative cursor-pointer ${
                      isSelected 
                        ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_12px_rgba(239, 68, 68,0.1)]' 
                        : 'bg-zinc-950 border-border hover:bg-zinc-950/60'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="tone-switcher-pill"
                        className="absolute inset-0 bg-red-500/5 border border-red-500/20 rounded-xl pointer-events-none"
                        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
                      />
                    )}
                    <span className={`text-[10px] font-bold relative z-10 ${isSelected ? 'text-red-400' : 'text-white'}`}>
                      {t.label}
                    </span>
                    <span className="text-[9px] text-zinc-500 leading-tight relative z-10">
                      {t.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Job Description Toggle */}
          <div className="flex flex-col gap-2 mb-4">
            <button
              type="button"
              onClick={() => setShowJdInput(v => !v)}
              className="text-muted-foreground hover:text-zinc-300 underline text-xs font-bold flex items-center justify-between p-0 bg-transparent border-0 cursor-pointer"
            >
              <span className="flex items-center gap-1 text-[11px] font-bold">
                <FileText className="w-3.5 h-3.5 text-red-400" />
                {jobDescription ? '✓ Job Description Active' : 'Paste Job Description (Optional)'}
              </span>
              {showJdInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showJdInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden mt-1"
              >
                <textarea
                  value={jobDescription}
                  onChange={e => onUpdateJobDescription(e.target.value)}
                  placeholder="Paste the target job description here to get a hyper-targeted cover letter..."
                  rows={4}
                  className="rounded-lg border border-border bg-zinc-950 p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full resize-none"
                />
              </motion.div>
            )}
          </div>

          {/* Generate Button */}
          <div className="mb-0">
            <button
              onClick={generateLetter}
              disabled={isGenerating || !hasResume}
              className="w-full h-10 bg-red-950/20 hover:bg-red-900/30 disabled:opacity-50 disabled:pointer-events-none text-red-400 hover:text-red-300 border border-red-900/40 rounded-lg text-xs font-bold transition-all shadow-[0_0_12px_rgba(224, 49, 79,0.05)] flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating your cover letter...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {letterText ? 'Regenerate Cover Letter' : 'Generate Cover Letter'}
                </>
              )}
            </button>
          </div>

          {!hasResume && (
            <p className="text-[10px] text-amber-500 text-center mt-2.5 font-bold mb-0 flex items-center justify-center gap-1 animate-pulse">
              ⚠️ Fill in at least your name and one experience entry first to generate a personalized letter.
            </p>
          )}
        </div>

        {/* Letter Output Area */}
        {isGenerating && (
          <div className="bg-zinc-900 border border-border p-5 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2 text-red-400 font-bold text-[10px] uppercase tracking-widest mb-3">
              <Sparkles className="w-4 h-4 animate-spin" />
              AI is crafting your letter...
            </div>
            {[90, 80, 85, 70, 75].map((w, i) => (
              <div key={i} className="mb-2 h-3.5 bg-zinc-950 rounded-md" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {letterText && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-border rounded-2xl overflow-hidden mb-4 shadow-xl"
          >
            {/* Paper-style header */}
            <div className="px-4 py-2.5 flex items-center justify-between bg-zinc-950 border-b border-border">
              <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Cover Letter — Ready to Send
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                {letterText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={letterText}
                onChange={e => setLetterText(e.target.value)}
                className="w-full bg-transparent border-0 text-xs text-zinc-300 leading-relaxed font-serif p-5 min-h-[400px] resize-vertical focus:outline-none focus:ring-0"
              />
            ) : (
              <pre className="select-text whitespace-pre-wrap text-xs text-zinc-300 leading-relaxed font-serif p-5 min-h-[400px] margin-0 bg-transparent border-0">
                {letterText}
              </pre>
            )}
          </motion.div>
        )}

        {/* Tips panel */}
        {!letterText && !isGenerating && (
          <div className="border border-dashed border-border bg-zinc-900/40 p-6 text-center rounded-2xl mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-500/10 border border-border mx-auto mb-3 text-red-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mb-0.5">Generate in seconds</h3>
            <p className="text-[10px] text-muted-foreground leading-normal max-w-[280px] mx-auto mb-4 font-light">
              Your cover letter will be tailored to your resume data and job description. It's fully editable and print-ready.
            </p>
            
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: '🎯', text: 'Job-targeted keywords' },
                { icon: '✍️', text: '4 tone options' },
                { icon: '🔒', text: '100% local — no upload' },
              ].map((tip, i) => (
                <div key={i} className="bg-zinc-900 border border-border p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                  <div className="text-lg">{tip.icon}</div>
                  <p className="text-[8.5px] font-bold text-zinc-400 leading-tight">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
