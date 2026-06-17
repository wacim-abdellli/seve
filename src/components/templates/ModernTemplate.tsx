import type { ResumeData } from '../../types/resume'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
import { evaluateSectionAts } from '../../utils/atsEvaluator'
import { getPageBreakSections } from '../../utils/layoutHelper'

interface ModernTemplateProps {
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

export default function ModernTemplate({ 
  data, 
  activeSection, 
  atsMode, 
  onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  onDragStart,
  onDragOver,
  onDrop,
  themeColor = '#e11d48'
}: ModernTemplateProps) {
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 rounded-sm animate-pulse" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.summary}
            </h2>
          </div>
          <p className="text-[10px] leading-relaxed text-justify text-slate-750">{summary}</p>
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
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.experience}
            </h2>
          </div>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-1 exp-entry">
                <div className="flex justify-between items-baseline">
                  <div className="text-[10.5px] font-bold text-slate-950">
                    {exp.jobTitle} <span className="font-semibold" style={{ color: themeColor }}>— {exp.company}</span>
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-500">
                    {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[9px] text-slate-500 font-medium">{exp.location}</div>
                )}
                <ul className="space-y-1 pl-4">
                  {exp.bullets.filter(b => b.trim() !== '').map((bullet, idx) => (
                    <li key={idx} className="text-[10px] leading-relaxed text-justify list-disc text-slate-700 pl-0.5">
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
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.projects}
            </h2>
          </div>
          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="space-y-0.5 proj-entry">
                <div className="flex justify-between items-baseline">
                  <div className="text-[10.5px] font-bold text-slate-950">
                    {proj.name} {proj.link && <span className="text-[9px] font-normal text-slate-500 lowercase">({proj.link})</span>}
                  </div>
                  <div className="text-[9.5px] font-bold" style={{ color: themeColor }}>
                    {proj.technologies.join(' | ')}
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-700 text-justify">{proj.description}</p>
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
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.education}
            </h2>
          </div>
          <div className="space-y-4">
            {education
              .filter(edu => edu.school?.trim() || edu.degree?.trim())
              .map((edu) => (
                <div key={edu.id} className="edu-entry">
                  {/* School & graduation date */}
                  <div className="flex justify-between items-baseline font-sans">
                    <span className="text-[10.5px] font-bold text-slate-950">
                      {edu.school || 'Institution Name'}
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-500">
                      {formatDate(edu.graduationDate)}
                    </span>
                  </div>
                  
                  {/* Degree — secondary */}
                  <div className="text-[10px] text-slate-500 mt-0.5">
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.languages}
            </h2>
          </div>
          <p style={{
            fontSize: '10pt',
            color: '#111111',
            lineHeight: '1.7',
            letterSpacing: '0.01em'
          }}>
            {languages.map((lang, idx) => (
              <span key={lang.id}>
                {idx > 0 && ' · '}
                <span>{lang.name} ({lang.proficiency})</span>
              </span>
            ))}
          </p>
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
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.skills}
            </h2>
          </div>
          <p style={{
            fontSize: '10pt',
            color: '#111111',
            lineHeight: '1.7',
            letterSpacing: '0.01em'
          }}>
            {skills.join(' · ')}
          </p>
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.awards}
            </h2>
          </div>
          <div className="space-y-3">
            {awards.map((a) => (
              <div key={a.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10.5px] font-bold text-slate-950">{a.title}</span>
                  {a.date && <span className="text-[9.5px] font-bold text-slate-500">{a.date}</span>}
                </div>
                {a.awarder && <div className="text-[10px] text-slate-500 font-medium">{a.awarder}</div>}
                {a.description && <p className="text-[10px] leading-relaxed text-slate-700 text-justify">{a.description}</p>}
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.certifications}
            </h2>
          </div>
          <div className="space-y-3">
            {certifications.map((c) => (
              <div key={c.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10.5px] font-bold text-slate-950">{c.title}</span>
                  {c.date && <span className="text-[9.5px] font-bold text-slate-500">{c.date}</span>}
                </div>
                {c.issuer && <div className="text-[10px] text-slate-500 font-medium">{c.issuer}</div>}
                {c.description && <p className="text-[10px] leading-relaxed text-slate-700 text-justify">{c.description}</p>}
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.interests}
            </h2>
          </div>
          <p style={{
            fontSize: '10pt',
            color: '#111111',
            lineHeight: '1.7',
            letterSpacing: '0.01em'
          }}>
            {interests.map((i, idx) => (
              <span key={i.id}>
                {idx > 0 && ' · '}
                <span>{i.name}{i.keywords && i.keywords.length > 0 ? ` (${i.keywords.join(', ')})` : ''}</span>
              </span>
            ))}
          </p>
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.publications}
            </h2>
          </div>
          <div className="space-y-3">
            {publications.map((p) => (
              <div key={p.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10.5px] font-bold text-slate-950">{p.title}</span>
                  {p.date && <span className="text-[9.5px] font-bold text-slate-500">{p.date}</span>}
                </div>
                {p.publisher && <div className="text-[10px] text-slate-500 font-medium">{p.publisher}</div>}
                {p.description && <p className="text-[10px] leading-relaxed text-slate-700 text-justify">{p.description}</p>}
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.references}
            </h2>
          </div>
          <div className="space-y-3">
            {references.map((r) => (
              <div key={r.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10.5px] font-bold text-slate-950">{r.name}</span>
                  {r.position && <span className="text-[9.5px] font-bold text-slate-500">{r.position}</span>}
                </div>
                {r.phone && <div className="text-[10px] text-slate-500 font-medium">{r.phone}</div>}
                {r.description && <p className="text-[10px] leading-relaxed text-slate-700 text-justify">{r.description}</p>}
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
            <h2 className="text-[11px] font-black tracking-wider text-slate-950 section-heading">
              {SECTION_LABELS.volunteer}
            </h2>
          </div>
          <div className="space-y-3">
            {volunteer.map((v) => (
              <div key={v.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10.5px] font-bold text-slate-950">{v.organization}</span>
                  {v.period && <span className="text-[9.5px] font-bold text-slate-500">{v.period}</span>}
                </div>
                {v.location && <div className="text-[10px] text-slate-500 font-medium">{v.location}</div>}
                {v.description && <p className="text-[10px] leading-relaxed text-slate-700 text-justify">{v.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null
  }

  const { page1Sections, page2Sections } = getPageBreakSections(data, sectionOrder)

  return (
    <div className="resume-template">
      {/* Page 1 */}
      <div className="resume-page font-sans text-[10pt] leading-normal text-slate-800 p-10 select-text max-w-full space-y-5" style={{ paddingTop: 48, paddingBottom: 48 }}>
        {/* Contact Header (Always Top) */}
        <PreviewSectionWrapper
          sectionId="contact"
          activeSection={activeSection}
          atsMode={atsMode}
          atsRating={contactAts.rating}
          atsFeedback={contactAts.feedback}
          onEdit={onEditSection}
        >
          <div className="mb-5 relative pb-3 border-b-2" style={{ borderBottomColor: themeColor }}>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight mb-1.5">
              {getFullName(contact) || 'YOUR NAME'}
            </h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold tracking-wide uppercase" style={{ color: themeColor }}>
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
          <div className="resume-page resume-page-continuation font-sans text-[10pt] leading-normal text-slate-800 p-10 select-text max-w-full space-y-5" style={{ paddingTop: 48, paddingBottom: 48 }}>
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
