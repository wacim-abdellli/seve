import type { ResumeData } from '../../types/resume'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import { User, Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, FolderGit, Wrench, FileText } from 'lucide-react'

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

interface CreativeTemplateProps {
  data: ResumeData
  activeSection?: string | null
  atsMode?: boolean
  onEditSection?: (section: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects') => void
  sectionOrder?: string[]
  onDragStart?: (e: React.DragEvent, sectionId: 'summary' | 'experience' | 'education' | 'skills' | 'projects') => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (sectionId: 'summary' | 'experience' | 'education' | 'skills' | 'projects') => void
  themeColor?: string
}

export default function CreativeTemplate({ 
  data, 
  activeSection, 
  atsMode, 
  onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  onDragStart,
  onDragOver,
  onDrop,
  themeColor = '#e11d48'
}: CreativeTemplateProps) {
  const { contact, summary } = data
  const experience = (data.experience || []).filter(
    (exp) => exp.jobTitle?.trim() && exp.company?.trim()
  )
  const education = (data.education || []).filter(
    (edu) => edu.school?.trim() && edu.degree?.trim()
  )
  const skills = (data.skills || []).filter((s) => s?.trim())
  const projects = (data.projects || []).filter((p) => p.name?.trim())


  // ATS Heuristics
  const getContactAts = () => {
    if (!contact.fullName?.trim() || !contact.email?.trim() || !contact.phone?.trim()) {
      return { rating: 'danger' as const, feedback: 'Name, email, and phone are required contact details.' }
    }
    return { rating: 'safe' as const, feedback: 'Contact profile formatted cleanly.' }
  }

  const getSummaryAts = () => {
    if (!summary?.trim()) {
      return { rating: 'danger' as const, feedback: 'Professional summary is highly recommended.' }
    }
    return { rating: 'safe' as const, feedback: 'Summary details clean and ATS-safe.' }
  }

  const getExperienceAts = () => {
    if (!experience || experience.length === 0) {
      return { rating: 'danger' as const, feedback: 'Work experience history is critical for applicant tracking.' }
    }
    return { rating: 'safe' as const, feedback: 'Work entries ordered chronologically and ATS-safe.' }
  }

  const getProjectsAts = () => {
    if (!projects || projects.length === 0) {
      return { rating: 'warning' as const, feedback: 'Add 1-2 projects to showcase technical capabilities.' }
    }
    return { rating: 'safe' as const, feedback: 'Projects list is ATS-compliant.' }
  }

  const getEducationAts = () => {
    if (!education || education.length === 0) {
      return { rating: 'danger' as const, feedback: 'Academic history is highly recommended.' }
    }
    return { rating: 'safe' as const, feedback: 'Academic credentials listed clearly.' }
  }

  const getSkillsAts = () => {
    if (!skills || skills.length === 0) {
      return { rating: 'danger' as const, feedback: 'Skills list is mandatory for keyword indexing.' }
    }
    return { rating: 'safe' as const, feedback: 'Keywords match candidate database indexes.' }
  }

  const contactAts = getContactAts()
  const summaryAts = getSummaryAts()
  const experienceAts = getExperienceAts()
  const projectsAts = getProjectsAts()
  const educationAts = getEducationAts()
  const skillsAts = getSkillsAts()

  // Left Column Content (Contact details, Skills)
  const leftColumnContent = (
    <div className="space-y-6">
      
      {/* Contact info block */}
      <PreviewSectionWrapper
        sectionId="contact"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={contactAts.rating}
        atsFeedback={contactAts.feedback}
        onEdit={onEditSection}
      >
        <div className="space-y-3">
          <div className="pb-1.5 border-b flex items-center gap-1.5" style={{ borderBottomColor: `${themeColor}20` }}>
            <User className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h3 className="text-[9.5px] font-black uppercase tracking-wider text-slate-900">Info</h3>
          </div>
          <div className="space-y-2 text-[9px] text-slate-700 font-medium">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                <span>{contact.location}</span>
              </div>
            )}
            {contact.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                <span className="truncate">{contact.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '')}</span>
              </div>
            )}
            {contact.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                <span className="truncate">{contact.website.replace(/^(https?:\/\/)?(www\.)?/, '')}</span>
              </div>
            )}
          </div>
        </div>
      </PreviewSectionWrapper>

      {/* Skills list block */}
      {skills && skills.length > 0 && (
        <PreviewSectionWrapper
          sectionId="skills"
          activeSection={activeSection}
          atsMode={atsMode}
          atsRating={skillsAts.rating}
          atsFeedback={skillsAts.feedback}
          onEdit={onEditSection}
          onDragStart={(e) => onDragStart?.(e, 'skills')}
          onDragOver={onDragOver}
          onDrop={() => onDrop?.('skills')}
        >
          <div className="space-y-3">
            <div className="pb-1.5 border-b flex items-center gap-1.5" style={{ borderBottomColor: `${themeColor}20` }}>
              <Wrench className="w-3.5 h-3.5" style={{ color: themeColor }} />
              <h3 className="text-[9.5px] font-black uppercase tracking-wider text-slate-900">Skills</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => {
                const parts = skill.split(':')
                if (parts.length > 1 && parts[0].trim().length < 30) {
                  return (
                    <span 
                      key={skill} 
                      className="text-[8.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border"
                      style={{ 
                        backgroundColor: `${themeColor}10`, 
                        borderColor: `${themeColor}30`, 
                        color: themeColor 
                      }}
                    >
                      <strong className="font-extrabold text-slate-950 mr-1">{parts[0].trim()}:</strong>
                      {parts.slice(1).join(':')}
                    </span>
                  )
                }
                return (
                  <span 
                    key={skill} 
                    className="text-[8.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border"
                    style={{ 
                      backgroundColor: `${themeColor}10`, 
                      borderColor: `${themeColor}30`, 
                      color: themeColor 
                    }}
                  >
                    {skill}
                  </span>
                )
              })}
            </div>
          </div>
        </PreviewSectionWrapper>
      )}

    </div>
  )

  // Right Column Content dynamic builder
  const sectionsMap: Record<string, React.ReactNode> = {
    summary: summary ? (
      <PreviewSectionWrapper
        sectionId="summary"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={summaryAts.rating}
        atsFeedback={summaryAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'summary')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('summary')}
      >
        <div className="mb-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-2.5">
            <FileText className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-900 font-sans">
              Summary
            </h2>
          </div>
          <p className="text-[9.5px] leading-relaxed text-justify text-slate-755">{summary}</p>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    experience: experience && experience.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="experience"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={experienceAts.rating}
        atsFeedback={experienceAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'experience')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('experience')}
      >
        <div className="mb-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-3">
            <Briefcase className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-900 font-sans">
              Experience
            </h2>
          </div>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-sans">
                  <div className="text-[9.5px] font-extrabold text-slate-900">
                    {exp.jobTitle} &mdash; <span className="font-bold" style={{ color: themeColor }}>{exp.company}</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 font-mono">
                    {exp.startDate} &ndash; {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[8.5px] text-slate-500 italic -mt-0.5">{exp.location}</div>
                )}
                <ul className="space-y-0.5 pl-4">
                  {exp.bullets.filter(b => b.trim() !== '').map((bullet, idx) => (
                    <li key={idx} className="text-[9.5px] leading-relaxed text-justify list-disc text-slate-700 pl-0.5">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    projects: projects && projects.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="projects"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={projectsAts.rating}
        atsFeedback={projectsAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'projects')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('projects')}
      >
        <div className="mb-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-3">
            <FolderGit className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-900 font-sans">
              Projects
            </h2>
          </div>
          <div className="space-y-3">
            {projects
              .filter(proj => proj.name?.trim())
              .map((proj) => (
              <div key={proj.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-sans">
                  <div className="text-[9.5px] font-bold text-slate-900">
                    {proj.name} {proj.link && <span className="font-normal text-[8px] text-slate-500 lowercase">({proj.link})</span>}
                  </div>
                  <div className="text-[8.5px] font-bold" style={{ color: themeColor }}>
                    {proj.technologies.join(' · ')}
                  </div>
                </div>
                <p className="text-[9.5px] leading-relaxed text-justify text-slate-700">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    education: education && education.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="education"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={educationAts.rating}
        atsFeedback={educationAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'education')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('education')}
      >
        <div className="mb-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-2.5">
            <GraduationCap className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-900 font-sans">
              Education
            </h2>
          </div>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="edu-entry mb-2 last:mb-0 font-sans">
                {/* School name — primary, bold */}
                <div className="flex justify-between items-baseline">
                  <span className="text-[9.5px] font-bold text-slate-900">
                    {edu.school || 'Institution Name'}
                  </span>
                  <span className="font-bold text-[8.5px]" style={{ color: themeColor }}>{edu.graduationDate}</span>
                </div>
                {/* Degree / details */}
                <div className="text-[9px] text-slate-500 mt-0.5">
                  <span className="italic">{edu.degree}</span>
                  {edu.location && ` · ${edu.location}`}
                  {edu.gpa && parseFloat(edu.gpa) >= 3.5 && ` · GPA: ${edu.gpa}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,
  }

  return (
    <div className="font-sans text-[9.5pt] leading-normal text-slate-800 p-0 select-text max-w-full flex h-full min-h-[1059px] overflow-hidden">
      
      {/* 2-Column Grid Container */}
      <div className="flex w-full">
        
        {/* Left column (Off-white sidebar) */}
        <div className="w-[220px] p-6 space-y-6 flex flex-col justify-start shrink-0" style={{ backgroundColor: `${themeColor}05`, borderRightWidth: 1, borderRightColor: `${themeColor}15` }}>
          
          {/* Circular name abbreviation visual header */}
          <div className="space-y-3.5 text-left pt-2 pb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-black tracking-wide shadow-md" style={{ background: `linear-gradient(to top right, ${themeColor}, ${themeColor}bb)`, boxShadow: `0 4px 12px ${themeColor}20` }}>
              {contact.fullName ? contact.fullName.split(' ').map(n => n.charAt(0)).slice(0,2).join('').toUpperCase() : 'ME'}
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 leading-tight tracking-tight">
                {contact.fullName || 'YOUR NAME'}
              </h1>
              <span className="text-[8px] font-black tracking-widest uppercase block mt-1" style={{ color: themeColor }}>Candidate Profile</span>
            </div>
          </div>

          {leftColumnContent}
        </div>

        {/* Right column (Main details area) */}
        <div className="flex-1 p-10 space-y-5">
          {sectionOrder.filter(secId => secId !== 'skills').map((secId) => {
            const component = sectionsMap[secId]
            return component ? <div key={secId}>{component}</div> : null
          })}
        </div>

      </div>

    </div>
  )
}
