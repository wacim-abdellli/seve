import type { ResumeData } from '../../types/resume'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
import { evaluateSectionAts } from '../../utils/atsEvaluator'
import { getPageBreakSections } from '../../utils/layoutHelper'

interface MinimalistTemplateProps {
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
  const languages = (data.languages || []).filter((l) => l.name?.trim())
  const awards = (data.awards || []).filter((a) => a.title?.trim())
  const certifications = (data.certifications || []).filter((c) => c.title?.trim())
  const interests = (data.interests || []).filter((i) => i.name?.trim())
  const publications = (data.publications || []).filter((p) => p.title?.trim())
  const references = (data.references || []).filter((r) => r.name?.trim())
  const volunteer = (data.volunteer || []).filter((v) => v.organization?.trim())


  const contactAts = evaluateSectionAts('contact', data)
  const summaryAts = evaluateSectionAts('summary', data)
  const experienceAts = evaluateSectionAts('experience', data)
  const projectsAts = evaluateSectionAts('projects', data)
  const educationAts = evaluateSectionAts('education', data)
  const skillsAts = evaluateSectionAts('skills', data)
  const languagesAts = evaluateSectionAts('languages', data)
  const awardsAts = evaluateSectionAts('awards', data)
  const certificationsAts = evaluateSectionAts('certifications', data)
  const interestsAts = evaluateSectionAts('interests', data)
  const publicationsAts = evaluateSectionAts('publications', data)
  const referencesAts = evaluateSectionAts('references', data)
  const volunteerAts = evaluateSectionAts('volunteer', data)

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
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5 font-serif" style={{ borderBottomColor: themeColor || '#cbd5e1' }}>
            {SECTION_LABELS.languages}
          </h2>
          <div className="text-[10px] leading-relaxed text-slate-700 font-serif" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
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
          <h2 className="text-[10px] font-semibold tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans">
            {SECTION_LABELS.awards}
          </h2>
          <div className="space-y-2.5">
            {awards.map((award) => (
              <div key={award.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-slate-950 font-sans">{award.title}</span>
                  {award.date && <span className="text-[9px] text-slate-400 font-sans">{formatDate(award.date)}</span>}
                </div>
                {award.awarder && (
                  <div className="text-[9.5px] text-slate-500 font-sans">{award.awarder}</div>
                )}
                {award.description && (
                  <p className="text-[10px] leading-relaxed text-slate-700 font-sans">{award.description}</p>
                )}
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
          <h2 className="text-[10px] font-semibold tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans">
            {SECTION_LABELS.certifications}
          </h2>
          <div className="space-y-2.5">
            {certifications.map((cert) => (
              <div key={cert.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-slate-950 font-sans">{cert.title}</span>
                  {cert.date && <span className="text-[9px] text-slate-400 font-sans">{formatDate(cert.date)}</span>}
                </div>
                {cert.issuer && (
                  <div className="text-[9.5px] text-slate-500 font-sans">{cert.issuer}</div>
                )}
                {cert.description && (
                  <p className="text-[10px] leading-relaxed text-slate-700 font-sans">{cert.description}</p>
                )}
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
          <h2 className="text-[10px] font-semibold tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans">
            {SECTION_LABELS.interests}
          </h2>
          <div className="text-[10px] leading-relaxed text-slate-700 font-sans">
            {interests.map((i, idx) => (
              <span key={i.id}>
                {idx > 0 && ', '}
                <span>{i.name}{i.keywords && i.keywords.length > 0 ? ` (${i.keywords.join(', ')})` : ''}</span>
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
          <h2 className="text-[10px] font-semibold tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans">
            {SECTION_LABELS.publications}
          </h2>
          <div className="space-y-2.5">
            {publications.map((pub) => (
              <div key={pub.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-slate-950 font-sans">{pub.title}</span>
                  {pub.date && <span className="text-[9px] text-slate-400 font-sans">{formatDate(pub.date)}</span>}
                </div>
                {pub.publisher && (
                  <div className="text-[9.5px] italic text-slate-500 font-sans">{pub.publisher}</div>
                )}
                {pub.description && (
                  <p className="text-[10px] leading-relaxed text-slate-700 font-sans">{pub.description}</p>
                )}
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
          <h2 className="text-[10px] font-semibold tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans">
            {SECTION_LABELS.references}
          </h2>
          <div className="space-y-2.5">
            {references.map((ref) => (
              <div key={ref.id} className="space-y-0.5">
                <div className="text-[10px] font-bold text-slate-950 font-sans">{ref.name}</div>
                {ref.position && <div className="text-[9.5px] text-slate-500 font-sans">{ref.position}</div>}
                {ref.phone && <div className="text-[9.5px] text-slate-500 font-sans">{ref.phone}</div>}
                {ref.description && (
                  <p className="text-[10px] leading-relaxed text-slate-700 font-sans">{ref.description}</p>
                )}
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
          <h2 className="text-[10px] font-semibold tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans">
            {SECTION_LABELS.volunteer}
          </h2>
          <div className="space-y-2.5">
            {volunteer.map((vol) => (
              <div key={vol.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-slate-950 font-sans">{vol.organization}</span>
                  {vol.period && <span className="text-[9px] text-slate-400 font-sans">{vol.period}</span>}
                </div>
                {vol.location && (
                  <div className="text-[9.5px] text-slate-500 font-sans">{vol.location}</div>
                )}
                {vol.description && (
                  <p className="text-[10px] leading-relaxed text-slate-700 font-sans">{vol.description}</p>
                )}
              </div>
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

  const { page1Sections, page2Sections } = getPageBreakSections(data, sectionOrder)

  return (
    <div className="resume-template">
      {/* Page 1 */}
      <div className="resume-page font-serif text-[10pt] leading-normal text-slate-800 p-10 select-text max-w-full space-y-5" style={{ paddingTop: 48, paddingBottom: 48 }}>
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
        {page1Sections.map((secId) => {
          const component = sectionsMap[secId]
          return component ? <div key={secId}>{component}</div> : null
        })}
      </div>

      {/* Page 2 */}
      {page2Sections.length > 0 && (
        <>
          <div className="resume-page-break" />
          <div className="resume-page resume-page-continuation font-serif text-[10pt] leading-normal text-slate-800 p-10 select-text max-w-full space-y-5" style={{ paddingTop: 48, paddingBottom: 48 }}>
            {page2Sections.map((secId) => {
              const component = sectionsMap[secId]
              return component ? <div key={secId}>{component}</div> : null
            })}
          </div>
        </>
      )}
    </div>
  )
}
