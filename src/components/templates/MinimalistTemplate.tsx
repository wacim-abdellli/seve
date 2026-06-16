import type { ResumeData } from '../../types/resume'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'

interface MinimalistTemplateProps {
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

export default function MinimalistTemplate({ 
  data, 
  activeSection, 
  atsMode, 
  onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  onDragStart,
  onDragOver,
  onDrop,
  themeColor
}: MinimalistTemplateProps) {
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

  // Dynamic sections lookup mapping
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
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 font-serif" style={{ borderBottomColor: themeColor || '#cbd5e1' }}>
            Professional Summary
          </h2>
          <p className="text-[10px] leading-relaxed text-justify text-slate-700">{summary}</p>
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
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-2 font-serif" style={{ borderBottomColor: themeColor || '#cbd5e1' }}>
            Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-1 exp-entry">
                <div className="flex justify-between items-baseline font-serif">
                  <div className="text-[10.5px] font-bold text-slate-950">
                    {exp.jobTitle} <span className="font-normal text-slate-500">— {exp.company}</span>
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-500 font-mono">
                    {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[8.5px] text-slate-400 italic -mt-0.5">{exp.location}</div>
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
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-2 font-serif" style={{ borderBottomColor: themeColor || '#cbd5e1' }}>
            Projects
          </h2>
          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="space-y-0.5 font-serif proj-entry">
                <div className="flex justify-between items-baseline">
                  <div className="text-[10.5px] font-bold text-slate-950">
                    {proj.name} {proj.link && <span className="font-normal text-[8.5px] text-slate-500 lowercase">({proj.link})</span>}
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-500">
                    {proj.technologies.join(', ')}
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed text-justify text-slate-700">{proj.description}</p>
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
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-2 font-serif" style={{ borderBottomColor: themeColor || '#cbd5e1' }}>
            Education
          </h2>
          <div className="space-y-4">
            {education
              .filter(edu => edu.school?.trim() || edu.degree?.trim())
              .map((edu) => (
                <div key={edu.id} className="edu-entry">
                  {/* School & graduation date */}
                  <div className="flex justify-between items-baseline font-serif">
                    <span className="text-[10.5px] font-bold text-slate-950">
                      {edu.school || 'Institution Name'}
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-500 font-mono">
                      {formatDate(edu.graduationDate)}
                    </span>
                  </div>
                  
                  {/* Degree — secondary */}
                  <div className="text-[9.5px] text-slate-500 mt-0.5 font-serif">
                    <span>{edu.degree}</span>
                    {edu.location && ` · ${edu.location}`}
                    {edu.gpa && parseFloat(edu.gpa) >= 3.5 && ` · GPA: ${edu.gpa}`}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    languages: data.languages && data.languages.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="languages"
        activeSection={activeSection}
        atsMode={atsMode}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'languages')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('languages')}
      >
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 font-serif" style={{ borderBottomColor: themeColor || '#cbd5e1' }}>
            {SECTION_LABELS.languages}
          </h2>
          <div className="text-[10px] leading-relaxed text-slate-700 font-serif" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
            {data.languages.map((lang, idx) => (
              <span key={lang.id}>
                {idx > 0 && ' · '}
                <span>{lang.name} ({lang.proficiency})</span>
              </span>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    skills: skills && skills.length > 0 ? (
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
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 font-serif" style={{ borderBottomColor: themeColor || '#cbd5e1' }}>
            Skills
          </h2>
          <div className="text-[10px] leading-relaxed text-justify text-slate-700 font-serif" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
            {skills.map((skill, idx) => {
              const parts = skill.split(':')
              if (parts.length > 1 && parts[0].trim().length < 30) {
                return (
                  <span key={skill}>
                    {idx > 0 && ' , '}
                    <strong className="font-extrabold text-slate-950">{parts[0].trim()}:</strong>
                    <span> {parts.slice(1).join(':')}</span>
                  </span>
                )
              }
              return (
                <span key={skill}>
                  {idx > 0 && ' , '}
                  <span>{skill}</span>
                </span>
              )
            })}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null
  }

  return (
    <div className="font-serif text-[10pt] leading-normal text-slate-800 p-10 select-text max-w-full space-y-5">
      
      {/* Contact Header (Always Top) */}
      <PreviewSectionWrapper
        sectionId="contact"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={contactAts.rating}
        atsFeedback={contactAts.feedback}
        onEdit={onEditSection}
      >
        <div className="text-left border-b-2 pb-2 mb-2" style={{ borderBottomColor: themeColor || '#111111' }}>
          <h1 className="text-2xl font-bold font-serif uppercase tracking-wider text-slate-950 mb-1">
            {getFullName(contact) || 'YOUR NAME'}
          </h1>
          <div className="text-[9.5px] text-slate-500 uppercase tracking-widest flex flex-wrap gap-x-3 gap-y-1">
            {contact.location && <span>{contact.location}</span>}
            {contact.email && <span>• {contact.email}</span>}
            {contact.phone && <span>• {contact.phone}</span>}
            {contact.linkedin && <span>• {contact.linkedin}</span>}
            {contact.website && <span>• {contact.website}</span>}
          </div>
        </div>
      </PreviewSectionWrapper>

      {/* Reordered Body Sections */}
      {sectionOrder.map((secId) => {
        const component = sectionsMap[secId]
        return component ? <div key={secId}>{component}</div> : null
      })}
      
    </div>
  )
}
