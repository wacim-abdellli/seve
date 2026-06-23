import { useState } from 'react'
import type { Education } from '../../types/resume'
import { Plus, Trash2, HelpCircle, GripVertical, ChevronDown, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface EducationFormProps {
  education: Education[]
  onChange: (updated: Education[]) => void
}

export default function EducationForm({ education, onChange }: EducationFormProps) {
  const [expandedId, setExpandedId] = useState<string | null>(education[0]?.id || null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleAdd = () => {
    const newEntry: Education = {
      id: crypto.randomUUID(),
      degree: '',
      school: '',
      location: '',
      graduationDate: '',
      gpa: '',
    }
    onChange([...education, newEntry])
    setExpandedId(newEntry.id)
  }

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = education.filter((edu) => edu.id !== id)
    onChange(updated)
    if (expandedId === id) {
      setExpandedId(updated[0]?.id || null)
    }
  }

  const handleChange = (id: string, field: keyof Education, value: string) => {
    onChange(
      education.map((edu) => {
        if (edu.id === id) {
          return { ...edu, [field]: value }
        }
        return edu
      })
    )
  }

  const handleDragStart = (index: number) => {
    setDraggedIdx(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetIndex: number) => {
    if (draggedIdx === null || draggedIdx === targetIndex) return
    const updated = [...education]
    const [removed] = updated.splice(draggedIdx, 1)
    updated.splice(targetIndex, 0, removed)
    onChange(updated)
    setDraggedIdx(null)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }



  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <span className="text-[13px] text-zinc-400">
          {education.length} institution(s)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
            title="Formatting Guidelines"
          >
            <HelpCircle size={15} />
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-[13px] text-rose-455 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 px-4 py-2.5 rounded-xl transition-colors cursor-pointer active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add School</span>
          </button>
        </div>
      </div>

      {showTooltip && (
        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-zinc-400 text-xs leading-relaxed animate-fade-in flex flex-col gap-1.5">
          <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Award size={14} className="text-rose-400" />
            Education Formatting Tip:
          </span>
          <p className="font-light">
            List credentials in reverse chronological order. If your GPA is under 3.5, consider omitting it from your resume to maximize your score rating. Drag cards using the handle to reposition them.
          </p>
        </div>
      )}

      {education.length === 0 ? (
        <div className="border border-dashed border-zinc-800 p-8 rounded-xl text-center bg-zinc-950/20">
          <p className="text-xs text-zinc-500 font-light">No education entries listed. Add an institution to start.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {education.map((edu, idx) => {
            const gpaValue = parseFloat(edu.gpa || '')
            const showGpaWarning = !isNaN(gpaValue) && gpaValue < 3.5
            const isExpanded = expandedId === edu.id
            const isDragging = idx === draggedIdx

            return (
              <div
                key={edu.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className="flex flex-col gap-2 relative"
                style={{
                  opacity: isDragging ? 0.3 : 1,
                }}
              >
                {/* Collapsed Card view */}
                <div
                  onClick={() => toggleExpand(edu.id)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-1 cursor-pointer hover:border-zinc-700 transition-colors flex items-center gap-3 select-none"
                >
                  <div 
                    className="cursor-grab text-zinc-655 hover:text-zinc-450 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical size={16} />
                  </div>

                  {/* School avatar */}
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-white border border-zinc-700">
                    {edu.school ? edu.school[0].toUpperCase() : '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">
                      {edu.degree || <span className="text-zinc-550 italic">Untitled Degree</span>}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {edu.school || 'No Institution'} {edu.graduationDate ? `• Graduated ${edu.graduationDate}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleRemove(edu.id, e)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete School"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-zinc-650 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded fields */}
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
                        {/* Degree */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-500">Degree / Course *</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleChange(edu.id, 'degree', e.target.value)}
                            className={`drawer-input !bg-zinc-950 ${!edu.degree.trim() ? '!border-red-500/70 focus:!border-red-500 focus:!ring-red-500/10' : ''}`}
                            placeholder="e.g. M.S. in Computer Science"
                          />
                        </div>

                        {/* School */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-500">School / University *</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => handleChange(edu.id, 'school', e.target.value)}
                            className={`drawer-input !bg-zinc-950 ${!edu.school.trim() ? '!border-red-500/70 focus:!border-red-500 focus:!ring-red-500/10' : ''}`}
                            placeholder="e.g. Stanford University"
                          />
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-500">Location</label>
                          <input
                            type="text"
                            value={edu.location}
                            onChange={(e) => handleChange(edu.id, 'location', e.target.value)}
                            className="drawer-input !bg-zinc-950"
                            placeholder="e.g. Stanford, CA"
                          />
                        </div>

                        {/* Graduation & GPA */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-500">Graduation *</label>
                            <input
                              type="text"
                              value={edu.graduationDate}
                              onChange={(e) => handleChange(edu.id, 'graduationDate', e.target.value)}
                              className="drawer-input !bg-zinc-950"
                              placeholder="e.g. 05/2024"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-500">GPA (Optional)</label>
                            <input
                              type="text"
                              value={edu.gpa || ''}
                              onChange={(e) => handleChange(edu.id, 'gpa', e.target.value)}
                              className="drawer-input !bg-zinc-950"
                              placeholder="e.g. 3.8"
                            />
                          </div>
                        </div>

                        {showGpaWarning && (
                          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs leading-normal">
                            ⚠️ <strong>GPA Guidance:</strong> Stating low GPA scores might lead to automatic filter exclusions in candidate matching. Consider clearing this field if it is below 3.5.
                          </div>
                        )}
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
