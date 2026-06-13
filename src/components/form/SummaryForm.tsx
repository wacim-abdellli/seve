import { useState } from 'react'
import { generateContent } from '../../utils/aiService'

interface SummaryFormProps {
  summary: string
  apiKey: string
  onChange: (value: string) => void
}

export default function SummaryForm({ summary, apiKey, onChange }: SummaryFormProps) {
  const [loadingType, setLoadingType] = useState<'write' | 'improve' | null>(null)

  const handleAiAction = async (type: 'write' | 'improve') => {
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
    } catch (e) {
      console.error('AI Summary error:', e)
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <h3 className="text-lg font-medium text-white">Professional Summary</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAiAction('write')}
            disabled={loadingType !== null}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg px-3 py-1.5 text-xs transition-all flex items-center gap-1.5 font-medium"
          >
            {loadingType === 'write' ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            AI Write
          </button>
          
          <button
            type="button"
            onClick={() => handleAiAction('improve')}
            disabled={loadingType !== null || !summary.trim()}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded-lg px-3 py-1.5 text-xs transition-all flex items-center gap-1.5 font-medium"
          >
            {loadingType === 'improve' ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : null}
            AI Improve
          </button>
        </div>
      </div>

      <div>
        <textarea
          value={summary}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Briefly describe your career background, key accomplishments, and target role. Omit personal pronouns like 'I' or 'my' for ATS optimization."
          className="w-full h-44 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm leading-relaxed"
        />
        <div className="flex justify-end text-xs text-slate-400 mt-1.5">
          Character count: <span className="text-slate-200 font-mono ml-1">{summary.length}</span>
        </div>
      </div>
    </div>
  )
}
