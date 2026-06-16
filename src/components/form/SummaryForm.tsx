import { useState } from 'react'
import { generateContent } from '../../utils/aiService'
import { Sparkles, RefreshCw } from 'lucide-react'
import { useToast } from '../../hooks/useToast'

interface SummaryFormProps {
  summary: string
  apiKey: string
  onChange: (value: string) => void
}

export default function SummaryForm({ summary, apiKey, onChange }: SummaryFormProps) {
  const { showToast } = useToast()
  const [loadingType, setLoadingType] = useState<'write' | 'improve' | null>(null)

  const handleAiAction = async (type: 'write' | 'improve') => {
    if (!apiKey || !apiKey.trim()) {
      showToast('Google Gemini API Key is required. Please set it in Settings (gear icon).', 'warning')
      return
    }
    setLoadingType(type)
    try {
      let prompt = ''
      if (type === 'write') {
        prompt = 'Write a professional, 3-sentence summary for a resume. Target role: Software Engineer.'
      } else {
        prompt = summary.trim() ? summary : 'I am looking for a job in technology.'
      }
      
      const result = await generateContent(prompt, apiKey, type === 'write' ? 'summary' : 'improve')
      onChange(result)
      showToast(type === 'write' ? 'AI Summary generated!' : 'Summary optimized!', 'success')
    } catch (e: any) {
      console.error('AI Summary error:', e)
      if (e.message === 'API_KEY_REQUIRED') {
        showToast('Google Gemini API Key is required. Please set it in Settings.', 'warning')
      } else {
        showToast('AI request failed. Please check your settings.', 'error')
      }
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="flex flex-col h-full font-sans select-text">
      {/* AI action bar — ONE place, top of content */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => handleAiAction('write')}
          disabled={loadingType !== null}
          className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[12px] font-medium px-3 py-2 rounded-lg flex-1 shadow-sm shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          type="button"
        >
          {loadingType === 'write' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>AI Write</span>
        </button>
        <button 
          onClick={() => handleAiAction('improve')}
          disabled={loadingType !== null || !summary.trim()}
          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[12px] font-medium px-3 py-2 rounded-lg flex-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          type="button"
        >
          {loadingType === 'improve' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span>AI Improve</span>
        </button>
      </div>

      {/* Textarea — no label, placeholder explains it */}
      <textarea
        value={summary}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. Senior Software Engineer with 8+ years of experience leading cross-functional teams and building high-scale distributed systems. Expert in React, Node.js, and cloud architecture (AWS). Boosted platform performance by 40%."
        className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-[14px] text-zinc-200 leading-relaxed placeholder:text-zinc-650 resize-none focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/10 transition-all"
      />

      {/* Character count — inline, right-aligned, subtle */}
      <div className="flex justify-between items-center mt-2 flex-shrink-0">
        <span className="text-[11px] text-zinc-500">
          Aim for 300–500 characters
        </span>
        <span className={`text-[11px] font-mono ${
          summary.length > 500 
            ? 'text-red-400 font-bold' 
            : summary.length >= 300 
              ? 'text-emerald-400 font-bold' 
              : 'text-zinc-600'
        }`}>
          {summary.length} / 500
        </span>
      </div>

      {/* Tips card — only show if summary is empty */}
      {!summary && (
        <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-[12px] text-zinc-400 font-medium mb-2 uppercase tracking-wider text-[10px]">
            What makes a great summary:
          </p>
          <ul className="space-y-1.5">
            {[
              'Start with your job title + years of exp',
              'Mention 2–3 core strengths or skills',
              'End with your goal or value to the company',
              'Keep it under 4 sentences',
              'Never use "I" or personal pronouns'
            ].map(tip => (
              <li key={tip} className="flex items-start gap-2 text-[12px] text-zinc-500">
                <span className="text-rose-500 flex-shrink-0 mt-0.5">›</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
