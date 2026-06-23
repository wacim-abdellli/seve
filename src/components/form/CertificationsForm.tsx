import type { Certification } from '../../types/resume'
import { Plus, Trash2, Award } from 'lucide-react'

interface CertificationsFormProps {
  certifications: Certification[]
  onChange: (updated: Certification[]) => void
}

export default function CertificationsForm({ certifications, onChange }: CertificationsFormProps) {
  const handleAdd = () => {
    const newEntry: Certification = {
      id: crypto.randomUUID(),
      title: '',
      issuer: '',
      date: '',
      description: '',
    }
    onChange([...certifications, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(certifications.filter((c) => c.id !== id))
  }

  const handleChange = <K extends keyof Certification>(id: string, field: K, value: Certification[K]) => {
    onChange(
      certifications.map((c) => {
        if (c.id === id) {
          return { ...c, [field]: value }
        }
        return c
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
        <span>Add Certification</span>
      </button>

      {certifications.map((cert, i) => (
        <div
          key={cert.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/40">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
              {i + 1}
            </div>
            <span className="text-[13px] font-medium text-white flex-1 min-w-0 truncate">
              {cert.title || 'New Certification'}
            </span>
            <button
              onClick={() => handleRemove(cert.id)}
              className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              type="button"
              title="Delete Certification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-zinc-800/60">
            <input
              value={cert.title}
              onChange={(e) => handleChange(cert.id, 'title', e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect – Professional"
              aria-label="Certification Title"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={cert.issuer}
              onChange={(e) => handleChange(cert.id, 'issuer', e.target.value)}
              placeholder="e.g. Amazon Web Services"
              aria-label="Issuer"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <input
              value={cert.date}
              onChange={(e) => handleChange(cert.id, 'date', e.target.value)}
              placeholder="e.g. 03/2024"
              aria-label="Date Issued"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />
            <textarea
              value={cert.description}
              onChange={(e) => handleChange(cert.id, 'description', e.target.value)}
              placeholder="e.g. Credential ID: AWS-10293, validating advanced high-scale cloud system design capabilities."
              rows={2}
              aria-label="Certification Description"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all resize-none"
            />
          </div>
        </div>
      ))}

      {certifications.length === 0 && (
        <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
          <Award className="w-10 h-10 text-zinc-800 mb-3" />
          <p className="text-[13px] text-zinc-500">No certifications added yet</p>
          <p className="text-[11px] text-zinc-600 mt-1">Add professional certifications and licenses</p>
        </div>
      )}
    </div>
  )
}
