interface SummaryFormProps {
  summary: string
  onChange: (value: string) => void
}

export default function SummaryForm({ summary, onChange }: SummaryFormProps) {
  return (
    <div className="flex flex-col h-full font-sans select-text">
      {/* Textarea — no label, placeholder explains it */}
      <textarea
        value={summary}
        onChange={e => onChange(e.target.value)}
        aria-label="Professional Summary"
        placeholder="e.g. Senior Software Engineer with 8+ years of experience leading cross-functional teams and building high-scale distributed systems. Expert in React, Node.js, and cloud architecture (AWS). Boosted platform performance by 40%."
        className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-[14px] text-zinc-200 leading-relaxed placeholder:text-zinc-500 resize-none focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/10 transition-all"
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
