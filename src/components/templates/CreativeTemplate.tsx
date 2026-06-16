import type { ResumeData } from '../../types/resume'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
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
  onEditSection?: (section: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects') => void
  sectionOrder?: string[]
  onDragStart?: (e: React.DragEvent, sectionId: 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects') => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (sectionId: 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects') => void
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
              <h3 className="text-[9.5px] font-black tracking-wider text-slate-900 section-heading">{SECTION_LABELS.skills}</h3>
            </div>
            <p className="text-[9px] leading-relaxed text-slate-700">
              {skills.join(' · ')}
            </p>
          </div>
        </PreviewSectionWrapper>
      )}

      {/* Languages list block */}
      {data.languages && data.languages.length > 0 && (
        <div className="space-y-3">
          <div className="pb-1.5 border-b flex items-center gap-1.5" style={{ borderBottomColor: `${themeColor}20` }}>
            <Globe className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h3 className="text-[9.5px] font-black tracking-wider text-slate-900 section-heading">{SECTION_LABELS.languages}</h3>
          </div>
          <div className="space-y-1 text-[9px] text-slate-700">
            {data.languages.map((lang) => (
              <div key={lang.id}>
                <span className="font-semibold text-slate-900">{lang.name}</span>
                <span className="text-slate-500"> — {lang.proficiency}</span>
              </div>
            ))}
          </div>
        </div>
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
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.summary}
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
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.experience}
            </h2>
          </div>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-0.5 exp-entry">
                <div className="flex justify-between items-baseline font-sans">
                  <div className="text-[9.5px] font-extrabold text-slate-900">
                    {exp.jobTitle} &mdash; <span className="font-bold" style={{ color: themeColor }}>{exp.company}</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 font-mono">
                    {formatDate(exp.startDate)} &ndash; {exp.current ? 'Present' : formatDate(exp.endDate)}
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
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.projects}
            </h2>
          </div>
          <div className="space-y-3">
            {projects
              .filter(proj => proj.name?.trim())
              .map((proj) => (
               <div key={proj.id} className="proj-entry" style={{ marginBottom: '8pt' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: '700', fontSize: '9.5pt', color: '#0f172a' }}>
                      {proj.name}
                    </span>
                    {proj.link && (
                      <span style={{ fontSize: '8pt', color: '#666666', fontStyle: 'italic' }}>
                        {proj.link}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '9pt', color: '#555555', fontStyle: 'italic', margin: '1pt 0 2pt 0' }}>
                    {proj.technologies.join(' · ')}
                  </p>
                  <p style={{ fontSize: '9.5pt', color: '#111111', lineHeight: '1.45', margin: '0' }}>
                    {proj.description}
                  </p>
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
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.education}
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
                  <span className="font-bold text-[8.5px]" style={{ color: themeColor }}>{formatDate(edu.graduationDate)}</span>
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
        <div className="w-[220px] p-6 space-y-6 flex flex-col justify-start shrink-0 left-column" style={{ backgroundColor: `${themeColor}05`, borderRightWidth: 1, borderRightColor: `${themeColor}15` }}>
          
          {/* Circular name abbreviation visual header */}
          <div className="space-y-3.5 text-left pt-2 pb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-black tracking-wide shadow-md print:shadow-none avatar-circle no-print" style={{ background: `linear-gradient(to top right, ${themeColor}, ${themeColor}bb)`, boxShadow: `0 4px 12px ${themeColor}20` }}>
              {getFullName(contact) ? getFullName(contact).split(' ').map(n => n.charAt(0)).slice(0,2).join('').toUpperCase() : 'ME'}
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 leading-tight tracking-tight">
                {getFullName(contact) || 'YOUR NAME'}
              </h1>
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
