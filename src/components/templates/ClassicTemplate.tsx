import type { ResumeData } from '../../types/resume'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'

interface ClassicTemplateProps {
  data: ResumeData
  activeSection?: string | null
  atsMode?: boolean
  onEditSection?: (section: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer') => void
  sectionOrder?: string[]
  onDragStart?: (e: React.DragEvent, sectionId: 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer') => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (sectionId: 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer') => void
  themeColor?: string
}

export default function ClassicTemplate({ 
  data, 
  activeSection, 
  atsMode, 
  onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  onDragStart,
  onDragOver,
  onDrop,
  themeColor
}: ClassicTemplateProps) {
  const { contact, summary } = data
  const experience = (data.experience || []).filter(
    (exp) => exp.jobTitle?.trim() && exp.company?.trim()
  )
  const education = (data.education || []).filter(
    (edu) => edu.school?.trim() && edu.degree?.trim()
  )
  const skills = (data.skills || []).filter((s) => s?.trim())
  const projects = (data.projects || []).filter((p) => p.name?.trim())
  const languages = (data.languages || []).filter((l) => l.name?.trim())
  const awards = (data.awards || []).filter((a) => a.title?.trim())
  const certifications = (data.certifications || []).filter((c) => c.title?.trim())
  const interests = (data.interests || []).filter((i) => i.name?.trim())
  const publications = (data.publications || []).filter((p) => p.title?.trim())
  const references = (data.references || []).filter((r) => r.name?.trim())
  const volunteer = (data.volunteer || []).filter((v) => v.organization?.trim())


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

  const getLanguagesAts = () => {
    if (!languages || languages.length === 0) {
      return { rating: 'warning' as const, feedback: 'Languages section shows global readiness.' }
    }
    return { rating: 'safe' as const, feedback: 'Languages listed.' }
  }

  const getAwardsAts = () => {
    if (!awards || awards.length === 0) return { rating: 'safe' as const, feedback: 'No awards listed.' }
    return { rating: 'safe' as const, feedback: 'Awards showcase distinct performance.' }
  }

  const getCertificationsAts = () => {
    if (!certifications || certifications.length === 0) return { rating: 'warning' as const, feedback: 'Certifications add professional credibility.' }
    return { rating: 'safe' as const, feedback: 'Certifications validate expertise.' }
  }

  const getInterestsAts = () => {
    if (!interests || interests.length === 0) return { rating: 'safe' as const, feedback: 'No interests listed.' }
    return { rating: 'safe' as const, feedback: 'Interests add personality.' }
  }

  const getPublicationsAts = () => {
    if (!publications || publications.length === 0) return { rating: 'safe' as const, feedback: 'No publications listed.' }
    return { rating: 'safe' as const, feedback: 'Publications demonstrate thought leadership.' }
  }

  const getReferencesAts = () => {
    if (!references || references.length === 0) return { rating: 'safe' as const, feedback: 'No references listed.' }
    return { rating: 'safe' as const, feedback: 'References available.' }
  }

  const getVolunteerAts = () => {
    if (!volunteer || volunteer.length === 0) return { rating: 'safe' as const, feedback: 'No volunteer experience listed.' }
    return { rating: 'safe' as const, feedback: 'Volunteer work shows community engagement.' }
  }

  const contactAts = getContactAts()
  const summaryAts = getSummaryAts()
  const experienceAts = getExperienceAts()
  const projectsAts = getProjectsAts()
  const educationAts = getEducationAts()
  const skillsAts = getSkillsAts()
  const languagesAts = getLanguagesAts()
  const awardsAts = getAwardsAts()
  const certificationsAts = getCertificationsAts()
  const interestsAts = getInterestsAts()
  const publicationsAts = getPublicationsAts()
  const referencesAts = getReferencesAts()
  const volunteerAts = getVolunteerAts()

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
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.summary}
          </h2>
          <p className="text-[10px] leading-relaxed text-justify text-slate-800">{summary}</p>
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
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2.5 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.experience}
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-1 exp-entry">
                <div className="flex justify-between items-baseline font-serif">
                  <div className="text-[10.5px] font-extrabold text-slate-950">
                    {exp.jobTitle} &mdash; <span className="font-medium text-slate-700">{exp.company}</span>
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-500 font-mono">
                    {formatDate(exp.startDate)} &ndash; {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[8.5px] text-slate-500 italic -mt-0.5">{exp.location}</div>
                )}
                <ul className="space-y-0.5 pl-4">
                  {exp.bullets.filter(b => b.trim() !== '').map((bullet, idx) => (
                    <li key={idx} className="text-[10px] leading-relaxed text-justify list-disc text-slate-800 pl-0.5">
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
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2.5 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.projects}
          </h2>
          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="space-y-0.5 font-serif proj-entry">
                <div className="flex justify-between items-baseline">
                  <div className="text-[10.5px] font-extrabold text-slate-950">
                    {proj.name} {proj.link && <span className="font-normal text-[8.5px] text-slate-500 lowercase">({proj.link})</span>}
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-500">
                    {proj.technologies.join(', ')}
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed text-justify text-slate-800">{proj.description}</p>
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
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2.5 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.education}
          </h2>
          <div className="space-y-4">
            {education
              .filter(edu => edu.school?.trim() || edu.degree?.trim())
              .map((edu) => (
                <div key={edu.id} className="edu-entry">
                  {/* School & graduation date */}
                  <div className="flex justify-between items-baseline font-serif">
                    <span className="text-[10.5px] font-extrabold text-slate-950">
                      {edu.school || 'Institution Name'}
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-500 font-mono">
                      {formatDate(edu.graduationDate)}
                    </span>
                  </div>
                  
                  {/* Degree — secondary */}
                  <div className="text-[10px] text-slate-600 mt-0.5 font-serif">
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

    languages: languages && languages.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="languages"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={languagesAts.rating}
        atsFeedback={languagesAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'languages')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('languages')}
      >
        <div>
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.languages}
          </h2>
          <div className="text-[10px] leading-relaxed text-slate-800 font-serif">
            {languages.map((lang, idx) => (
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
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.skills}
          </h2>
          <div className="text-[10px] leading-relaxed text-justify text-slate-800 font-serif">
            {skills.map((skill, idx) => {
              const parts = skill.split(':')
              if (parts.length > 1 && parts[0].trim().length < 30) {
                return (
                  <span key={skill}>
                    {idx > 0 && ' · '}
                    <strong className="font-extrabold text-slate-950">{parts[0].trim()}:</strong>
                    <span> {parts.slice(1).join(':')}</span>
                  </span>
                )
              }
              return (
                <span key={skill}>
                  {idx > 0 && ' · '}
                  <span>{skill}</span>
                </span>
              )
            })}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    awards: awards && awards.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="awards"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={awardsAts.rating}
        atsFeedback={awardsAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'awards')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('awards')}
      >
        <div>
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.awards}
          </h2>
          <div className="space-y-2">
            {awards.map((a) => (
              <div key={a.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-serif">
                  <span className="text-[10.5px] font-extrabold text-slate-950">{a.title}</span>
                  {a.date && <span className="text-[9.5px] font-bold text-slate-500">{a.date}</span>}
                </div>
                {a.awarder && <div className="text-[9.5px] text-slate-600">{a.awarder}</div>}
                {a.description && <p className="text-[10px] leading-relaxed text-slate-800">{a.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    certifications: certifications && certifications.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="certifications"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={certificationsAts.rating}
        atsFeedback={certificationsAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'certifications')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('certifications')}
      >
        <div>
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.certifications}
          </h2>
          <div className="space-y-2">
            {certifications.map((c) => (
              <div key={c.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-serif">
                  <span className="text-[10.5px] font-extrabold text-slate-950">{c.title}</span>
                  {c.date && <span className="text-[9.5px] font-bold text-slate-500">{c.date}</span>}
                </div>
                {c.issuer && <div className="text-[9.5px] text-slate-600">{c.issuer}</div>}
                {c.description && <p className="text-[10px] leading-relaxed text-slate-800">{c.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    interests: interests && interests.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="interests"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={interestsAts.rating}
        atsFeedback={interestsAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'interests')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('interests')}
      >
        <div>
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.interests}
          </h2>
          <div className="text-[10px] leading-relaxed text-slate-800 font-serif">
            {interests.map((i, idx) => (
              <span key={i.id}>
                {idx > 0 && ' · '}
                <span>{i.name}{i.keywords.length > 0 ? ` (${i.keywords.join(', ')})` : ''}</span>
              </span>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    publications: publications && publications.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="publications"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={publicationsAts.rating}
        atsFeedback={publicationsAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'publications')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('publications')}
      >
        <div>
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.publications}
          </h2>
          <div className="space-y-2">
            {publications.map((p) => (
              <div key={p.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-serif">
                  <span className="text-[10.5px] font-extrabold text-slate-950">{p.title}</span>
                  {p.date && <span className="text-[9.5px] font-bold text-slate-500">{p.date}</span>}
                </div>
                {p.publisher && <div className="text-[9.5px] text-slate-600 italic">{p.publisher}</div>}
                {p.description && <p className="text-[10px] leading-relaxed text-slate-800">{p.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    references: references && references.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="references"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={referencesAts.rating}
        atsFeedback={referencesAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'references')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('references')}
      >
        <div>
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.references}
          </h2>
          <div className="space-y-2">
            {references.map((r) => (
              <div key={r.id} className="space-y-0.5">
                <div className="text-[10.5px] font-extrabold text-slate-950">{r.name}</div>
                {r.position && <div className="text-[9.5px] text-slate-600">{r.position}</div>}
                {r.phone && <div className="text-[9.5px] text-slate-500">{r.phone}</div>}
                {r.description && <p className="text-[10px] leading-relaxed text-slate-800">{r.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,

    volunteer: volunteer && volunteer.length > 0 ? (
      <PreviewSectionWrapper
        sectionId="volunteer"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={volunteerAts.rating}
        atsFeedback={volunteerAts.feedback}
        onEdit={onEditSection}
        onDragStart={(e) => onDragStart?.(e, 'volunteer')}
        onDragOver={onDragOver}
        onDrop={() => onDrop?.('volunteer')}
      >
        <div>
          <h2 className="text-[10px] font-black tracking-widest border-b pb-0.5 mb-2 font-serif text-slate-950 section-heading" style={{ borderBottomColor: themeColor || '#0a0a0b' }}>
            {SECTION_LABELS.volunteer}
          </h2>
          <div className="space-y-2">
            {volunteer.map((v) => (
              <div key={v.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-serif">
                  <span className="text-[10.5px] font-extrabold text-slate-950">{v.organization}</span>
                  {v.period && <span className="text-[9.5px] font-bold text-slate-500">{v.period}</span>}
                </div>
                {v.location && <div className="text-[9.5px] text-slate-600 italic">{v.location}</div>}
                {v.description && <p className="text-[10px] leading-relaxed text-slate-800">{v.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null
  }

  return (
    <div className="font-serif text-[10pt] leading-normal text-slate-800 p-10 select-text max-w-full space-y-6">
      
      {/* Contact Header (Always Top) */}
      <PreviewSectionWrapper
        sectionId="contact"
        activeSection={activeSection}
        atsMode={atsMode}
        atsRating={contactAts.rating}
        atsFeedback={contactAts.feedback}
        onEdit={onEditSection}
      >
        <div className="text-center">
          <h1 className="text-2xl font-extrabold font-serif tracking-widest text-slate-950 mb-2 resume-name">
            {getFullName(contact) || 'YOUR NAME'}
          </h1>
          <div className="text-[10px] text-slate-650 tracking-wider flex justify-center flex-wrap gap-x-2.5 gap-y-1">
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
