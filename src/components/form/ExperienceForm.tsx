import { useState, useRef, useCallback } from 'react'
import type { Experience } from '../../types/resume'
import { 
  GripVertical, 
  Trash2, 
  Plus, 
  X,
  ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ExperienceFormProps {
  experience: Experience[]
  onChange: (updated: Experience[]) => void
}

export default function ExperienceForm({ experience, onChange }: ExperienceFormProps) {
  const [expandedId, setExpandedId] = useState<string | null>(experience[0]?.id || null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [starOpenId, setStarOpenId] = useState<string | null>(null)
  const [starFields, setStarFields] = useState<Record<string, { s: string; t: string; a: string; r: string }>>({}) 
  const rafRefs = useRef<Map<HTMLTextAreaElement, number>>(new Map())
  const bulletKeysRef = useRef<Record<string, string[]>>({})

  // Batch textarea height measurement into rAF to prevent layout reflow per keystroke
  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    const prev = rafRefs.current.get(el)
    if (prev) cancelAnimationFrame(prev)
    const id = requestAnimationFrame(() => {
      rafRefs.current.delete(el)
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    })
    rafRefs.current.set(el, id)
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

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
    setExpandedId(newEntry.id)
  }

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = experience.filter((exp) => exp.id !== id)
    onChange(updated)
    if (expandedId === id) {
      setExpandedId(updated[0]?.id || null)
    }
  }

  const handleChange = <K extends keyof Experience>(id: string, field: K, value: Experience[K]) => {
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
    const currentKeys = bulletKeysRef.current[expId] || []
    bulletKeysRef.current[expId] = [...currentKeys, crypto.randomUUID()]
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
    const currentKeys = bulletKeysRef.current[expId] || []
    bulletKeysRef.current[expId] = currentKeys.filter((_, idx) => idx !== bulletIndex)
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

  const handleDragStart = (index: number) => {
    setDraggedIdx(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (index: number) => {
    if (draggedIdx === null || draggedIdx === index) return
    const updated = [...experience]
    const [removed] = updated.splice(draggedIdx, 1)
    updated.splice(index, 0, removed)
    onChange(updated)
    setDraggedIdx(null)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
  }

  const getStarFields = (expId: string) => {
    return starFields[expId] || { s: '', t: '', a: '', r: '' }
  }

  const updateStarField = (expId: string, field: 's' | 't' | 'a' | 'r', value: string) => {
    setStarFields(prev => ({
      ...prev,
      [expId]: { ...(prev[expId] || { s: '', t: '', a: '', r: '' }), [field]: value }
    }))
  }

  const handleInjectStar = (expId: string) => {
    const f = getStarFields(expId)
    if (!f.a.trim()) return
    const parts: string[] = []
    const actionVerb = f.a.trim().charAt(0).toUpperCase() + f.a.trim().slice(1)
    parts.push(actionVerb)
    if (f.t.trim()) parts[0] += ` to ${f.t.trim().toLowerCase()}`
    if (f.s.trim()) parts.push(`within ${f.s.trim().toLowerCase()}`)
    if (f.r.trim()) {
      const result = f.r.trim().charAt(0).toUpperCase() + f.r.trim().slice(1)
      parts.push(result.startsWith('result') || result.startsWith('Result') ? result : `resulting in ${result.toLowerCase()}`)
    }
    const composed = parts.join(', ') + '.'
    onChange(
      experience.map(exp => {
        if (exp.id === expId) {
          const existing = exp.bullets.filter(b => b.trim())
          return { ...exp, bullets: [...existing, composed] }
        }
        return exp
      })
    )
    setStarFields(prev => ({ ...prev, [expId]: { s: '', t: '', a: '', r: '' } }))
    setStarOpenId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <span className="text-[13px] text-zinc-400">
          {experience.length} position(s)
        </span>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-[13px] text-rose-455 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 px-4 py-2.5 rounded-xl transition-colors cursor-pointer active:scale-95 min-h-[44px]"
          type="button"
        >
          <Plus className="w-4 h-4" />
          <span>Add Position</span>
        </button>
      </div>

      {experience.length === 0 ? (
        <div className="border border-dashed border-zinc-800 p-8 rounded-xl text-center bg-zinc-950/20">
          <p className="text-xs text-zinc-500 font-light">No experiences listed. Add a position to start.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {experience.map((exp, idx) => {
            const isExpanded = expandedId === exp.id
            const isDragging = idx === draggedIdx

            return (
              <div
                key={exp.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className="flex flex-col gap-2"
                style={{ opacity: isDragging ? 0.3 : 1 }}
              >
                {/* Collapsed/Header Card view */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpand(exp.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleExpand(exp.id)
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-1 cursor-pointer hover:border-zinc-700 transition-colors flex items-center gap-3 select-none"
                >
                  <div 
                    className="cursor-grab text-zinc-500 hover:text-zinc-400 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical size={20} />
                  </div>

                  {/* Company avatar */}
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-white border border-zinc-700">
                    {exp.company ? exp.company[0].toUpperCase() : '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">
                      {exp.jobTitle || <span className="text-zinc-500 italic">Untitled Position</span>}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {exp.company || 'No Company'} · {exp.startDate || 'MM/YYYY'}–{exp.current ? 'Present' : exp.endDate || 'MM/YYYY'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={(e) => handleRemove(exp.id, e)}
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95"
                      type="button"
                      aria-label="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Fields inside Drawer Card */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-zinc-900 border border-zinc-800 rounded-xl px-4 pb-4"
                    >
                      <div className="pt-4 space-y-4 border-t border-zinc-800 mt-2">
                        
                        {/* Job Title */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-500">Job Title *</label>
                          <input
                            type="text"
                            placeholder="e.g. Senior Software Engineer"
                            className="drawer-input !bg-zinc-950"
                            value={exp.jobTitle}
                            onChange={(e) => handleChange(exp.id, 'jobTitle', e.target.value)}
                          />
                        </div>

                        {/* Company */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-500">Company / Org *</label>
                          <input
                            type="text"
                            placeholder="e.g. Google"
                            className="drawer-input !bg-zinc-950"
                            value={exp.company}
                            onChange={(e) => handleChange(exp.id, 'company', e.target.value)}
                          />
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-500">Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Mountain View, CA"
                            className="drawer-input !bg-zinc-950"
                            value={exp.location}
                            onChange={(e) => handleChange(exp.id, 'location', e.target.value)}
                          />
                        </div>

                        {/* Dates row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-500">Start Date *</label>
                            <input
                              type="text"
                              placeholder="e.g. 09/2021"
                              className="drawer-input !bg-zinc-950"
                              value={exp.startDate}
                              onChange={(e) => handleChange(exp.id, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-500">End Date *</label>
                            <input
                              type="text"
                              placeholder="e.g. Present"
                              disabled={exp.current}
                              className="drawer-input !bg-zinc-950"
                              value={exp.current ? 'Present' : exp.endDate}
                              onChange={(e) => handleChange(exp.id, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Currently working checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={() => handleChange(exp.id, 'current', !exp.current)}
                            className="accent-rose-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-[12px] text-zinc-400">
                            Currently working here
                          </span>
                        </label>

                        {/* Bullets header */}
                        <div className="pt-2 border-t border-zinc-800/60">
                          <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                            Achievements
                          </span>
                        </div>

                        {/* Bullets list */}
                        <div className="space-y-2">
                          {exp.bullets.map((b, bIdx) => {
                            if (!bulletKeysRef.current[exp.id]) {
                              bulletKeysRef.current[exp.id] = exp.bullets.map(() => crypto.randomUUID())
                            } else if (bulletKeysRef.current[exp.id].length !== exp.bullets.length) {
                              const diff = exp.bullets.length - bulletKeysRef.current[exp.id].length
                              if (diff > 0) {
                                bulletKeysRef.current[exp.id] = [...bulletKeysRef.current[exp.id], ...Array(diff).fill(null).map(() => crypto.randomUUID())]
                              }
                            }
                            const stableKey = bulletKeysRef.current[exp.id][bIdx] || bIdx
                            return (
                              <div
                                key={stableKey}
                                className="flex items-start gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors group relative"
                              >
                                <span className="text-zinc-500 mt-0.5 flex-shrink-0 text-sm">•</span>
                                <textarea
                                  value={b}
                                  onChange={(e) => handleBulletChange(exp.id, bIdx, e.target.value)}
                                  onInput={(e) => autoResize(e.currentTarget)}
                                  onFocus={(e) => autoResize(e.currentTarget)}
                                  rows={2}
                                  className="flex-1 min-w-0 bg-transparent text-[13px] text-zinc-300 resize-none outline-none leading-relaxed placeholder:text-zinc-600 overflow-hidden"
                                  placeholder="e.g. Led a team of 4 engineers to design and deploy a real-time messaging pipeline, increasing performance by 25%."
                                />

                                {/* Hover Actions */}
                                <div className="flex gap-1 flex-shrink-0 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBullet(exp.id, bIdx)}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                    title="Remove Bullet"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Add bullet point action */}
                        <button
                          type="button"
                          onClick={() => handleAddBullet(exp.id)}
                          className="w-full py-2 border border-dashed border-zinc-800 rounded-lg text-[12px] text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-colors cursor-pointer"
                        >
                          + Add bullet
                        </button>

                        {/* STAR Builder Segment */}
                        <div className="border-t border-zinc-800/80 pt-3 mt-2">
                          <button
                            type="button"
                            onClick={() => setStarOpenId(starOpenId === exp.id ? null : exp.id)}
                            className="text-xs text-zinc-550 hover:text-white font-bold transition-colors cursor-pointer"
                          >
                            {starOpenId === exp.id ? 'Close STAR Builder' : 'Open STAR Achievement Builder'}
                          </button>

                          {starOpenId === exp.id && (
                            <div className="mt-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3">
                              <h5 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">STAR Framework</h5>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-zinc-500">Situation (S)</label>
                                  <input
                                    type="text"
                                    value={getStarFields(exp.id).s}
                                    onChange={(e) => updateStarField(exp.id, 's', e.target.value)}
                                    placeholder="e.g. During a major system outage..."
                                    className="drawer-input px-3 py-2 text-xs !bg-zinc-950"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-zinc-500">Task (T)</label>
                                  <input
                                    type="text"
                                    value={getStarFields(exp.id).t}
                                    onChange={(e) => updateStarField(exp.id, 't', e.target.value)}
                                    placeholder="e.g. To migrate the legacy database..."
                                    className="drawer-input px-3 py-2 text-xs !bg-zinc-950"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-zinc-500">Action (A) *</label>
                                  <input
                                    type="text"
                                    value={getStarFields(exp.id).a}
                                    onChange={(e) => updateStarField(exp.id, 'a', e.target.value)}
                                    placeholder="e.g. Engineered a failover replica..."
                                    className="drawer-input px-3 py-2 text-xs !bg-zinc-950"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-zinc-500">Result (R)</label>
                                  <input
                                    type="text"
                                    value={getStarFields(exp.id).r}
                                    onChange={(e) => updateStarField(exp.id, 'r', e.target.value)}
                                    placeholder="e.g. Saving $40k yearly and 0% downtime..."
                                    className="drawer-input px-3 py-2 text-xs !bg-zinc-950"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleInjectStar(exp.id)}
                                className="bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 text-rose-400 text-xs px-3 py-2 rounded-lg font-bold transition-colors w-fit mt-1 self-end cursor-pointer"
                              >
                                Inject Composed Bullet
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
