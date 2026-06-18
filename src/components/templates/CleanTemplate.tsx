import type { ResumeData } from '../../types/resume'
import { memo } from 'react'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
import { useTemplateData } from './useTemplateData'
import PreviewSectionWrapper from '../PreviewSectionWrapper'

interface CleanTemplateProps {
  data: ResumeData
  activeSection?: string | null
  atsMode?: boolean
  onEditSection?: (section: string) => void
  sectionOrder?: string[]
  onDragStart?: (e: React.DragEvent, sectionId: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (sectionId: string) => void
}

const CleanTemplate = memo(function CleanTemplate({
  data, activeSection, atsMode, onEditSection,
  sectionOrder = ['summary', 'experience', 'education', 'skills', 'projects'],
  onDragStart, onDragOver, onDrop
}: CleanTemplateProps) {
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
    <h2 className="text-[11px] font-extralight uppercase tracking-[0.3em] text-slate-400 mb-3">{label}</h2>
  )

  const sectionsMap: Record<string, React.ReactNode> = {
    summary: summary ? wrap('summary', (
      <div className="mb-6">
        {h2(SECTION_LABELS.summary)}
        <p className="text-[10px] leading-relaxed text-justify text-slate-600 font-light">{summary}</p>
      </div>
    ), 'summary') : null,

    experience: experience.length > 0 ? wrap('experience', (
      <div className="mb-6">
        {h2(SECTION_LABELS.experience)}
        <div className="space-y-4">
          {experience.map((exp) => (
            <div key={exp.id} className="exp-entry">
              <div className="flex justify-between items-baseline mb-0.5">
                <div className="text-[11px] font-semibold text-slate-800">{exp.jobTitle} <span className="font-light text-slate-500">— {exp.company}</span></div>
                <div className="text-[9px] text-slate-400 font-light">{formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}</div>
              </div>
              {exp.location && <div className="text-[9px] text-slate-400 font-light -mt-0.5 mb-1">{exp.location}</div>}
              <ul className="space-y-0.5">
                {exp.bullets.filter(b => b.trim() !== '').map((bullet) => (
                  <li key={bullet} className="text-[9.5px] leading-relaxed text-slate-600 font-light pl-3 -indent-2 ml-2">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ), 'experience') : null,

    education: education.length > 0 ? wrap('education', (
      <div className="mb-6">
        {h2(SECTION_LABELS.education)}
        <div className="space-y-2">
          {education.map((edu) => (
            <div key={edu.id} className="edu-entry">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-semibold text-slate-800">{edu.school}</span>
                <span className="text-[9px] text-slate-400 font-light">{formatDate(edu.graduationDate)}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-light">{edu.degree}{edu.gpa && parseFloat(edu.gpa) >= 3.5 ? ` · GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      </div>
    ), 'education') : null,

    skills: skills.length > 0 ? wrap('skills', (
      <div className="mb-4">
        {h2(SECTION_LABELS.skills)}
        <p className="text-[10px] text-slate-600 font-light leading-relaxed">{skills.join('  ·  ')}</p>
      </div>
    ), 'skills') : null,

    projects: projects.length > 0 ? wrap('projects', (
      <div className="mb-6">
        {h2(SECTION_LABELS.projects)}
        <div className="space-y-3">
          {projects.map((proj) => (
            <div key={proj.id} className="proj-entry">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-semibold text-slate-800">{proj.name}</span>
                <span className="text-[8.5px] text-slate-400 font-light">{proj.technologies.join(' · ')}</span>
              </div>
              <p className="text-[9.5px] text-slate-500 font-light mt-0.5">{proj.description}</p>
            </div>
          ))}
        </div>
      </div>
    ), 'projects') : null,

    languages: languages.length > 0 ? wrap('languages', (
      <div className="mb-6">
        {h2(SECTION_LABELS.languages)}
        <p className="text-[10px] text-slate-600 font-light">{languages.map(l => `${l.name} (${l.proficiency})`).join(' · ')}</p>
      </div>
    ), 'languages') : null,

    awards: awards.length > 0 ? wrap('awards', (
      <div className="mb-6">
        {h2(SECTION_LABELS.awards)}
        <div className="space-y-1.5">
          {awards.map((a) => (
            <div key={a.id} className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-600 font-light">{a.title}{a.awarder ? ` — ${a.awarder}` : ''}</span>
              {a.date && <span className="text-[9px] text-slate-400 font-light">{a.date}</span>}
            </div>
          ))}
        </div>
      </div>
    ), 'awards') : null,

    certifications: certifications.length > 0 ? wrap('certifications', (
      <div className="mb-6">
        {h2(SECTION_LABELS.certifications)}
        <div className="space-y-1.5">
          {certifications.map((c) => (
            <div key={c.id} className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-600 font-light">{c.title}{c.issuer ? ` — ${c.issuer}` : ''}</span>
              {c.date && <span className="text-[9px] text-slate-400 font-light">{c.date}</span>}
            </div>
          ))}
        </div>
      </div>
    ), 'certifications') : null,

    interests: interests.length > 0 ? wrap('interests', (
      <div className="mb-6">
        {h2(SECTION_LABELS.interests)}
        <p className="text-[10px] text-slate-600 font-light">{interests.map(i => i.name).join(', ')}</p>
      </div>
    ), 'interests') : null,

    publications: publications.length > 0 ? wrap('publications', (
      <div className="mb-6">
        {h2(SECTION_LABELS.publications)}
        <div className="space-y-1.5">
          {publications.map((p) => (
            <div key={p.id} className="text-[10px] text-slate-600 font-light">{p.title}{p.publisher ? ` — ${p.publisher}` : ''}{p.date ? ` (${p.date})` : ''}</div>
          ))}
        </div>
      </div>
    ), 'publications') : null,

    references: references.length > 0 ? wrap('references', (
      <div className="mb-6">
        {h2(SECTION_LABELS.references)}
        <div className="space-y-1.5">
          {references.map((r) => (
            <div key={r.id} className="text-[10px] text-slate-600 font-light">{r.name}{r.position ? ` · ${r.position}` : ''}</div>
          ))}
        </div>
      </div>
    ), 'references') : null,

    volunteer: volunteer.length > 0 ? wrap('volunteer', (
      <div className="mb-6">
        {h2(SECTION_LABELS.volunteer)}
        <div className="space-y-1.5">
          {volunteer.map((v) => (
            <div key={v.id} className="text-[10px] text-slate-600 font-light">{v.organization}{v.location ? ` · ${v.location}` : ''}</div>
          ))}
        </div>
      </div>
    ), 'volunteer') : null,
  }

  return (
    <div className="resume-template" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="resume-page text-[10px] leading-relaxed text-slate-600 p-12 select-text max-w-full space-y-5" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <PreviewSectionWrapper
          sectionId="contact"
          activeSection={activeSection}
          atsMode={atsMode}
          atsRating={ats.contact.rating}
          atsFeedback={ats.contact.feedback}
          onEdit={onEditSection}
        >
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h1 className="text-3xl font-extralight tracking-tight text-slate-800">{getFullName(contact) || 'YOUR NAME'}</h1>
            <div className="text-[9.5px] text-slate-400 font-light mt-1.5 tracking-wide">
              {[contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean).join('  ·  ')}
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
          <div className="resume-page resume-page-continuation text-[10px] leading-relaxed text-slate-600 p-12 select-text max-w-full space-y-5" style={{ paddingTop: 56, paddingBottom: 56, fontFamily: "'Inter', system-ui, sans-serif" }}>
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

export default CleanTemplate
