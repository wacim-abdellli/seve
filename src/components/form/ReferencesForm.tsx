import type { Reference } from '../../types/resume'
import { Plus, Trash2, Phone } from 'lucide-react'

interface ReferencesFormProps {
  references: Reference[]
  onChange: (updated: Reference[]) => void
}

export default function ReferencesForm({ references, onChange }: ReferencesFormProps) {
  const handleAdd = () => {
    const newEntry: Reference = {
      id: crypto.randomUUID(),
      name: '',
      position: '',
      phone: '',
      description: '',
    }
    onChange([...references, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(references.filter((r) => r.id !== id))
  }

  const handleChange = <K extends keyof Reference>(id: string, field: K, value: Reference[K]) => {
    onChange(
      references.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value }
        }
        return r
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
        <span>Add Reference</span>
      </button>

      {references.map((ref, i) => (
        <div
          key={ref.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/40">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
              {i + 1}
            </div>
            <span className="text-[13px] font-medium text-white flex-1 min-w-0 truncate">
              {ref.name || 'New Reference'}
            </span>
            <button
              onClick={() => handleRemove(ref.id)}
              className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              type="button"
              title="Delete Reference"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-zinc-800/60">
            <input
              value={ref.name}
              onChange={(e) => handleChange(ref.id, 'name', e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              aria-label="Reference Name"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={ref.position}
              onChange={(e) => handleChange(ref.id, 'position', e.target.value)}
              placeholder="e.g. Director of Engineering at Google"
              aria-label="Position and Company"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={ref.phone}
              onChange={(e) => handleChange(ref.id, 'phone', e.target.value)}
              placeholder="e.g. sjenkins@google.com or +1 (555) 019-2834"
              aria-label="Contact Information"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <textarea
              value={ref.description}
              onChange={(e) => handleChange(ref.id, 'description', e.target.value)}
              placeholder="e.g. Direct manager for 3 years, supervised several key product launches."
              rows={2}
              aria-label="Relationship or Notes"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all resize-none"
            />
          </div>
        </div>
      ))}

      {references.length === 0 && (
        <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
          <Phone className="w-10 h-10 text-zinc-800 mb-3" />
          <p className="text-[13px] text-zinc-500">No references added yet</p>
          <p className="text-[11px] text-zinc-600 mt-1">Add professional references or "Available upon request"</p>
        </div>
      )}
    </div>
  )
}
