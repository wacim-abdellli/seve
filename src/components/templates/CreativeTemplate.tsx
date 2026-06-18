import type { ResumeData } from '../../types/resume'
import { memo } from 'react'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
import { useTemplateData } from './useTemplateData'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import ResumeSectionHeading from '../ui/resume/ResumeSectionHeading'
import ResumeDateRange from '../ui/resume/ResumeDateRange'
import ResumeBulletList from '../ui/resume/ResumeBulletList'
import { Mail, Phone, MapPin, Globe } from 'lucide-react'

interface CreativeTemplateProps {
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

function LinkedinIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const CreativeTemplate = memo(function CreativeTemplate({
  data, activeSection, atsMode, onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills', 'languages', 'awards', 'certifications', 'interests', 'publications', 'references', 'volunteer'],
  onDragStart, onDragOver, onDrop, themeColor = '#e11d48'
}: CreativeTemplateProps) {
  const {
    contact, summary, experience, education, skills, projects, languages,
    awards, certifications, interests, publications, references, volunteer,
    ats, sectionData,
  } = useTemplateData(data, activeSection, atsMode, onEditSection, onDragStart, onDragOver, onDrop, sectionOrder)

  const leftSectionKeys = ['skills', 'languages', 'interests', 'certifications']

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
    <ResumeSectionHeading label={label} className="text-[9.5px] font-black tracking-wider text-slate-900 pb-1.5 border-b font-sans" style={{ borderBottomColor: `${themeColor}20` }} />
  )

  const rightH2 = (label: string) => (
    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-2.5">
      <ResumeSectionHeading label={label} className="text-[10px] font-black tracking-wider text-slate-900 font-sans" />
    </div>
  )

  const leftSectionsMap: Record<string, React.ReactNode> = {
    skills: skills.length > 0 ? wrap('skills', (
      <div className="mb-5">
        {leftH2(SECTION_LABELS.skills)}
        <div className="flex flex-wrap gap-1 mt-2">
          {skills.map((sk) => (
            <span key={sk} className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
              {sk}
            </span>
          ))}
        </div>
      </div>
    )) : null,

    languages: languages.length > 0 ? wrap('languages', (
      <div className="mb-5">
        {leftH2(SECTION_LABELS.languages)}
        <p className="text-[9px] text-slate-700 mt-2 leading-relaxed">
          {languages.map((l, idx) => (
            <span key={l.id}>{idx > 0 && <br />}{l.name} — {l.proficiency}</span>
          ))}
        </p>
      </div>
    )) : null,

    interests: interests.length > 0 ? wrap('interests', (
      <div className="mb-5">
        {leftH2(SECTION_LABELS.interests)}
        <p className="text-[9px] text-slate-700 mt-2 leading-relaxed">
          {interests.map((i, idx) => (
            <span key={i.id}>{idx > 0 && ' · '}<span>{i.name}</span></span>
          ))}
        </p>
      </div>
    )) : null,

    certifications: certifications.length > 0 ? wrap('certifications', (
      <div className="mb-5">
        {leftH2(SECTION_LABELS.certifications)}
        <div className="mt-2 space-y-2">
          {certifications.map((c) => (
            <div key={c.id}>
              <div className="text-[9px] font-bold text-slate-900">{c.title}</div>
              <div className="text-[8px] text-slate-500">{c.issuer}{c.date ? ` · ${c.date}` : ''}</div>
            </div>
          ))}
        </div>
      </div>
    )) : null,
  }

  const sectionsMap: Record<string, React.ReactNode> = {
    summary: summary ? wrap('summary', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.summary)}
        <p className="text-[9.5px] leading-relaxed text-justify text-slate-700">{summary}</p>
      </div>
    ), 'summary') : null,

    experience: experience.length > 0 ? wrap('experience', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.experience)}
        <div className="space-y-3">
          {experience.map((exp) => (
            <div key={exp.id} className="space-y-1 exp-entry">
              <div className="flex justify-between items-baseline font-sans">
                <div className="text-[9.5px] font-extrabold text-slate-900">
                  {exp.jobTitle} &mdash; <span className="font-bold" style={{ color: themeColor }}>{exp.company}</span>
                </div>
                <div className="text-[9px] font-bold text-slate-500 font-mono">
                  <ResumeDateRange startDate={exp.startDate} endDate={exp.endDate} current={exp.current} className="text-[9px] font-bold text-slate-500 font-mono" />
                </div>
              </div>
              {exp.location && <div className="text-[8.5px] text-slate-500 italic -mt-0.5">{exp.location}</div>}
              <ResumeBulletList bullets={exp.bullets} className="space-y-0.5 pl-4" itemClassName="text-[9.5px] leading-relaxed text-justify list-disc text-slate-700 pl-0.5" />
            </div>
          ))}
        </div>
      </div>
    ), 'experience') : null,

    education: education.length > 0 ? wrap('education', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.education)}
        <div className="space-y-2">
          {education.map((edu) => (
            <div key={edu.id} className="edu-entry">
              <div className="flex justify-between items-baseline">
                <span className="text-[9.5px] font-bold text-slate-900">{edu.school || 'Institution Name'}</span>
                <span className="text-[8.5px] font-bold" style={{ color: themeColor }}>{formatDate(edu.graduationDate)}</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 italic">
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
        {rightH2(SECTION_LABELS.projects)}
        <div className="space-y-2">
          {projects.map((proj) => (
            <div key={proj.id} className="space-y-0.5 proj-entry" style={{ marginBottom: 8 }}>
              <div className="flex justify-between items-baseline">
                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#0f172a' }}>{proj.name}</span>
                <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b' }}>{proj.technologies.join(', ')}</span>
              </div>
              <p style={{ fontSize: '9px', lineHeight: 1.5, color: '#475569' }}>{proj.description}</p>
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
                <span className="text-[9.5px] font-bold text-slate-900">{a.title}</span>
                {a.date && <span className="text-[8.5px] font-bold text-slate-500">{formatDate(a.date)}</span>}
              </div>
              {a.awarder && <div className="text-[9px] text-slate-600">{a.awarder}</div>}
              {a.description && <p className="text-[9px] leading-relaxed text-slate-600">{a.description}</p>}
            </div>
          ))}
        </div>
      </div>
    ), 'awards') : null,

    publications: publications.length > 0 ? wrap('publications', (
      <div className="mb-5">
        {rightH2(SECTION_LABELS.publications)}
        <div className="space-y-2">
          {publications.map((p) => (
            <div key={p.id} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[9.5px] font-bold text-slate-900">{p.title}</span>
                {p.date && <span className="text-[8.5px] font-bold text-slate-500">{p.date}</span>}
              </div>
              {p.publisher && <div className="text-[9px] text-slate-600">{p.publisher}</div>}
              {p.description && <p className="text-[9px] leading-relaxed text-slate-600">{p.description}</p>}
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
              {r.position && <div className="text-[9px] text-slate-600">{r.position}</div>}
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
              {v.description && <p className="text-[9px] leading-relaxed text-slate-600">{v.description}</p>}
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
    const component = sectionsMap[secId]
    return component ? <div key={secId}>{component}</div> : null
  })

  return (
    <div className="resume-template">
      <div className="grid grid-cols-[220px_1fr] resume-page font-sans text-[9.5px] leading-normal text-slate-800 select-text max-w-full" style={{ padding: 0 }}>
        <div className="min-h-full p-6 pt-8" style={{ backgroundColor: '#f2f2f2', borderRightWidth: 1, borderRightColor: '#e2e8f0', borderRightStyle: 'solid' }}>
          {/* Name */}
          <PreviewSectionWrapper
            sectionId="contact"
            activeSection={activeSection}
            atsMode={atsMode}
            atsRating={ats.contact.rating}
            atsFeedback={ats.contact.feedback}
            onEdit={onEditSection}
          >
            <div className="mb-6">
              <h1 className="text-sm font-extrabold text-slate-900">{getFullName(contact) || 'YOUR NAME'}</h1>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2 text-[9px] text-slate-700"><Mail size={12} className="shrink-0" style={{ color: themeColor }} />{contact.email}</div>
                {contact.phone && <div className="flex items-center gap-2 text-[9px] text-slate-700"><Phone size={12} className="shrink-0" style={{ color: themeColor }} />{contact.phone}</div>}
                {contact.location && <div className="flex items-center gap-2 text-[9px] text-slate-700"><MapPin size={12} className="shrink-0" style={{ color: themeColor }} />{contact.location}</div>}
                {contact.linkedin && <div className="flex items-center gap-2 text-[9px] text-slate-700"><LinkedinIcon className="shrink-0" style={{ color: themeColor }} />{contact.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '')}</div>}
                {contact.website && <div className="flex items-center gap-2 text-[9px] text-slate-700"><Globe size={12} className="shrink-0" style={{ color: themeColor }} />{contact.website.replace(/^(https?:\/\/)?(www\.)?/, '')}</div>}
              </div>
            </div>
          </PreviewSectionWrapper>

          {renderLeft(page1Left)}
        </div>

        <div className="flex-1 p-10 space-y-5">
          {renderRight(page1Right)}
        </div>
      </div>

      {sectionData.page2Sections.length > 0 && (
        <>
          <div className="resume-page-break" />
          <div className="grid grid-cols-[220px_1fr] resume-page resume-page-continuation font-sans text-[9.5px] leading-normal text-slate-800 select-text max-w-full" style={{ padding: 0 }}>
            <div className="min-h-full p-6 pt-8" style={{ backgroundColor: '#f2f2f2', borderRightWidth: 1, borderRightColor: '#e2e8f0', borderRightStyle: 'solid' }}>
              {renderLeft(page2Left)}
            </div>
            <div className="flex-1 p-10 space-y-5">
              {renderRight(page2Right)}
            </div>
          </div>
        </>
      )}
    </div>
  )
})

export default CreativeTemplate
