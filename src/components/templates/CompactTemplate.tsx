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

interface CompactTemplateProps {
  data: ResumeData
  activeSection?: string | null
  atsMode?: boolean
  onEditSection?: (section: string) => void
  sectionOrder?: string[]
  onDragStart?: (e: React.DragEvent, sectionId: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (sectionId: string) => void
}

const CompactTemplate = memo(function CompactTemplate({
  data, activeSection, atsMode, onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  onDragStart, onDragOver, onDrop
}: CompactTemplateProps) {
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
    <ResumeSectionHeading label={label} className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" />
  )

  const sectionsMap: Record<string, React.ReactNode> = {
    summary: summary ? wrap('summary', (
      <div className="mb-3 resume-section">
        {h2(SECTION_LABELS.summary)}
        <p className="text-[8.5px] leading-relaxed text-slate-700">{summary}</p>
      </div>
    ), 'summary') : null,

    experience: experience.length > 0 ? wrap('experience', (
      <div className="mb-3 resume-section-breakable">
        {h2(SECTION_LABELS.experience)}
        <div className="space-y-2">
          {experience.map((exp) => (
            <div key={exp.id} className="exp-entry">
              <div className="flex justify-between items-baseline">
                <div className="text-[9px] font-bold text-slate-900">{exp.jobTitle} — {exp.company}</div>
                <ResumeDateRange startDate={exp.startDate} endDate={exp.endDate} current={exp.current} className="text-[8px] font-medium text-slate-500" />
              </div>
              <ResumeBulletList bullets={exp.bullets} className="mt-0.5" itemClassName="text-[8px] leading-relaxed text-slate-600 pl-3 -indent-2 ml-2" />
            </div>
          ))}
        </div>
      </div>
    ), 'experience') : null,

    education: education.length > 0 ? wrap('education', (
      <div className="mb-3 resume-section-breakable">
        {h2(SECTION_LABELS.education)}
        <div className="space-y-1">
          {education.map((edu) => (
            <div key={edu.id} className="flex justify-between items-baseline">
              <span className="text-[9px] font-bold text-slate-900">{edu.school} — {edu.degree}</span>
              <span className="text-[8px] text-slate-500">{formatDate(edu.graduationDate)}</span>
            </div>
          ))}
        </div>
      </div>
    ), 'education') : null,

    skills: skills.length > 0 ? wrap('skills', (
      <div className="mb-2 resume-section">
        {h2(SECTION_LABELS.skills)}
        <ResumeSkillsList skills={skills} separator=" | " className="text-[8.5px] text-slate-700" />
      </div>
    ), 'skills') : null,

    projects: projects.length > 0 ? wrap('projects', (
      <div className="mb-3 resume-section-breakable">
        {h2(SECTION_LABELS.projects)}
        <div className="space-y-1.5">
          {projects.map((proj) => (
            <div key={proj.id} className="proj-entry">
              <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-bold text-slate-900">{proj.name}</span>
                <span className="text-[7.5px] text-slate-500">{proj.technologies.join(', ')}</span>
              </div>
              <p className="text-[8px] text-slate-600">{proj.description}</p>
            </div>
          ))}
        </div>
      </div>
    ), 'projects') : null,

    languages: languages.length > 0 ? wrap('languages', (
      <div className="mb-3 resume-section">
        {h2(SECTION_LABELS.languages)}
        <p className="text-[8.5px] text-slate-700">
          {languages.map((lang, idx) => (
            <span key={lang.id}>{idx > 0 && ' · '}{lang.name} ({lang.proficiency})</span>
          ))}
        </p>
      </div>
    ), 'languages') : null,

    awards: awards.length > 0 ? wrap('awards', (
      <div className="mb-3 resume-section">
        {h2(SECTION_LABELS.awards)}
        {awards.map((a) => (
          <div key={a.id} className="text-[8.5px] text-slate-700">{a.title}{a.awarder ? ` — ${a.awarder}` : ''}</div>
        ))}
      </div>
    ), 'awards') : null,

    certifications: certifications.length > 0 ? wrap('certifications', (
      <div className="mb-3 resume-section">
        {h2(SECTION_LABELS.certifications)}
        {certifications.map((c) => (
          <div key={c.id} className="text-[8.5px] text-slate-700">{c.title}{c.issuer ? ` — ${c.issuer}` : ''}</div>
        ))}
      </div>
    ), 'certifications') : null,

    interests: interests.length > 0 ? wrap('interests', (
      <div className="mb-3 resume-section">
        {h2(SECTION_LABELS.interests)}
        <p className="text-[8.5px] text-slate-700">{interests.map(i => i.name).join(', ')}</p>
      </div>
    ), 'interests') : null,

    publications: publications.length > 0 ? wrap('publications', (
      <div className="mb-3 resume-section">
        {h2(SECTION_LABELS.publications)}
        {publications.map((p) => (
          <div key={p.id} className="text-[8.5px] text-slate-700">{p.title}{p.publisher ? ` — ${p.publisher}` : ''}</div>
        ))}
      </div>
    ), 'publications') : null,

    volunteer: volunteer.length > 0 ? wrap('volunteer', (
      <div className="mb-3 resume-section">
        {h2(SECTION_LABELS.volunteer)}
        {volunteer.map((v) => (
          <div key={v.id} className="text-[8.5px] text-slate-700">{v.organization}{v.location ? ` — ${v.location}` : ''}</div>
        ))}
      </div>
    ), 'volunteer') : null,

    references: references.length > 0 ? wrap('references', (
      <div className="mb-3 resume-section">
        {h2(SECTION_LABELS.references)}
        {references.map((r) => (
          <div key={r.id} className="text-[8.5px] text-slate-700">{r.name}{r.position ? ` — ${r.position}` : ''}</div>
        ))}
      </div>
    ), 'references') : null,
  }

  return (
    <div className="resume-template" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="resume-page text-[8.5px] leading-normal text-slate-800 p-8 select-text max-w-full" style={{ paddingTop: 36, paddingBottom: 36 }}>
        <PreviewSectionWrapper
          sectionId="contact"
          activeSection={activeSection}
          atsMode={atsMode}
          atsRating={ats.contact.rating}
          atsFeedback={ats.contact.feedback}
          onEdit={onEditSection}
        >
          <div className="mb-3 pb-2 border-b border-slate-200">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">{getFullName(contact) || 'YOUR NAME'}</h1>
            <div className="text-[8px] text-slate-500 mt-0.5">
              {[contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean).join(' · ')}
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

export default CompactTemplate
