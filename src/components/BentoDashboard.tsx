import { useMemo } from 'react'
import type { ResumeData } from '../types/resume'
import type { SectionType } from './SectionSidebar'
import { getSectionStatus } from '../utils/completionHelper'
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderGit, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Trophy,
  Award,
  Heart,
  BookOpen,
  Phone,
  HandHeart,
  Globe
} from 'lucide-react'

const SECTIONS: { id: SectionType; icon: React.ElementType }[] = [
  { id: 'contact', icon: User },
  { id: 'summary', icon: FileText },
  { id: 'experience', icon: Briefcase },
  { id: 'education', icon: GraduationCap },
  { id: 'skills', icon: Wrench },
  { id: 'languages', icon: Globe },
  { id: 'projects', icon: FolderGit },
  { id: 'awards', icon: Trophy },
  { id: 'certifications', icon: Award },
  { id: 'interests', icon: Heart },
  { id: 'publications', icon: BookOpen },
  { id: 'references', icon: Phone },
  { id: 'volunteer', icon: HandHeart },
]

interface BentoDashboardProps {
  resumeData: ResumeData
  onSelectSection: (section: SectionType) => void
}

export default function BentoDashboard({ resumeData, onSelectSection }: BentoDashboardProps) {
  
  // Pre-compute all section stats once per resumeData change (instead of per-section function calls)
  const allSectionStats = useMemo(() => {
    const boolStatus = getSectionStatus(resumeData)

    const SECTION_LABELS: Record<SectionType, string> = {
      contact: 'Contact Info', summary: 'Profile Summary', experience: 'Work Experience',
      education: 'Education', skills: 'Core Skills', languages: 'Languages',
      projects: 'Projects', awards: 'Awards & Honors', certifications: 'Certifications',
      interests: 'Interests', publications: 'Publications', references: 'References',
      volunteer: 'Volunteer',
    }

    const result = {} as Record<SectionType, { percent: number; status: 'empty' | 'partial' | 'complete'; label: string }>

    for (const key of Object.keys(boolStatus) as SectionType[]) {
      const isComplete = boolStatus[key]
      const isEmpty = (() => {
        if (key === 'contact') return !resumeData.contact?.fullName?.trim() && !resumeData.contact?.email?.trim()
        if (key === 'summary') return !resumeData.summary?.trim()
        const arr = (resumeData as unknown as Record<string, unknown>)[key]
        return Array.isArray(arr) ? arr.length === 0 : false
      })()

      result[key] = {
        percent: isComplete ? 100 : isEmpty ? 0 : 50,
        status: isComplete ? 'complete' : isEmpty ? 'empty' : 'partial',
        label: SECTION_LABELS[key],
      }
    }

    return result
  }, [resumeData])

  const getSectionStats = (section: SectionType) => allSectionStats[section]

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
          {SECTIONS.map((sec) => {
            const Icon = sec.icon
            const { percent, status, label } = getSectionStats(sec.id)
            
            return (
              <div
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectSection(sec.id) } }}
                role="button"
                tabIndex={0}
                className="tm-card flex flex-col justify-between min-h-[96px] p-3 cursor-pointer hover:border-red-500/25 transition-all group focus-visible:outline-2 focus-visible:outline-red-500"
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
                            {resumeData.experience.slice(0, 2).map((exp) => (
                              <li key={exp.id} className="truncate">
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
                            {resumeData.education.slice(0, 2).map((edu) => (
                              <li key={edu.id} className="truncate">
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
                            {resumeData.projects.slice(0, 2).map((proj) => (
                              <li key={proj.id} className="truncate font-semibold text-white">
                                • {proj.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-zinc-700">No key projects cataloged yet.</span>
                        )
                      )}

                      {sec.id === 'awards' && (
                        resumeData.awards && resumeData.awards.length > 0 ? (
                          <span className="text-white font-semibold">{resumeData.awards[0].title}</span>
                        ) : (
                          <span className="italic text-zinc-700">No awards added.</span>
                        )
                      )}

                      {sec.id === 'certifications' && (
                        resumeData.certifications && resumeData.certifications.length > 0 ? (
                          <span className="text-white font-semibold">{resumeData.certifications[0].title}</span>
                        ) : (
                          <span className="italic text-zinc-700">No certifications added.</span>
                        )
                      )}

                      {sec.id === 'interests' && (
                        resumeData.interests && resumeData.interests.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {resumeData.interests.slice(0, 3).map((i) => (
                              <span key={i.id} className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20">
                                {i.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-zinc-700">No interests added.</span>
                        )
                      )}

                      {sec.id === 'publications' && (
                        resumeData.publications && resumeData.publications.length > 0 ? (
                          <span className="text-white font-semibold">{resumeData.publications[0].title}</span>
                        ) : (
                          <span className="italic text-zinc-700">No publications added.</span>
                        )
                      )}

                      {sec.id === 'references' && (
                        resumeData.references && resumeData.references.length > 0 ? (
                          <span className="text-white font-semibold">{resumeData.references[0].name}</span>
                        ) : (
                          <span className="italic text-zinc-700">No references added.</span>
                        )
                      )}

                      {sec.id === 'volunteer' && (
                        resumeData.volunteer && resumeData.volunteer.length > 0 ? (
                          <span className="text-white font-semibold">{resumeData.volunteer[0].organization}</span>
                        ) : (
                          <span className="italic text-zinc-700">No volunteer experience added.</span>
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
