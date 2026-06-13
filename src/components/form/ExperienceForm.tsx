import { useState } from 'react'
import type { Experience } from '../../types/resume'
import { generateContent } from '../../utils/aiService'

interface ExperienceFormProps {
  experience: Experience[]
  apiKey: string
  onChange: (updated: Experience[]) => void
}

export default function ExperienceForm({ experience, apiKey, onChange }: ExperienceFormProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAdd = () => {
    const newEntry: Experience = {
      id: crypto.randomUUID(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
    }
    onChange([...experience, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(experience.filter((exp) => exp.id !== id))
  }

  const handleChange = (id: string, field: keyof Experience, value: any) => {
    onChange(
      experience.map((exp) => {
        if (exp.id === id) {
          return { ...exp, [field]: value }
        }
        return exp
      })
    )
  }

  const handleBulletChange = (expId: string, bulletIndex: number, val: string) => {
    onChange(
      experience.map((exp) => {
        if (exp.id === expId) {
          const bullets = [...exp.bullets]
          bullets[bulletIndex] = val
          return { ...exp, bullets }
        }
        return exp
      })
    )
  }

  const handleAddBullet = (expId: string) => {
    onChange(
      experience.map((exp) => {
        if (exp.id === expId) {
          return { ...exp, bullets: [...exp.bullets, ''] }
        }
        return exp
      })
    )
  }

  const handleRemoveBullet = (expId: string, bulletIndex: number) => {
    onChange(
      experience.map((exp) => {
        if (exp.id === expId) {
          const bullets = exp.bullets.filter((_, idx) => idx !== bulletIndex)
          return { ...exp, bullets: bullets.length ? bullets : [''] }
        }
        return exp
      })
    )
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= experience.length) return
    const updated = [...experience]
    const temp = updated[index]
    updated[index] = updated[nextIndex]
    updated[nextIndex] = temp
    onChange(updated)
  }

  const handleAiBullets = async (expId: string, jobTitle: string) => {
    if (!jobTitle.trim()) {
      alert('Please fill in the Job Title first to generate relevant bullets.')
      return
    }
    setLoadingId(expId)
    try {
      const prompt = `Generate 3 strong ATS-optimized resume bullet points for the job title: "${jobTitle}". Start each bullet with a strong action verb and include quantifiable metrics.`
      const result = await generateContent(prompt, apiKey, 'bullet')
      
      // Split bullets by line or standard bullets
      const parsedBullets = result
        .split('\n')
        .map((line) => line.trim().replace(/^•|-|\*|\d+\.\s*/, '').trim())
        .filter((line) => line.length > 0)
      
      onChange(
        experience.map((exp) => {
          if (exp.id === expId) {
            // Keep non-empty existing bullets, append generated ones
            const existing = exp.bullets.filter((b) => b.trim() !== '')
            return {
              ...exp,
              bullets: existing.length ? [...existing, ...parsedBullets] : parsedBullets,
            }
          }
          return exp
        })
      )
    } catch (e) {
      console.error('AI Bullets error:', e)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <h3 className="text-lg font-medium text-white">Work Experience</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs transition-all font-medium"
        >
          + Add Job
        </button>
      </div>

      {experience.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No experience added yet. Add a role to get started.</p>
      ) : (
        <div className="space-y-6">
          {experience.map((exp, idx) => (
            <div key={exp.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-4 shadow-sm relative">
              {/* Row controls */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 no-print">
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300 w-7 h-7 rounded flex items-center justify-center text-xs"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === experience.length - 1}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300 w-7 h-7 rounded flex items-center justify-center text-xs"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(exp.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 w-7 h-7 rounded flex items-center justify-center text-xs ml-2"
                >
                  ✕
                </button>
              </div>

              {/* Form entries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-24">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Job Title *</label>
                  <input
                    type="text"
                    value={exp.jobTitle}
                    onChange={(e) => handleChange(exp.id, 'jobTitle', e.target.value)}
                    placeholder="Senior React Developer"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Company *</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => handleChange(exp.id, 'company', e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Location</label>
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => handleChange(exp.id, 'location', e.target.value)}
                    placeholder="San Francisco, CA"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Start Date *</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => handleChange(exp.id, 'startDate', e.target.value)}
                      placeholder="05/2021"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">End Date *</label>
                    <input
                      type="text"
                      value={exp.current ? 'Present' : exp.endDate}
                      disabled={exp.current}
                      onChange={(e) => handleChange(exp.id, 'endDate', e.target.value)}
                      placeholder="Present"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Current Role Check */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`current-${exp.id}`}
                  checked={exp.current}
                  onChange={(e) => handleChange(exp.id, 'current', e.target.checked)}
                  className="rounded border-slate-600 text-indigo-600 bg-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-800"
                />
                <label htmlFor={`current-${exp.id}`} className="text-xs text-slate-300 cursor-pointer">
                  I currently work here
                </label>
              </div>

              {/* Bullet Points Manager */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wide">Key Achievements & Responsibilities</h4>
                  <button
                    type="button"
                    onClick={() => handleAiBullets(exp.id, exp.jobTitle)}
                    disabled={loadingId !== null}
                    className="bg-slate-700 hover:bg-slate-600 text-indigo-400 text-[10px] rounded px-2.5 py-1 font-semibold flex items-center gap-1"
                  >
                    {loadingId === exp.id ? (
                      <span className="w-2.5 h-2.5 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    AI Generate Bullets
                  </button>
                </div>

                <div className="space-y-2">
                  {exp.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="flex gap-2 items-start">
                      <span className="text-slate-500 mt-2 text-xs font-mono">•</span>
                      <textarea
                        value={b}
                        rows={1}
                        onChange={(e) => handleBulletChange(exp.id, bIdx, e.target.value)}
                        placeholder="Led development of key features, improving metric by X%..."
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-14"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(exp.id, bIdx)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-400 w-8 h-8 rounded-lg flex items-center justify-center mt-3 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddBullet(exp.id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium pl-6"
                >
                  + Add Bullet Point
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
