import type { ResumeData } from '../../types/resume'
import { memo } from 'react'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
import { useTemplateData } from './useTemplateData'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import ResumeSectionHeading from '../ui/resume/ResumeSectionHeading'
import ResumeSkillsList from '../ui/resume/ResumeSkillsList'
import ResumeDateRange from '../ui/resume/ResumeDateRange'
import ResumeBulletList from '../ui/resume/ResumeBulletList'

interface MinimalistTemplateProps {
  data: ResumeData
  activeSection?: string | null
  atsMode?: boolean
  onEditSection?: (section: string) => void
  sectionOrder?: string[]
  onDragStart?: (e: React.DragEvent, sectionId: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (sectionId: string) => void
  themeColor?: string
}

const MinimalistTemplate = memo(function MinimalistTemplate({
  data, activeSection, atsMode, onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  onDragStart, onDragOver, onDrop, themeColor
}: MinimalistTemplateProps) {
  const {
    contact, summary, experience, education, skills, projects, languages,
    awards, certifications, interests, publications, references, volunteer,
    ats, sectionData,
  } = useTemplateData(data, activeSection, atsMode, onEditSection, onDragStart, onDragOver, onDrop, sectionOrder)

  const borderColor = themeColor || '#cbd5e1'

  const wrap = (sectionId: string, children: React.ReactNode, dragSection?: string) => (
    <PreviewSectionWrapper
      sectionId={sectionId}
      activeSection={activeSection}
      atsMode={atsMode}
      atsRating={ats[sectionId]?.rating || ''}
      atsFeedback={ats[sectionId]?.feedback}
      onEdit={onEditSection}
      onDragStart={dragSection ? ((e: React.DragEvent) => onDragStart?.(e, dragSection)) : undefined}
      onDragOver={onDragOver}
      onDrop={dragSection ? (() => onDrop?.(dragSection)) : undefined}
    >
      {children}
    </PreviewSectionWrapper>
  )

  const h2 = (label: string) => (
    <ResumeSectionHeading label={label} className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-2 font-serif" style={{ borderBottomColor: borderColor }} />
  )
  const h2Late = (label: string) => (
    <ResumeSectionHeading label={label} className="text-[10px] font-semibold tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans" />
  )

  const sectionsMap: Record<string, React.ReactNode> = {
    summary: summary ? wrap('summary', (
      <div className="mb-5">
        {h2('Professional Summary')}
        <p className="text-[9.5px] leading-relaxed text-slate-700 text-justify font-serif">{summary}</p>
      </div>
    ), 'summary') : null,

    experience: experience.length > 0 ? wrap('experience', (
      <div className="mb-5">
        {h2('Experience')}
        <div className="space-y-3">
          {experience.map((exp) => (
            <div key={exp.id} className="space-y-1 exp-entry">
              <div className="flex justify-between items-baseline font-serif">
                <div className="text-[10.5px] font-bold text-slate-950">
                  {exp.jobTitle} <span className="font-normal text-slate-500">— {exp.company}</span>
                </div>
                <div className="text-[9.5px] font-bold text-slate-500 font-mono">
                  <ResumeDateRange startDate={exp.startDate} endDate={exp.endDate} current={exp.current} className="text-[9.5px] font-bold text-slate-500 font-mono" />
                </div>
              </div>
              {exp.location && <div className="text-[8.5px] text-slate-400 italic -mt-0.5">{exp.location}</div>}
              <ResumeBulletList bullets={exp.bullets} className="space-y-0.5 pl-4" itemClassName="text-[9.5px] leading-relaxed text-justify list-disc text-slate-700 pl-0.5" />
            </div>
          ))}
        </div>
      </div>
    ), 'experience') : null,

    education: education.length > 0 ? wrap('education', (
      <div className="mb-5">
        {h2('Education')}
        <div className="space-y-3">
          {education.map((edu) => (
            <div key={edu.id} className="edu-entry">
              <div className="flex justify-between items-baseline font-serif">
                <span className="text-[10.5px] font-bold text-slate-950">{edu.school || 'Institution Name'}</span>
                <span className="text-[9.5px] font-bold text-slate-500 font-mono">{formatDate(edu.graduationDate)}</span>
              </div>
              <div className="text-[9.5px] text-slate-500 mt-0.5 font-serif">
                <span>{edu.degree}</span>
                {edu.location && ` · ${edu.location}`}
                {edu.gpa && parseFloat(edu.gpa) >= 3.5 && ` · GPA: ${edu.gpa}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    ), 'education') : null,

    projects: projects.length > 0 ? wrap('projects', (
      <div className="mb-5">
        {h2('Projects')}
        <div className="space-y-2">
          {projects.map((proj) => (
            <div key={proj.id} className="space-y-0.5 proj-entry">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-950">{proj.name}</span>
                <span className="text-[8.5px] font-bold text-slate-500">{proj.technologies.join(', ')}</span>
              </div>
              <p className="text-[9px] leading-relaxed text-slate-600 text-justify">{proj.description}</p>
            </div>
          ))}
        </div>
      </div>
    ), 'projects') : null,

    languages: languages.length > 0 ? wrap('languages', (
      <div className="mb-5">
        {h2Late('Languages')}
        <p className="text-[9.5px] leading-relaxed text-slate-700" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' } as React.CSSProperties}>
          {languages.map((lang, idx) => (
            <span key={lang.id}>{idx > 0 && ' · '}<span>{lang.name} ({lang.proficiency})</span></span>
          ))}
        </p>
      </div>
    ), 'languages') : null,

    skills: skills.length > 0 ? wrap('skills', (
      <div className="mb-2">
        {h2('Skills')}
        <ResumeSkillsList skills={skills} separator=" , " className="text-[9.5px] leading-relaxed text-slate-700" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' } as React.CSSProperties} />
      </div>
    ), 'skills') : null,

    awards: awards.length > 0 ? wrap('awards', (
      <div className="mb-5">
        {h2Late('Awards')}
        <div className="space-y-2">
          {awards.map((a) => (
            <div key={a.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-950">{a.title}</span>
                {a.date && <span className="text-[8.5px] font-bold text-slate-500">{formatDate(a.date)}</span>}
              </div>
              {a.awarder && <div className="text-[9px] text-slate-500">{a.awarder}</div>}
              {a.description && <p className="text-[9px] leading-relaxed text-slate-600">{a.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'awards') : null,

    certifications: certifications.length > 0 ? wrap('certifications', (
      <div className="mb-5">
        {h2Late('Certifications')}
        <div className="space-y-2">
          {certifications.map((c) => (
            <div key={c.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-950">{c.title}</span>
                {c.date && <span className="text-[8.5px] font-bold text-slate-500">{formatDate(c.date)}</span>}
              </div>
              {c.issuer && <div className="text-[9px] text-slate-500">{c.issuer}</div>}
              {c.description && <p className="text-[9px] leading-relaxed text-slate-600">{c.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'certifications') : null,

    interests: interests.length > 0 ? wrap('interests', (
      <div className="mb-5">
        {h2Late('Interests')}
        <p className="text-[9.5px] leading-relaxed text-slate-700">
          {interests.map((i, idx) => (
            <span key={i.id}>{idx > 0 && ' · '}<span>{i.name}{i.keywords?.length ? ` (${i.keywords.join(', ')})` : ''}</span></span>
          ))}
        </p>
      </div>
    ), 'interests') : null,

    publications: publications.length > 0 ? wrap('publications', (
      <div className="mb-5">
        {h2Late('Publications')}
        <div className="space-y-2">
          {publications.map((p) => (
            <div key={p.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-950">{p.title}</span>
                {p.date && <span className="text-[8.5px] font-bold text-slate-500">{p.date}</span>}
              </div>
              {p.publisher && <div className="text-[9px] text-slate-500">{p.publisher}</div>}
              {p.description && <p className="text-[9px] leading-relaxed text-slate-600">{p.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'publications') : null,

    references: references.length > 0 ? wrap('references', (
      <div className="mb-5">
        {h2Late('References')}
        <div className="space-y-2">
          {references.map((r) => (
            <div key={r.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-950">{r.name}</span>
                {r.position && <span className="text-[8.5px] font-bold text-slate-500">{r.position}</span>}
              </div>
              {r.phone && <div className="text-[9px] text-slate-500">{r.phone}</div>}
              {r.description && <p className="text-[9px] leading-relaxed text-slate-600">{r.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'references') : null,

    volunteer: volunteer.length > 0 ? wrap('volunteer', (
      <div className="mb-5">
        {h2Late('Volunteer')}
        <div className="space-y-2">
          {volunteer.map((v) => (
            <div key={v.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-950">{v.organization}</span>
                {v.period && <span className="text-[8.5px] font-bold text-slate-500">{v.period}</span>}
              </div>
              {v.location && <div className="text-[9px] text-slate-500">{v.location}</div>}
              {v.description && <p className="text-[9px] leading-relaxed text-slate-600">{v.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'volunteer') : null,
  }

  return (
    <div className="resume-template">
      <div className="resume-page font-sans text-[10px] leading-normal text-slate-800 p-10 select-text max-w-full space-y-5" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <PreviewSectionWrapper
          sectionId="contact"
          activeSection={activeSection}
          atsMode={atsMode}
          atsRating={ats.contact.rating}
          atsFeedback={ats.contact.feedback}
          onEdit={onEditSection}
        >
          <div className="mb-5 text-left border-b-2 pb-2 mb-2" style={{ borderBottomColor: themeColor || '#111111' }}>
            <h1 className="text-2xl font-bold font-serif uppercase tracking-wider text-slate-950">{getFullName(contact) || 'YOUR NAME'}</h1>
            <div className="text-[9.5px] text-slate-500 uppercase tracking-widest mt-1">
              {contact.location && <span>{contact.location}</span>}
              {contact.location && (contact.email || contact.phone) && <span> · </span>}
              {contact.email && <span>{contact.email}</span>}
              {contact.email && contact.phone && <span> · </span>}
              {contact.phone && <span>{contact.phone}</span>}
            </div>
          </div>
        </PreviewSectionWrapper>

        {sectionData.page1Sections.map((secId) => {
          const component = sectionsMap[secId]
          return component ? <div key={secId}>{component}</div> : null
        })}
      </div>

      {sectionData.page2Sections.length > 0 && (
        <>
          <div className="resume-page-break" />
          <div className="resume-page resume-page-continuation font-sans text-[10px] leading-normal text-slate-800 p-10 select-text max-w-full space-y-5" style={{ paddingTop: 48, paddingBottom: 48 }}>
            {sectionData.page2Sections.map((secId) => {
              const component = sectionsMap[secId]
              return component ? <div key={secId}>{component}</div> : null
            })}
          </div>
        </>
      )}
    </div>
  )
})

export default MinimalistTemplate
