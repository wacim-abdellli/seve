import type { Volunteer } from '../../types/resume'
import { Plus, Trash2, HandHeart } from 'lucide-react'

interface VolunteerFormProps {
  volunteer: Volunteer[]
  onChange: (updated: Volunteer[]) => void
}

export default function VolunteerForm({ volunteer, onChange }: VolunteerFormProps) {
  const handleAdd = () => {
    const newEntry: Volunteer = {
      id: crypto.randomUUID(),
      organization: '',
      location: '',
      period: '',
      description: '',
    }
    onChange([...volunteer, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(volunteer.filter((v) => v.id !== id))
  }

  const handleChange = <K extends keyof Volunteer>(id: string, field: K, value: Volunteer[K]) => {
    onChange(
      volunteer.map((v) => {
        if (v.id === id) {
          return { ...v, [field]: value }
        }
        return v
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
        <span>Add Volunteer Experience</span>
      </button>

      {volunteer.map((vol, i) => (
        <div
          key={vol.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/40">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
              {i + 1}
            </div>
            <span className="text-[13px] font-medium text-white flex-1 min-w-0 truncate">
              {vol.organization || 'New Volunteer'}
            </span>
            <button
              onClick={() => handleRemove(vol.id)}
              className="p-1 text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
              type="button"
              title="Delete Volunteer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-zinc-800/60">
            <input
              value={vol.organization}
              onChange={(e) => handleChange(vol.id, 'organization', e.target.value)}
              placeholder="e.g. Girls Who Code"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={vol.location}
              onChange={(e) => handleChange(vol.id, 'location', e.target.value)}
              placeholder="e.g. New York, NY or Remote"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={vol.period}
              onChange={(e) => handleChange(vol.id, 'period', e.target.value)}
              placeholder="e.g. 2022 - 2024 or 06/2023 - Present"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <textarea
              value={vol.description}
              onChange={(e) => handleChange(vol.id, 'description', e.target.value)}
              placeholder="e.g. Taught introductory web development (HTML/CSS/JS) to 40+ high school students, facilitating projects and career mentorship."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all resize-none"
            />
          </div>
        </div>
      ))}

      {volunteer.length === 0 && (
        <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
          <HandHeart className="w-10 h-10 text-zinc-800 mb-3" />
          <p className="text-[13px] text-zinc-500">No volunteer experience added yet</p>
          <p className="text-[11px] text-zinc-600 mt-1">Add volunteer work and community involvement</p>
        </div>
      )}
    </div>
  )
}
