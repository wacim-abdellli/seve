import type { ResumeData } from '../../types/resume'
import { memo } from 'react'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
import { useTemplateData } from './useTemplateData'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import ResumeSectionHeading from '../ui/resume/ResumeSectionHeading'
import ResumeSkillsList from '../ui/resume/ResumeSkillsList'
import ResumeDateRange from '../ui/resume/ResumeDateRange'
import ResumeBulletList from '../ui/resume/ResumeBulletList'

interface ExecutiveTemplateProps {
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

const ExecutiveTemplate = memo(function ExecutiveTemplate({
  data, activeSection, atsMode, onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills', 'languages', 'awards', 'certifications', 'interests', 'publications', 'references', 'volunteer'],
  onDragStart, onDragOver, onDrop, themeColor = '#e11d48'
}: ExecutiveTemplateProps) {
  const {
    contact, summary, experience, education, skills, projects, languages,
    awards, certifications, interests, publications, references, volunteer,
    ats, sectionData,
  } = useTemplateData(data, activeSection, atsMode, onEditSection, onDragStart, onDragOver, onDrop, sectionOrder)

  const leftSectionKeys = ['education', 'skills', 'languages', 'interests']

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

  const leftH2 = (label: string) => (
    <div className="border-t border-slate-300 pt-2 mt-3">
      <ResumeSectionHeading label={label} className="text-[10px] font-black tracking-wider text-slate-500" />
    </div>
  )

  const rightH2 = (label: string) => (
    <ResumeSectionHeading label={label} className="text-[11px] font-black tracking-widest text-slate-900 border-b-2 border-slate-100 pb-1 mb-2.5 font-serif" />
  )

  const leftSectionsMap: Record<string, React.ReactNode> = {
    education: education.length > 0 ? wrap('education', (
      <div className="mb-4">
        {leftH2(SECTION_LABELS.education)}
        <div className="mt-2 space-y-2">
          {education.map((edu) => (
            <div key={edu.id}>
              <div className="font-bold text-slate-900 text-[9.5px]">{edu.school}</div>
              <div className="text-[8.5px] text-slate-700 italic">{edu.degree}</div>
              <div className="text-[8px] font-semibold" style={{ color: themeColor }}>{formatDate(edu.graduationDate)}</div>
            </div>
          ))}
        </div>
      </div>
    )) : null,

    skills: skills.length > 0 ? wrap('skills', (
      <div className="mb-4">
        {leftH2(SECTION_LABELS.skills)}
        <ResumeSkillsList skills={skills} className="text-[9px] text-slate-700 mt-1 leading-relaxed" />
      </div>
    )) : null,

    languages: languages.length > 0 ? wrap('languages', (
      <div className="mb-4">
        {leftH2(SECTION_LABELS.languages)}
        <p className="text-[9px] text-slate-700 mt-1">
          {languages.map((lang, idx) => (
            <span key={lang.id}>{idx > 0 && ' · '}<span>{lang.name} ({lang.proficiency})</span></span>
          ))}
        </p>
      </div>
    )) : null,

    interests: interests.length > 0 ? wrap('interests', (
      <div className="mb-4">
        {leftH2(SECTION_LABELS.interests)}
        <p className="text-[9px] text-slate-700 mt-1">
          {interests.map((i, idx) => (
            <span key={i.id}>{idx > 0 && ' · '}<span>{i.name}</span></span>
          ))}
        </p>
      </div>
    )) : null,
  }

  const rightSectionsMap: Record<string, React.ReactNode> = {
    summary: summary ? wrap('summary', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.summary)}
        <p className="text-[10px] leading-relaxed text-justify text-slate-700">{summary}</p>
      </div>
    ), 'summary') : null,

    experience: experience.length > 0 ? wrap('experience', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.experience)}
        <div className="space-y-3">
          {experience.map((exp) => (
            <div key={exp.id} className="space-y-1 exp-entry">
              <div className="flex justify-between items-baseline">
                <div className="text-[10.5px] font-bold text-slate-900">
                  {exp.jobTitle} <span className="font-normal text-slate-500">— {exp.company}</span>
                </div>
                <div className="text-[9.5px] font-bold text-slate-600 shrink-0 ml-4 font-mono">
                  <ResumeDateRange startDate={exp.startDate} endDate={exp.endDate} current={exp.current} className="text-[9.5px] font-bold text-slate-600 shrink-0 ml-4 font-mono" />
                </div>
              </div>
              {exp.location && <div className="text-[9px] text-slate-400 italic -mt-0.5">{exp.location}</div>}
              <ResumeBulletList bullets={exp.bullets} className="space-y-1 pl-4" itemClassName="text-[9.5px] leading-relaxed text-justify list-disc text-slate-700 pl-0.5 font-sans" />
            </div>
          ))}
        </div>
      </div>
    ), 'experience') : null,

    projects: projects.length > 0 ? wrap('projects', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.projects)}
        <div className="space-y-2">
          {projects.map((proj) => (
            <div key={proj.id} className="space-y-0.5 proj-entry">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-900">{proj.name}</span>
                <span className="text-[8.5px] font-bold text-slate-500 font-mono">{proj.technologies.join(', ')}</span>
              </div>
              <p className="text-[9.5px] leading-relaxed text-slate-700 text-justify">{proj.description}</p>
            </div>
          ))}
        </div>
      </div>
    ), 'projects') : null,

    awards: awards.length > 0 ? wrap('awards', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.awards)}
        <div className="space-y-2">
          {awards.map((a) => (
            <div key={a.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-900">{a.title}</span>
                {a.date && <span className="text-[8.5px] font-bold text-slate-500">{formatDate(a.date)}</span>}
              </div>
              {a.awarder && <div className="text-[9px] text-slate-600">{a.awarder}</div>}
              {a.description && <p className="text-[9.5px] leading-relaxed text-slate-700">{a.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'awards') : null,

    certifications: certifications.length > 0 ? wrap('certifications', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.certifications)}
        <div className="space-y-2">
          {certifications.map((c) => (
            <div key={c.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-900">{c.title}</span>
                {c.date && <span className="text-[8.5px] font-bold text-slate-500">{formatDate(c.date)}</span>}
              </div>
              {c.issuer && <div className="text-[9px] text-slate-600">{c.issuer}</div>}
              {c.description && <p className="text-[9.5px] leading-relaxed text-slate-700">{c.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'certifications') : null,

    publications: publications.length > 0 ? wrap('publications', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.publications)}
        <div className="space-y-2">
          {publications.map((p) => (
            <div key={p.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-900">{p.title}</span>
                {p.date && <span className="text-[8.5px] font-bold text-slate-500">{p.date}</span>}
              </div>
              {p.publisher && <div className="text-[9px] text-slate-600">{p.publisher}</div>}
              {p.description && <p className="text-[9.5px] leading-relaxed text-slate-700">{p.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'publications') : null,

    references: references.length > 0 ? wrap('references', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.references)}
        <div className="space-y-2">
          {references.map((r) => (
            <div key={r.id} className="space-y-0.5">
              <span className="text-[9.5px] font-bold text-slate-900">{r.name}</span>
              <div className="text-[9px] text-slate-600">{r.position}</div>
              {r.phone && <div className="text-[9px] text-slate-500">{r.phone}</div>}
            </div>
          ))}
        </div>
      </div>
    ), 'references') : null,

    volunteer: volunteer.length > 0 ? wrap('volunteer', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.volunteer)}
        <div className="space-y-2">
          {volunteer.map((v) => (
            <div key={v.id} className="space-y-0.5">
              <span className="text-[9.5px] font-bold text-slate-900">{v.organization}</span>
              {v.location && <div className="text-[9px] text-slate-600">{v.location}</div>}
              {v.description && <p className="text-[9.5px] leading-relaxed text-slate-700">{v.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'volunteer') : null,
  }

  const page1Left = leftSectionKeys.filter(k => sectionData.page1Sections.includes(k))
  const page1Right = sectionData.page1Sections.filter(k => !leftSectionKeys.includes(k))
  const page2Left = leftSectionKeys.filter(k => sectionData.page2Sections.includes(k))
  const page2Right = sectionData.page2Sections.filter(k => !leftSectionKeys.includes(k))

  const renderLeft = (keys: string[]) => keys.map(secId => (
    <div key={secId}>{leftSectionsMap[secId]}</div>
  ))

  const renderRight = (keys: string[]) => keys.map(secId => {
    const component = rightSectionsMap[secId]
    return component ? <div key={secId}>{component}</div> : null
  })

  return (
    <div className="resume-template">
      <div className="resume-page font-sans text-[10px] leading-normal text-slate-800 select-text max-w-full" style={{ padding: 0 }}>
        <div className="flex min-h-[1123px]">
          <div className="w-[220px] shrink-0 p-5 pt-8" style={{ backgroundColor: '#f2f2f2', borderRight: '1px solid #e2e8f0' }}>
            <PreviewSectionWrapper
              sectionId="contact"
              activeSection={activeSection}
              atsMode={atsMode}
              atsRating={ats.contact.rating}
              atsFeedback={ats.contact.feedback}
              onEdit={onEditSection}
            >
              <h1 className="text-xl font-black tracking-tight text-slate-900 break-words">{getFullName(contact) || 'YOUR NAME'}</h1>
              <div className="h-0.5 w-12 rounded my-2.5" style={{ backgroundColor: themeColor }} />
              <div className="space-y-1.5 text-[9px] text-slate-700">
                {contact.location && <div><span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider block">Location</span>{contact.location}</div>}
                {contact.email && <div><span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider block">Email</span>{contact.email}</div>}
                {contact.phone && <div><span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider block">Phone</span>{contact.phone}</div>}
                {contact.linkedin && <div><span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider block">LinkedIn</span>{contact.linkedin}</div>}
                {contact.website && <div><span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider block">Website</span>{contact.website}</div>}
              </div>
            </PreviewSectionWrapper>
            <div className="mt-5 space-y-3">{renderLeft(page1Left)}</div>
          </div>
          <div className="flex-1 p-5 pt-8 min-w-0">
            {renderRight(page1Right)}
          </div>
        </div>
      </div>

      {sectionData.page2Sections.length > 0 && (
        <>
          <div className="resume-page-break" />
          <div className="resume-page resume-page-continuation font-sans text-[10px] leading-normal text-slate-800 select-text max-w-full" style={{ padding: 0 }}>
            <div className="flex min-h-[1123px]">
              <div className="w-[220px] shrink-0 p-5 pt-8" style={{ backgroundColor: '#f2f2f2', borderRight: '1px solid #e2e8f0' }}>
                {renderLeft(page2Left)}
              </div>
              <div className="flex-1 p-5 pt-8 min-w-0">
                {renderRight(page2Right)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

export default ExecutiveTemplate
