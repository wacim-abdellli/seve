import type { ResumeData } from '../types/resume'
import type { SectionType } from './SectionSidebar'
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderGit, 
  Plus, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

interface BentoDashboardProps {
  resumeData: ResumeData
  onSelectSection: (section: SectionType) => void
}

export default function BentoDashboard({ resumeData, onSelectSection }: BentoDashboardProps) {
  
  // Helper to calculate section completion and strength
  const getSectionStats = (section: SectionType): { percent: number; status: 'empty' | 'partial' | 'complete'; label: string } => {
    switch (section) {
      case 'contact': {
        const info = resumeData.contact
        let points = 0
        if (info.fullName?.trim()) points += 30
        if (info.email?.trim()) points += 25
        if (info.phone?.trim()) points += 20
        if (info.location?.trim()) points += 15
        if (info.linkedin?.trim()) points += 10
        return {
          percent: points,
          status: points === 0 ? 'empty' : points >= 75 ? 'complete' : 'partial',
          label: 'Contact Info'
        }
      }
      case 'summary': {
        const len = resumeData.summary?.trim().length || 0
        const percent = Math.min(100, Math.round((len / 150) * 100))
        return {
          percent,
          status: len === 0 ? 'empty' : len > 100 ? 'complete' : 'partial',
          label: 'Profile Summary'
        }
      }
      case 'experience': {
        const items = resumeData.experience || []
        if (items.length === 0) return { percent: 0, status: 'empty', label: 'Work History' }
        const first = items[0]
        let points = 50
        if (first.jobTitle?.trim()) points += 15
        if (first.company?.trim()) points += 15
        if (first.bullets && first.bullets.length > 0) points += 20
        const total = Math.min(100, points + (items.length - 1) * 15)
        return {
          percent: total,
          status: total >= 80 ? 'complete' : 'partial',
          label: 'Work Experience'
        }
      }
      case 'education': {
        const items = resumeData.education || []
        if (items.length === 0) return { percent: 0, status: 'empty', label: 'Academic Path' }
        const total = Math.min(100, 60 + (items.length - 1) * 40)
        return {
          percent: total,
          status: total >= 100 ? 'complete' : 'partial',
          label: 'Education'
        }
      }
      case 'skills': {
        const len = resumeData.skills?.length || 0
        const percent = Math.min(100, Math.round((len / 8) * 100))
        return {
          percent,
          status: len === 0 ? 'empty' : len >= 5 ? 'complete' : 'partial',
          label: 'Core Skills'
        }
      }
      case 'projects': {
        const items = resumeData.projects || []
        if (items.length === 0) return { percent: 0, status: 'empty', label: 'Projects List' }
        const total = Math.min(100, 60 + (items.length - 1) * 40)
        return {
          percent: total,
          status: total >= 100 ? 'complete' : 'partial',
          label: 'Projects'
        }
      }
    }
  }

  const getStatusBadge = (status: 'empty' | 'partial' | 'complete', percent: number) => {
    if (status === 'complete') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={10} />
          Complete
        </span>
      )
    }
    if (status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle size={10} />
          {percent}%
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-zinc-900 text-zinc-500 border border-zinc-800/80">
        Empty
      </span>
    )
  }

  const sections: { id: SectionType; icon: React.ElementType }[] = [
    { id: 'contact', icon: User },
    { id: 'summary', icon: FileText },
    { id: 'experience', icon: Briefcase },
    { id: 'education', icon: GraduationCap },
    { id: 'skills', icon: Wrench },
    { id: 'projects', icon: FolderGit },
  ]

  return (
    <div className="flex flex-col gap-5 h-full">
      <div>
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
          Workspace Dashboard
        </h2>
        <p className="text-[11px] text-zinc-500 font-light mt-1">Select any block below to edit or optimize its details</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar pb-6">
        <div className="flex flex-col gap-3.5">
          {sections.map((sec) => {
            const Icon = sec.icon
            const { percent, status, label } = getSectionStats(sec.id)
            
            return (
              <div
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className="tm-card flex flex-col justify-between min-h-[96px] p-3 cursor-pointer hover:border-red-500/25 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                      <Icon size={13} />
                    </div>
                    {getStatusBadge(status, percent)}
                  </div>

                  <div className="mt-2.5 flex flex-col gap-0.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      {label}
                    </h3>
                    
                    {/* Render live data preview in each tile */}
                    <div className="text-[11px] text-muted-foreground leading-relaxed font-light line-clamp-3 pt-1">
                      {sec.id === 'contact' && (
                        <div className="flex flex-col gap-0.5 font-mono text-[10px] min-w-0">
                          {resumeData.contact.fullName ? (
                            <>
                              <div className="text-white font-sans font-bold text-xs truncate">{resumeData.contact.fullName}</div>
                              <div className="truncate">{resumeData.contact.email}</div>
                              <div className="truncate">{resumeData.contact.location}</div>
                            </>
                          ) : (
                            <span className="italic text-zinc-700">No contact information entered.</span>
                          )}
                        </div>
                      )}
                      
                      {sec.id === 'summary' && (
                        resumeData.summary ? (
                          <span>"{resumeData.summary}"</span>
                        ) : (
                          <span className="italic text-zinc-700">No profile summary written yet.</span>
                        )
                      )}

                      {sec.id === 'experience' && (
                        resumeData.experience.length > 0 ? (
                          <ul className="flex flex-col gap-0.5">
                            {resumeData.experience.slice(0, 2).map((exp, idx) => (
                              <li key={idx} className="truncate">
                                <span className="font-semibold text-white">{exp.jobTitle}</span> at {exp.company}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-zinc-700">No work history records added.</span>
                        )
                      )}

                      {sec.id === 'education' && (
                        resumeData.education.length > 0 ? (
                          <ul className="flex flex-col gap-0.5">
                            {resumeData.education.slice(0, 2).map((edu, idx) => (
                              <li key={idx} className="truncate">
                                <span className="font-semibold text-white">{edu.degree}</span> @ {edu.school}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-zinc-600">No academic background added.</span>
                        )
                      )}

                      {sec.id === 'skills' && (
                        resumeData.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {resumeData.skills.slice(0, 4).map((sk) => (
                              <span key={sk} className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                                {sk}
                              </span>
                            ))}
                            {resumeData.skills.length > 4 && (
                              <span className="text-[9px] text-zinc-500 align-self-center ml-1">
                                +{resumeData.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-zinc-700">No core skills entered in the grid.</span>
                        )
                      )}

                      {sec.id === 'projects' && (
                        resumeData.projects && resumeData.projects.length > 0 ? (
                          <ul className="flex flex-col gap-0.5">
                            {resumeData.projects.slice(0, 2).map((proj, idx) => (
                              <li key={idx} className="truncate font-semibold text-white">
                                • {proj.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-zinc-700">No key projects cataloged yet.</span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-2 mt-2 flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-wider group-hover:text-red-400 transition-colors">
                  <span>Configure Section</span>
                  <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
