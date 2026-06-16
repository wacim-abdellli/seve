import type { Interest } from '../../types/resume'
import { Plus, Trash2, Heart } from 'lucide-react'

interface InterestsFormProps {
  interests: Interest[]
  onChange: (updated: Interest[]) => void
}

export default function InterestsForm({ interests, onChange }: InterestsFormProps) {
  const handleAdd = () => {
    const newEntry: Interest = {
      id: crypto.randomUUID(),
      name: '',
      keywords: [],
    }
    onChange([...interests, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(interests.filter((i) => i.id !== id))
  }

  const handleChange = (id: string, field: keyof Interest, value: string | string[]) => {
    onChange(
      interests.map((i) => {
        if (i.id === id) {
          return { ...i, [field]: value }
        }
        return i
      })
    )
  }

  return (
    <div className="flex flex-col h-full font-sans select-text space-y-4">
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-800 rounded-xl text-[13px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer"
        type="button"
      >
        <Plus className="w-4 h-4" />
        <span>Add Interest</span>
      </button>

      {interests.map((interest, i) => (
        <div
          key={interest.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/40">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
              {i + 1}
            </div>
            <span className="text-[13px] font-medium text-white flex-1 min-w-0 truncate">
              {interest.name || 'New Interest'}
            </span>
            <button
              onClick={() => handleRemove(interest.id)}
              className="p-1 text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
              type="button"
              title="Delete Interest"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-zinc-800/60">
            <input
              value={interest.name}
              onChange={(e) => handleChange(interest.id, 'name', e.target.value)}
              placeholder="Interest name (e.g. Photography, Hiking)"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={interest.keywords.join(', ')}
              onChange={(e) => handleChange(interest.id, 'keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="Keywords (comma-separated, e.g. Landscape, Portrait)"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
          </div>
        </div>
      ))}

      {interests.length === 0 && (
        <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
          <Heart className="w-10 h-10 text-zinc-800 mb-3" />
          <p className="text-[13px] text-zinc-500">No interests added yet</p>
          <p className="text-[11px] text-zinc-600 mt-1">Add personal interests and hobbies</p>
        </div>
      )}
    </div>
  )
}
