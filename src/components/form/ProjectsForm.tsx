import React, { useState } from 'react'
import type { Project } from '../../types/resume'

interface ProjectsFormProps {
  projects: Project[]
  onChange: (updated: Project[]) => void
}

export default function ProjectsForm({ projects, onChange }: ProjectsFormProps) {
  const [techInputs, setTechInputs] = useState<Record<string, string>>({})

  const handleAdd = () => {
    const newEntry: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      technologies: [],
      link: '',
    }
    onChange([...projects, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(projects.filter((p) => p.id !== id))
    // Clean up input state
    const updatedInputs = { ...techInputs }
    delete updatedInputs[id]
    setTechInputs(updatedInputs)
  }

  const handleChange = (id: string, field: keyof Project, value: any) => {
    onChange(
      projects.map((proj) => {
        if (proj.id === id) {
          return { ...proj, [field]: value }
        }
        return proj
      })
    )
  }

  const handleTechKeyDown = (projId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = techInputs[projId]?.trim()
      if (val) {
        const proj = projects.find((p) => p.id === projId)
        if (proj && !proj.technologies.includes(val)) {
          handleChange(projId, 'technologies', [...proj.technologies, val])
          setTechInputs({ ...techInputs, [projId]: '' })
        }
      }
    }
  }

  const removeTech = (projId: string, tech: string) => {
    const proj = projects.find((p) => p.id === projId)
    if (proj) {
      handleChange(
        projId,
        'technologies',
        proj.technologies.filter((t) => t !== tech)
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <h3 className="text-lg font-medium text-white">Projects</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs transition-all font-medium"
        >
          + Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No projects added yet. Showcase your personal or side projects.</p>
      ) : (
        <div className="space-y-6">
          {projects.map((proj) => (
            <div key={proj.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-4 shadow-sm relative">
              <button
                type="button"
                onClick={() => handleRemove(proj.id)}
                className="absolute top-4 right-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 w-7 h-7 rounded flex items-center justify-center text-xs no-print"
              >
                ✕
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Project Name *</label>
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => handleChange(proj.id, 'name', e.target.value)}
                    placeholder="E-commerce Dashboard"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Project Link (Optional)</label>
                  <input
                    type="text"
                    value={proj.link || ''}
                    onChange={(e) => handleChange(proj.id, 'link', e.target.value)}
                    placeholder="github.com/username/project"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Description *</label>
                <textarea
                  value={proj.description}
                  onChange={(e) => handleChange(proj.id, 'description', e.target.value)}
                  placeholder="Developed an interactive dashboard showcasing charts and transaction histories. Optimized rendering performance."
                  className="w-full h-20 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Technologies Tag Manager */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase block">
                  Technologies Used (Press Enter to add)
                </label>
                <input
                  type="text"
                  value={techInputs[proj.id] || ''}
                  onChange={(e) => setTechInputs({ ...techInputs, [proj.id]: e.target.value })}
                  onKeyDown={(e) => handleTechKeyDown(proj.id, e)}
                  placeholder="e.g. React, Tailwind CSS, Firebase"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500"
                />
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-600"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTech(proj.id, tech)}
                        className="hover:text-red-400 font-bold ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
