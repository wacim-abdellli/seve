import type { Project } from '../../types/resume'
import { Plus, Trash2, FolderOpen, X } from 'lucide-react'

interface ProjectsFormProps {
  projects: Project[]
  onChange: (updated: Project[]) => void
}

export default function ProjectsForm({ projects, onChange }: ProjectsFormProps) {
  
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
    const updated = projects.filter((p) => p.id !== id)
    onChange(updated)
  }

  const handleChange = <K extends keyof Project>(id: string, field: K, value: Project[K]) => {
    onChange(
      projects.map((proj) => {
        if (proj.id === id) {
          return { ...proj, [field]: value }
        }
        return proj
      })
    )
  }

  const addTech = (projId: string, val: string) => {
    const trimmed = val.trim()
    if (trimmed) {
      const proj = projects.find((p) => p.id === projId)
      if (proj && !proj.technologies.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
        handleChange(projId, 'technologies', [...proj.technologies, trimmed])
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
    <div className="flex flex-col h-full font-sans select-text space-y-4">
      
      {/* Add button — subtle, not competing */}
      <button 
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-800 rounded-xl text-[13px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer"
        type="button"
      >
        <Plus className="w-4 h-4" />
        <span>Add Project</span>
      </button>      {/* Project cards — flat, no nested boxes */}
      {projects.map((project, i) => {
        return (
        <div 
          key={project.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          {/* Project card header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/40">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
              {i + 1}
            </div>
            <span className="text-[13px] font-medium text-white flex-1 min-w-0 truncate">
              {project.name || 'Untitled Project'}
            </span>
            <button 
              onClick={() => handleRemove(project.id)}
              className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              type="button"
              title="Delete Project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Project fields — directly inside, no extra card */}
          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-zinc-800/60">
            
            {/* Project Name */}
            <input
              value={project.name}
              onChange={(e) => handleChange(project.id, 'name', e.target.value)}
              placeholder="e.g. Serverless Task API"
              aria-label="Project Name"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
            />

            {/* Link + Date — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <input
                value={project.link || ''}
                onChange={(e) => handleChange(project.id, 'link', e.target.value)}
                placeholder="e.g. github.com/username/project"
                aria-label="Project Link"
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
              />
              <input
                value={project.date || ''}
                onChange={(e) => handleChange(project.id, 'date', e.target.value)}
                placeholder="e.g. 2023 - Present"
                aria-label="Project Date or Duration"
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 transition-all"
              />
            </div>

            {/* Technologies — tag input */}
            <div className="space-y-2">
              {project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {project.technologies.map((tech) => (
                    <span 
                      key={tech}
                      className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-[11px] px-2 py-1 rounded-md"
                    >
                      <span>{tech}</span>
                      <button 
                        onClick={() => removeTech(project.id, tech)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                        type="button"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                placeholder="e.g. React (Press Enter to add)"
                aria-label="Add Technology"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTech(project.id, e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/40 transition-all"
              />
            </div>

            {/* Description */}
            <textarea
              value={project.description}
              onChange={(e) => handleChange(project.id, 'description', e.target.value)}
              placeholder="e.g. Developed a serverless task scheduler processing 10k concurrent requests. Reduced latency by 15% using Redis caching."
              rows={3}
              aria-label="Project Description"
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-[13px] text-white leading-relaxed placeholder:text-zinc-600 resize-none focus:outline-none focus:border-rose-500/40 transition-all"
            />
          </div>
        </div>
        )
      })}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
          <FolderOpen className="w-10 h-10 text-zinc-800 mb-3" />
          <p className="text-[13px] text-zinc-500">
            No projects yet
          </p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Add side projects, open source work, or personal builds
          </p>
        </div>
      )}
    </div>
  )
}
