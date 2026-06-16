import type { ResumeData } from '../../types/resume'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'

interface ExecutiveTemplateProps {
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

export default function ExecutiveTemplate({ 
  data, 
  activeSection, 
  atsMode, 
  onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  onDragStart,
  onDragOver,
  onDrop,
  themeColor = '#e11d48'
}: ExecutiveTemplateProps) {
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
    if (!contact.linkedin?.trim() || !contact.location?.trim()) {
      return { rating: 'warning' as const, feedback: 'Add LinkedIn and location info to improve match index.' }
    }
    return { rating: 'safe' as const, feedback: 'Contact profile formatted cleanly.' }
  }

  const getSummaryAts = () => {
    if (!summary?.trim()) {
      return { rating: 'danger' as const, feedback: 'Professional summary is highly recommended.' }
    }
    if (/\b(I|my|me|we|our)\b/i.test(summary)) {
      return { rating: 'warning' as const, feedback: 'Avoid personal pronouns (e.g. I, my) for ATS compliance.' }
    }
    if (summary.length < 100) {
      return { rating: 'warning' as const, feedback: 'Summary is short. Write 2-3 detailed sentences.' }
    }
    return { rating: 'safe' as const, feedback: 'Excellent action-verb focus, ATS-safe.' }
  }

  const getExperienceAts = () => {
    if (!experience || experience.length === 0) {
      return { rating: 'danger' as const, feedback: 'Work experience history is critical for applicant tracking.' }
    }
    const hasPronouns = experience.some(exp => exp.bullets.some(b => /\b(I|my|me|we|our)\b/i.test(b)))
    if (hasPronouns) {
      return { rating: 'warning' as const, feedback: 'Remove first-person pronouns from job details.' }
    }
    return { rating: 'safe' as const, feedback: 'Work entries ordered chronologically and ATS-safe.' }
  }

  const getProjectsAts = () => {
    if (!projects || projects.length === 0) {
      return { rating: 'warning' as const, feedback: 'Add 1-2 projects to showcase technical capabilities.' }
    }
    return { rating: 'safe' as const, feedback: 'Side projects outline tech stacks nicely.' }
  }

  const getEducationAts = () => {
    if (!education || education.length === 0) {
      return { rating: 'danger' as const, feedback: 'Academic history is highly recommended.' }
    }
    const hasGpaWarning = education.some(edu => {
      const val = parseFloat(edu.gpa || '')
      return !isNaN(val) && val < 3.5
    })
    if (hasGpaWarning) {
      return { rating: 'warning' as const, feedback: 'GPA below 3.5 should be removed to avoid filter filters.' }
    }
    return { rating: 'safe' as const, feedback: 'Academic credentials listed clearly.' }
  }

  const getSkillsAts = () => {
    if (!skills || skills.length === 0) {
      return { rating: 'danger' as const, feedback: 'Skills list is mandatory for keyword indexing.' }
    }
    if (skills.length < 6) {
      return { rating: 'warning' as const, feedback: 'List at least 6-8 core technical skill terms.' }
    }
    return { rating: 'safe' as const, feedback: 'Keywords match candidate database indexes.' }
  }

  const contactAts = getContactAts()
  const summaryAts = getSummaryAts()
  const experienceAts = getExperienceAts()
  const projectsAts = getProjectsAts()
  const educationAts = getEducationAts()
  const skillsAts = getSkillsAts()

  // Right Panel Sections Mapping
  const rightSectionsMap: Record<string, React.ReactNode> = {
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
        <div className="space-y-2">
          <h2 className="text-[11px] font-black tracking-widest text-slate-900 border-b-2 border-slate-100 pb-1 font-serif section-heading">
            {SECTION_LABELS.summary}
          </h2>
          <p className="text-[10px] leading-relaxed text-justify text-slate-770">{summary}</p>
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
        <div className="space-y-3">
          <h2 className="text-[11px] font-black tracking-widest text-slate-900 border-b-2 border-slate-100 pb-1 font-serif section-heading">
            {SECTION_LABELS.experience}
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-1 exp-entry">
                <div className="flex justify-between items-baseline font-sans">
                  <div className="text-[10.5px] font-bold text-slate-900">
                    {exp.jobTitle} <span className="font-normal text-slate-500">— {exp.company}</span>
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-600 shrink-0 ml-4 font-mono">
                    {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[9px] text-slate-400 italic -mt-0.5">{exp.location}</div>
                )}
                <ul className="space-y-1 pl-4">
                  {exp.bullets.filter(b => b.trim() !== '').map((bullet, idx) => (
                    <li key={idx} className="text-[9.5px] leading-relaxed text-justify list-disc text-slate-700 pl-0.5 font-sans">
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
        <div className="space-y-3">
          <h2 className="text-[11px] font-black tracking-widest text-slate-900 border-b-2 border-slate-100 pb-1 font-serif section-heading">
            {SECTION_LABELS.projects}
          </h2>
          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="space-y-0.5 font-sans proj-entry">
                <div className="flex justify-between items-baseline">
                  <div className="text-[10.5px] font-bold text-slate-900">
                    {proj.name} {proj.link && <span className="font-normal text-[8.5px] text-slate-400">({proj.link})</span>}
                  </div>
                  <div className="text-[9.5px] font-semibold text-slate-500">
                    {proj.technologies.join(', ')}
                  </div>
                </div>
                <p className="text-[9.5px] leading-relaxed text-slate-700 text-justify">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null
  }

  // Filter reordered list specifically for right canvas
  const rightSectionOrder = sectionOrder.filter(secId => ['summary', 'experience', 'projects'].includes(secId))

  return (
    <div className="flex min-h-[1070px] print:min-h-0 overflow-hidden rounded-sm text-slate-800 font-sans select-text max-w-full">
      {/* Left Sidebar (32% width) - Deep Navy/Slate Panel */}
      <div className="w-[32%] bg-[#0f172a] text-slate-100 p-5 flex flex-col gap-6 shrink-0 sidebar-column no-print-background-hack">
        
        {/* Contact Header */}
        <PreviewSectionWrapper
          sectionId="contact"
          activeSection={activeSection}
          atsMode={atsMode}
          atsRating={contactAts.rating}
          atsFeedback={contactAts.feedback}
          onEdit={onEditSection}
        >
          <div className="space-y-3">
            <h1 className="text-xl font-black tracking-tight text-white leading-tight resume-name">
              {getFullName(contact) || 'YOUR NAME'}
            </h1>
            <div className="h-0.5 w-12 rounded" style={{ backgroundColor: themeColor }} />
            <div className="space-y-2 text-[9.5px] text-slate-300 font-light leading-relaxed break-all">
              {contact.location && (
                <div>
                  <span className="font-bold text-slate-400 block text-[8px] tracking-wide sidebar-label">Location</span>
                  {contact.location}
                </div>
              )}
              {contact.email && (
                <div>
                  <span className="font-bold text-slate-400 block text-[8px] tracking-wide sidebar-label">Email</span>
                  {contact.email}
                </div>
              )}
              {contact.phone && (
                <div>
                  <span className="font-bold text-slate-400 block text-[8px] tracking-wide sidebar-label">Phone</span>
                  {contact.phone}
                </div>
              )}
              {contact.linkedin && (
                <div>
                  <span className="font-bold text-slate-400 block text-[8px] tracking-wide sidebar-label">LinkedIn</span>
                  {contact.linkedin}
                </div>
              )}
              {contact.website && (
                <div>
                  <span className="font-bold text-slate-400 block text-[8px] tracking-wide sidebar-label">Website</span>
                  {contact.website}
                </div>
              )}
            </div>
          </div>
        </PreviewSectionWrapper>

        {/* Education History in Sidebar */}
        {education && education.length > 0 && (
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
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h2 className="text-[10px] font-black tracking-wider text-slate-400 section-heading">
                {SECTION_LABELS.education}
              </h2>
              <div className="space-y-3">
                {education
                  .filter(edu => edu.school?.trim() || edu.degree?.trim())
                  .map((edu) => (
                    <div key={edu.id} className="edu-entry space-y-0.5 text-[9.5px]">
                      <div className="flex justify-between items-baseline font-sans">
                        <span className="font-bold text-white">
                          {edu.school || 'Institution Name'}
                        </span>
                        <span className="font-semibold text-[8.5px]" style={{ color: themeColor }}>{formatDate(edu.graduationDate)}</span>
                      </div>
                      <div className="text-slate-300">
                        <span className="italic">{edu.degree}</span>
                        {edu.location && ` · ${edu.location}`}
                        {edu.gpa && parseFloat(edu.gpa) >= 3.5 && ` · GPA: ${edu.gpa}`}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </PreviewSectionWrapper>
        )}

        {/* Skills Competencies in Sidebar */}
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
            <div className="space-y-3 pt-2 border-t border-slate-800 flex-1">
              <h2 className="text-[10px] font-black tracking-wider text-slate-400 section-heading">
                {SECTION_LABELS.skills}
              </h2>
              <p className="text-[9.5px] leading-relaxed text-slate-300">
                {skills.join(' · ')}
              </p>
            </div>
          </PreviewSectionWrapper>
        )}

        {/* Languages in Sidebar */}
        {data.languages && data.languages.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h2 className="text-[10px] font-black tracking-wider text-slate-400 section-heading">
              {SECTION_LABELS.languages}
            </h2>
            <div className="space-y-1 text-[9.5px] text-slate-300">
              {data.languages.map((lang) => (
                <div key={lang.id}>
                  <span className="font-semibold text-white">{lang.name}</span>
                  <span className="text-slate-400"> — {lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Canvas (68% width) - Main White Page */}
      <div className="flex-1 bg-white p-10 flex flex-col gap-6 main-column">
        {rightSectionOrder.map((secId) => {
          const component = rightSectionsMap[secId]
          return component ? <div key={secId}>{component}</div> : null
        })}
      </div>
    </div>
  )
}
