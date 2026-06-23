import type { Language, LanguageProficiency } from '../../types/resume'
import { Plus, Trash2, Globe } from 'lucide-react'

interface LanguagesFormProps {
  languages: Language[]
  onChange: (updated: Language[]) => void
}

const PROFICIENCY_LEVELS = [
  'Native',
  'Fluent',
  'Advanced',
  'Intermediate',
  'Basic',
]

export default function LanguagesForm({ languages, onChange }: LanguagesFormProps) {

  const handleAdd = () => {
    const newEntry: Language = {
      id: crypto.randomUUID(),
      name: '',
      proficiency: 'Intermediate',
    }
    onChange([...languages, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(languages.filter((l) => l.id !== id))
  }

  const handleChange = <K extends keyof Language>(id: string, field: K, value: Language[K]) => {
    onChange(
      languages.map((lang) => {
        if (lang.id === id) {
          return { ...lang, [field]: value }
        }
        return lang
      })
    )
  }

  return (
    <div className="flex flex-col h-full font-sans select-text space-y-4">
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] border border-dashed border-zinc-800 rounded-xl text-[13px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer"
        type="button"
      >
        <Plus className="w-4 h-4" />
        <span>Add Language</span>
      </button>

      {languages.map((lang, i) => (
        <div
          key={lang.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/40">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
              {i + 1}
            </div>
            <span className="text-[13px] font-medium text-white flex-1 min-w-0 truncate">
              {lang.name || 'New Language'}
            </span>
            <button
              onClick={() => handleRemove(lang.id)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              type="button"
              title="Delete Language"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-zinc-800/60">
            <label htmlFor={`lang-name-${lang.id}`} className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Language Name
            </label>
            <input
              id={`lang-name-${lang.id}`}
              value={lang.name}
              onChange={(e) => handleChange(lang.id, 'name', e.target.value)}
              placeholder="e.g. English, French, Arabic"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />

            <label htmlFor={`lang-prof-${lang.id}`} className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2">
              Proficiency Level
            </label>
            <select
              id={`lang-prof-${lang.id}`}
              value={lang.proficiency}
              onChange={(e) => handleChange(lang.id, 'proficiency', e.target.value as LanguageProficiency)}
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-rose-500/40 transition-all"
            >
              {PROFICIENCY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {languages.length === 0 && (
        <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
          <Globe className="w-10 h-10 text-zinc-800 mb-3" />
          <p className="text-[13px] text-zinc-500">
            No languages added yet
          </p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Add languages you speak and your proficiency level
          </p>
        </div>
      )}
    </div>
  )
}
