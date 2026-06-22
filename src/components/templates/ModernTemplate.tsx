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

interface ModernTemplateProps {
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

function SectionHeading({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: color }} />
      <ResumeSectionHeading label={label} className="text-[11px] font-black tracking-wider text-slate-950 section-heading" />
    </div>
  )
}

const ModernTemplate = memo(function ModernTemplate({
  data, activeSection, atsMode, onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  onDragStart, onDragOver, onDrop, themeColor = '#b91c1c'
}: ModernTemplateProps) {
  const {
    contact, summary, experience, education, skills, projects, languages,
    awards, certifications, interests, publications, references, volunteer,
    ats, sectionData,
  } = useTemplateData(data, activeSection, atsMode, onEditSection, onDragStart, onDragOver, onDrop, sectionOrder)

  const renderPreviewWrapper = (sectionId: string, children: React.ReactNode, dragSection?: string) => (
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

  const sectionsMap: Record<string, React.ReactNode> = {
    summary: summary ? renderPreviewWrapper('summary', (
      <div className="mb-5 resume-section">
        <SectionHeading label={SECTION_LABELS.summary} color={themeColor} />
        <p className="text-[10px] leading-relaxed text-justify text-slate-750">{summary}</p>
      </div>
    ), 'summary') : null,

    experience: experience.length > 0 ? renderPreviewWrapper('experience', (
      <div className="mb-5 resume-section-breakable">
        <SectionHeading label={SECTION_LABELS.experience} color={themeColor} />
        <div className="space-y-4">
          {experience.map((exp) => (
            <div key={exp.id} className="space-y-1 exp-entry">
              <div className="flex justify-between items-baseline">
                <div className="text-[10.5px] font-bold text-slate-950">
                  {exp.jobTitle} <span className="font-semibold" style={{ color: themeColor }}>— {exp.company}</span>
                </div>
                <div className="text-[9.5px] font-bold text-slate-500">
                  <ResumeDateRange startDate={exp.startDate} endDate={exp.endDate} current={exp.current} className="text-[9.5px] font-bold text-slate-500" />
                </div>
              </div>
              {exp.location && <div className="text-[9px] text-slate-500 font-medium">{exp.location}</div>}
              <ResumeBulletList bullets={exp.bullets} className="space-y-1 pl-4" itemClassName="text-[10px] leading-relaxed text-justify list-disc text-slate-700 pl-0.5" />
            </div>
          ))}
        </div>
      </div>
    ), 'experience') : null,

    education: education.length > 0 ? renderPreviewWrapper('education', (
      <div className="mb-5 resume-section-breakable">
        <SectionHeading label={SECTION_LABELS.education} color={themeColor} />
        <div className="space-y-4">
          {education.map((edu) => (
            <div key={edu.id} className="edu-entry">
              <div className="flex justify-between items-baseline font-sans">
                <span className="text-[10.5px] font-bold text-slate-950">{edu.school || 'Institution Name'}</span>
                <span className="text-[9.5px] font-bold text-slate-500">{formatDate(edu.graduationDate)}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                <span>{edu.degree}</span>
                {edu.location && ` · ${edu.location}`}
                {edu.gpa && parseFloat(edu.gpa) >= 3.5 && ` · GPA: ${edu.gpa}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    ), 'education') : null,

    skills: skills.length > 0 ? renderPreviewWrapper('skills', (
      <div className="mb-2 resume-section">
        <SectionHeading label={SECTION_LABELS.skills} color={themeColor} />
        <ResumeSkillsList skills={skills} className="text-[10px] leading-relaxed text-slate-700" />
      </div>
    ), 'skills') : null,

    projects: projects.length > 0 ? renderPreviewWrapper('projects', (
      <div className="mb-5 resume-section-breakable">
        <SectionHeading label={SECTION_LABELS.projects} color={themeColor} />
        <div className="space-y-3.5">
          {projects.map((proj) => (
            <div key={proj.id} className="space-y-0.5 proj-entry">
              <div className="flex justify-between items-baseline">
                <div className="text-[10.5px] font-bold text-slate-950">
                  {proj.name} {proj.link && <span className="text-[9px] font-normal text-slate-500 lowercase">({proj.link})</span>}
                </div>
                <div className="text-[9.5px] font-bold" style={{ color: themeColor }}>{proj.technologies.join(' | ')}</div>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-700 text-justify">{proj.description}</p>
            </div>
          ))}
        </div>
      </div>
    ), 'projects') : null,

    languages: languages.length > 0 ? renderPreviewWrapper('languages', (
      <div className="mb-5 resume-section">
        <SectionHeading label={SECTION_LABELS.languages} color={themeColor} />
        <p className="text-[10px] leading-relaxed text-slate-700">
          {languages.map((lang, idx) => (
            <span key={lang.id}>{idx > 0 && ' · '}<span>{lang.name} ({lang.proficiency})</span></span>
          ))}
        </p>
      </div>
    ), 'languages') : null,

    awards: awards.length > 0 ? renderPreviewWrapper('awards', (
      <div className="mb-5 resume-section">
        <SectionHeading label={SECTION_LABELS.awards} color={themeColor} />
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
    ), 'awards') : null,

    certifications: certifications.length > 0 ? renderPreviewWrapper('certifications', (
      <div className="mb-5 resume-section">
        <SectionHeading label={SECTION_LABELS.certifications} color={themeColor} />
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
    ), 'certifications') : null,

    interests: interests.length > 0 ? renderPreviewWrapper('interests', (
      <div className="mb-5 resume-section">
        <SectionHeading label={SECTION_LABELS.interests} color={themeColor} />
        <p className="text-[10px] leading-relaxed text-slate-700">
          {interests.map((i, idx) => (
            <span key={i.id}>{idx > 0 && ' · '}<span>{i.name}{i.keywords?.length ? ` (${i.keywords.join(', ')})` : ''}</span></span>
          ))}
        </p>
      </div>
    ), 'interests') : null,

    publications: publications.length > 0 ? renderPreviewWrapper('publications', (
      <div className="mb-5 resume-section">
        <SectionHeading label={SECTION_LABELS.publications} color={themeColor} />
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
    ), 'publications') : null,

    references: references.length > 0 ? renderPreviewWrapper('references', (
      <div className="mb-5 resume-section">
        <SectionHeading label={SECTION_LABELS.references} color={themeColor} />
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
    ), 'references') : null,

    volunteer: volunteer.length > 0 ? renderPreviewWrapper('volunteer', (
      <div className="mb-5 resume-section">
        <SectionHeading label={SECTION_LABELS.volunteer} color={themeColor} />
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
          <div className="mb-5 relative pb-3 border-b-2" style={{ borderBottomColor: 'var(--template-divider-color)' }}>
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

        {sectionData.page1Sections.map((secId) => {
          const component = sectionsMap[secId]
          return component ? <div key={secId}>{component}</div> : null
        })}
      </div>


    </div>
  )
})

export default ModernTemplate
