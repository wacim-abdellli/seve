import type { ResumeData } from '../../types/resume'
import { parseCategorizedSkills } from '../../utils/atsUtils'
import { memo } from 'react'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
import { useTemplateData } from './useTemplateData'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import ResumeSectionHeading from '../ui/resume/ResumeSectionHeading'
import ResumeDateRange from '../ui/resume/ResumeDateRange'
import ResumeBulletList from '../ui/resume/ResumeBulletList'

interface TechnicalTemplateProps {
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

const TechnicalTemplate = memo(function TechnicalTemplate({
  data, activeSection, atsMode, onEditSection,
  sectionOrder = ['summary', 'skills', 'experience', 'projects', 'education'],
  onDragStart, onDragOver, onDrop, themeColor = '#059669'
}: TechnicalTemplateProps) {
  const {
    contact, summary, experience, education, skills, projects, languages,
    awards, certifications, interests, publications, references, volunteer,
    ats, sectionData,
  } = useTemplateData(data, activeSection, atsMode, onEditSection, onDragStart, onDragOver, onDrop, sectionOrder)

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
    <ResumeSectionHeading label={label} className="text-[10px] font-bold uppercase tracking-widest text-slate-700 border-b border-slate-200 pb-1 mb-2.5" style={{ borderBottomColor: `${themeColor}40` }} />
  )

  const sectionsMap: Record<string, React.ReactNode> = {
    summary: summary ? wrap('summary', (
      <div className="mb-5 resume-section">
        {h2(SECTION_LABELS.summary)}
        <p className="text-[9.5px] leading-relaxed text-justify text-slate-700">{summary}</p>
      </div>
    ), 'summary') : null,

    skills: skills.length > 0 ? wrap('skills', (
      <div className="mb-4 resume-section">
        {h2(SECTION_LABELS.skills)}
        <div 
          className={parseCategorizedSkills(skills).length > 1 ? "grid gap-y-1" : "flex flex-col gap-1"}
          style={parseCategorizedSkills(skills).length > 1 ? { gridTemplateColumns: 'fit-content(48%) 1fr', columnGap: '1.5rem' } : undefined}
        >
          {parseCategorizedSkills(skills).map((group, gIdx) => (
            <div key={gIdx} className="flex items-baseline gap-2">
              {group.category !== 'Skills' && (
                <div className="text-[9.5px] font-bold text-slate-800 min-w-[70px] shrink-0">{group.category}:</div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span key={item} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${themeColor}10`, color: themeColor }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ), 'skills') : null,

    experience: experience.length > 0 ? wrap('experience', (
      <div className="mb-5 resume-section-breakable">
        {h2(SECTION_LABELS.experience)}
        <div className="space-y-3">
          {experience.map((exp) => (
            <div key={exp.id} className="exp-entry">
              <div className="flex justify-between items-baseline">
                <div className="text-[10px] font-bold text-slate-900">{exp.jobTitle} <span className="font-normal text-slate-500">@ {exp.company}</span></div>
                <ResumeDateRange startDate={exp.startDate} endDate={exp.endDate} current={exp.current} className="text-[8.5px] font-mono text-slate-500" />
              </div>
              {exp.location && <div className="text-[8.5px] text-slate-400">{exp.location}</div>}
              <ResumeBulletList bullets={exp.bullets} className="mt-1 space-y-0.5" itemClassName="text-[9.5px] leading-relaxed text-slate-700 pl-3 -indent-2 ml-2" />
            </div>
          ))}
        </div>
      </div>
    ), 'experience') : null,

    projects: projects.length > 0 ? wrap('projects', (
      <div className="mb-5 resume-section-breakable">
        {h2(SECTION_LABELS.projects)}
        <div className="space-y-2">
          {projects.map((proj) => (
            <div key={proj.id} className="proj-entry">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-900">{proj.name}</span>
                <span className="text-[8px] font-mono text-slate-500">{proj.technologies.join(' · ')}</span>
              </div>
              <p className="text-[9px] text-slate-600 mt-0.5">{proj.description}</p>
            </div>
          ))}
        </div>
      </div>
    ), 'projects') : null,

    education: education.length > 0 ? wrap('education', (
      <div className="mb-5 resume-section-breakable">
        {h2(SECTION_LABELS.education)}
        <div className="space-y-1.5">
          {education.map((edu) => (
            <div key={edu.id} className="edu-entry">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-900">{edu.school}</span>
                <span className="text-[8.5px] text-slate-500">{formatDate(edu.graduationDate)}</span>
              </div>
              <div className="text-[9px] text-slate-600">{edu.degree}{edu.gpa && parseFloat(edu.gpa) >= 3.5 ? ` (GPA: ${edu.gpa})` : ''}</div>
            </div>
          ))}
        </div>
      </div>
    ), 'education') : null,

    languages: languages.length > 0 ? wrap('languages', (
      <div className="mb-5 resume-section">
        {h2(SECTION_LABELS.languages)}
        <p className="text-[9.5px] text-slate-700">{languages.map(l => `${l.name} (${l.proficiency})`).join(' · ')}</p>
      </div>
    ), 'languages') : null,

    awards: awards.length > 0 ? wrap('awards', (
      <div className="mb-5 resume-section">
        {h2(SECTION_LABELS.awards)}
        <div className="space-y-1">
          {awards.map((a) => (
            <div key={a.id} className="text-[9.5px] text-slate-700">{a.title}{a.awarder ? ` — ${a.awarder}` : ''}</div>
          ))}
        </div>
      </div>
    ), 'awards') : null,

    certifications: certifications.length > 0 ? wrap('certifications', (
      <div className="mb-5 resume-section">
        {h2(SECTION_LABELS.certifications)}
        <div className="space-y-1">
          {certifications.map((c) => (
            <div key={c.id} className="text-[9.5px] text-slate-700">{c.title}{c.issuer ? ` — ${c.issuer}` : ''}</div>
          ))}
        </div>
      </div>
    ), 'certifications') : null,

    interests: interests.length > 0 ? wrap('interests', (
      <div className="mb-5 resume-section">
        {h2(SECTION_LABELS.interests)}
        <p className="text-[9.5px] text-slate-700">{interests.map(i => i.name).join(', ')}</p>
      </div>
    ), 'interests') : null,

    publications: publications.length > 0 ? wrap('publications', (
      <div className="mb-5 resume-section">
        {h2(SECTION_LABELS.publications)}
        <div className="space-y-1">
          {publications.map((p) => (
            <div key={p.id} className="text-[9.5px] text-slate-700">{p.title}{p.publisher ? ` — ${p.publisher}` : ''}{p.date ? ` (${p.date})` : ''}</div>
          ))}
        </div>
      </div>
    ), 'publications') : null,

    references: references.length > 0 ? wrap('references', (
      <div className="mb-5 resume-section">
        {h2(SECTION_LABELS.references)}
        <div className="space-y-1">
          {references.map((r) => (
            <div key={r.id} className="text-[9.5px] text-slate-700">{r.name}{r.position ? ` · ${r.position}` : ''}</div>
          ))}
        </div>
      </div>
    ), 'references') : null,

    volunteer: volunteer.length > 0 ? wrap('volunteer', (
      <div className="mb-5 resume-section">
        {h2(SECTION_LABELS.volunteer)}
        <div className="space-y-1">
          {volunteer.map((v) => (
            <div key={v.id} className="text-[9.5px] text-slate-700">{v.organization}{v.location ? ` · ${v.location}` : ''}</div>
          ))}
        </div>
      </div>
    ), 'volunteer') : null,
  }

  return (
    <div className="resume-template" style={{ fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace" }}>
      <div className="resume-page text-[9.5px] leading-normal text-slate-800 p-10 select-text max-w-full space-y-4" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <PreviewSectionWrapper
          sectionId="contact"
          activeSection={activeSection}
          atsMode={atsMode}
          atsRating={ats.contact.rating}
          atsFeedback={ats.contact.feedback}
          onEdit={onEditSection}
        >
          <div className="mb-4 pb-3 border-b-2" style={{ borderBottomColor: 'var(--template-divider-color)' }}>
            <h1 className="text-xl font-black tracking-tight text-slate-900">{getFullName(contact) || 'YOUR NAME'}</h1>
            <div className="text-[8.5px] text-slate-500 mt-1">
              {contact.email && <span>{contact.email}</span>}
              {contact.phone && <span> · {contact.phone}</span>}
              {contact.location && <span> · {contact.location}</span>}
              {contact.linkedin && <span> · {contact.linkedin}</span>}
              {contact.website && <span> · {contact.website}</span>}
            </div>
          </div>
        </PreviewSectionWrapper>

        {sectionData.page1Sections.map((secId) => {
          const component = sectionsMap[secId]
          return component ? <div key={secId}>{component}</div> : null
        })}
      </div>


    </div>
  )
})

export default TechnicalTemplate
