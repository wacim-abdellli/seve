import type { Publication } from '../../types/resume'
import { Plus, Trash2, BookOpen } from 'lucide-react'

interface PublicationsFormProps {
  publications: Publication[]
  onChange: (updated: Publication[]) => void
}

export default function PublicationsForm({ publications, onChange }: PublicationsFormProps) {
  const handleAdd = () => {
    const newEntry: Publication = {
      id: crypto.randomUUID(),
      title: '',
      publisher: '',
      date: '',
      description: '',
    }
    onChange([...publications, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(publications.filter((p) => p.id !== id))
  }

  const handleChange = <K extends keyof Publication>(id: string, field: K, value: Publication[K]) => {
    onChange(
      publications.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value }
        }
        return p
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
        <span>Add Publication</span>
      </button>

      {publications.map((pub, i) => (
        <div
          key={pub.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/40">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
              {i + 1}
            </div>
            <span className="text-[13px] font-medium text-white flex-1 min-w-0 truncate">
              {pub.title || 'New Publication'}
            </span>
            <button
              onClick={() => handleRemove(pub.id)}
              className="p-1 text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
              type="button"
              title="Delete Publication"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-zinc-800/60">
            <input
              value={pub.title}
              onChange={(e) => handleChange(pub.id, 'title', e.target.value)}
              placeholder="Publication title"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={pub.publisher}
              onChange={(e) => handleChange(pub.id, 'publisher', e.target.value)}
              placeholder="Publisher or venue (e.g. IEEE, Medium)"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={pub.date}
              onChange={(e) => handleChange(pub.id, 'date', e.target.value)}
              placeholder="Publication date (e.g. 2024)"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <textarea
              value={pub.description}
              onChange={(e) => handleChange(pub.id, 'description', e.target.value)}
              placeholder="Brief description or abstract"
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all resize-none"
            />
          </div>
        </div>
      ))}

      {publications.length === 0 && (
        <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
          <BookOpen className="w-10 h-10 text-zinc-800 mb-3" />
          <p className="text-[13px] text-zinc-500">No publications added yet</p>
          <p className="text-[11px] text-zinc-600 mt-1">Add articles, papers, or books you have published</p>
        </div>
      )}
    </div>
  )
}
