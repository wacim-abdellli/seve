import type { ResumeData } from '../../types/resume'
import PreviewSectionWrapper from '../PreviewSectionWrapper'
import { SECTION_LABELS } from '../../utils/sectionLabels'
import { formatDate } from '../../utils/dateUtils'
import { getFullName } from '../../utils/contactUtils'
import { evaluateSectionAts } from '../../utils/atsEvaluator'
import { getPageBreakSections } from '../../utils/layoutHelper'
import { User, Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, FolderGit, Wrench, FileText, Award, BookOpen, Users, Heart } from 'lucide-react'

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

interface CreativeTemplateProps {
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

export default function CreativeTemplate({ 
  data, 
  activeSection, 
  atsMode, 
  onEditSection,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills', 'awards', 'publications', 'references', 'volunteer'],
  onDragStart,
  onDragOver,
  onDrop,
  themeColor = '#e11d48'
}: CreativeTemplateProps) {
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

  // Left Sidebar Sections Mapping
  const leftSectionsMap: Record<string, React.ReactNode> = {
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
        <div className="space-y-3">
          <div className="pb-1.5 border-b flex items-center gap-1.5" style={{ borderBottomColor: `${themeColor}20` }}>
            <Wrench className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h3 className="text-[9.5px] font-black tracking-wider text-slate-900 section-heading">{SECTION_LABELS.skills}</h3>
          </div>
          <p className="text-[9px] leading-relaxed text-slate-700">
            {skills.join(' · ')}
          </p>
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
      >
        <div className="space-y-3">
          <div className="pb-1.5 border-b flex items-center gap-1.5" style={{ borderBottomColor: `${themeColor}20` }}>
            <Globe className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h3 className="text-[9.5px] font-black tracking-wider text-slate-900 section-heading">{SECTION_LABELS.languages}</h3>
          </div>
          <div className="space-y-1 text-[9px] text-slate-700">
            {languages.map((lang) => (
              <div key={lang.id}>
                <span className="font-semibold text-slate-900">{lang.name}</span>
                <span className="text-slate-500"> — {lang.proficiency}</span>
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
      >
        <div className="space-y-3">
          <div className="pb-1.5 border-b flex items-center gap-1.5" style={{ borderBottomColor: `${themeColor}20` }}>
            <h3 className="text-[9.5px] font-black tracking-wider text-slate-900 section-heading">{SECTION_LABELS.interests}</h3>
          </div>
          <p className="text-[9px] leading-relaxed text-slate-700">
            {interests.map((i) => i.name + (i.keywords.length > 0 ? ` (${i.keywords.join(', ')})` : '')).join(' · ')}
          </p>
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
      >
        <div className="space-y-3">
          <div className="pb-1.5 border-b flex items-center gap-1.5" style={{ borderBottomColor: `${themeColor}20` }}>
            <h3 className="text-[9.5px] font-black tracking-wider text-slate-900 section-heading">{SECTION_LABELS.certifications}</h3>
          </div>
          <div className="space-y-1 text-[9px] text-slate-700">
            {certifications.map((c) => (
              <div key={c.id}>
                <span className="font-semibold text-slate-900">{c.title}</span>
                {c.issuer && <span className="text-slate-500"> — {c.issuer}</span>}
                {c.date && <span className="text-slate-400"> ({c.date})</span>}
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null,
  }

  // Right Column Content dynamic builder
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
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-2.5">
            <FileText className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.summary}
            </h2>
          </div>
          <p className="text-[9.5px] leading-relaxed text-justify text-slate-755">{summary}</p>
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
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-3">
            <Briefcase className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.experience}
            </h2>
          </div>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-0.5 exp-entry">
                <div className="flex justify-between items-baseline font-sans">
                  <div className="text-[9.5px] font-extrabold text-slate-900">
                    {exp.jobTitle} &mdash; <span className="font-bold" style={{ color: themeColor }}>{exp.company}</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 font-mono">
                    {formatDate(exp.startDate)} &ndash; {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[8.5px] text-slate-500 italic -mt-0.5">{exp.location}</div>
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
        <div className="mb-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-3">
            <FolderGit className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.projects}
            </h2>
          </div>
          <div className="space-y-3">
            {projects
              .filter(proj => proj.name?.trim())
              .map((proj) => (
               <div key={proj.id} className="proj-entry" style={{ marginBottom: '8pt' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: '700', fontSize: '9.5pt', color: '#0f172a' }}>
                      {proj.name}
                    </span>
                    {proj.link && (
                      <span style={{ fontSize: '8pt', color: '#666666', fontStyle: 'italic' }}>
                        {proj.link}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '9pt', color: '#555555', fontStyle: 'italic', margin: '1pt 0 2pt 0' }}>
                    {proj.technologies.join(' · ')}
                  </p>
                  <p style={{ fontSize: '9.5pt', color: '#111111', lineHeight: '1.45', margin: '0' }}>
                    {proj.description}
                  </p>
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
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-2.5">
            <GraduationCap className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.education}
            </h2>
          </div>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="edu-entry mb-2 last:mb-0 font-sans">
                {/* School name — primary, bold */}
                <div className="flex justify-between items-baseline">
                  <span className="text-[9.5px] font-bold text-slate-900">
                    {edu.school || 'Institution Name'}
                  </span>
                  <span className="font-bold text-[8.5px]" style={{ color: themeColor }}>{formatDate(edu.graduationDate)}</span>
                </div>
                {/* Degree / details */}
                <div className="text-[9px] text-slate-500 mt-0.5">
                  <span className="italic">{edu.degree}</span>
                  {edu.location && ` · ${edu.location}`}
                  {edu.gpa && parseFloat(edu.gpa) >= 3.5 && ` · GPA: ${edu.gpa}`}
                </div>
              </div>
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
        <div className="mb-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-3">
            <Award className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.awards}
            </h2>
          </div>
          <div className="space-y-2">
            {awards.map((a) => (
              <div key={a.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-sans">
                  <span className="text-[9.5px] font-extrabold text-slate-900">{a.title}</span>
                  {a.date && <span className="text-[9px] font-bold text-slate-500">{a.date}</span>}
                </div>
                {a.awarder && <div className="text-[8.5px] text-slate-500 italic">{a.awarder}</div>}
                {a.description && <p className="text-[9.5px] leading-relaxed text-justify text-slate-700">{a.description}</p>}
              </div>
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
        <div className="mb-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-3">
            <BookOpen className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.publications}
            </h2>
          </div>
          <div className="space-y-2">
            {publications.map((p) => (
              <div key={p.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-sans">
                  <span className="text-[9.5px] font-extrabold text-slate-900">{p.title}</span>
                  {p.date && <span className="text-[9px] font-bold text-slate-500">{p.date}</span>}
                </div>
                {p.publisher && <div className="text-[8.5px] text-slate-500 italic">{p.publisher}</div>}
                {p.description && <p className="text-[9.5px] leading-relaxed text-justify text-slate-700">{p.description}</p>}
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
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-3">
            <Users className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.references}
            </h2>
          </div>
          <div className="space-y-2">
            {references.map((r) => (
              <div key={r.id} className="space-y-0.5">
                <div className="text-[9.5px] font-extrabold text-slate-900">{r.name}</div>
                {r.position && <div className="text-[8.5px] text-slate-500 italic">{r.position}</div>}
                {r.phone && <div className="text-[8.5px] text-slate-500">{r.phone}</div>}
                {r.description && <p className="text-[9.5px] leading-relaxed text-justify text-slate-700">{r.description}</p>}
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
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 mb-3">
            <Heart className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <h2 className="text-[10px] font-black tracking-wider text-slate-900 font-sans section-heading">
              {SECTION_LABELS.volunteer}
            </h2>
          </div>
          <div className="space-y-2">
            {volunteer.map((v) => (
              <div key={v.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-sans">
                  <span className="text-[9.5px] font-extrabold text-slate-900">{v.organization}</span>
                  {v.period && <span className="text-[9px] font-bold text-slate-500">{v.period}</span>}
                </div>
                {v.location && <div className="text-[8.5px] text-slate-500 italic">{v.location}</div>}
                {v.description && <p className="text-[9.5px] leading-relaxed text-justify text-slate-700">{v.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </PreviewSectionWrapper>
    ) : null
  }

  const leftSectionKeys = ['skills', 'languages', 'interests', 'certifications']
  const { page1Sections, page2Sections } = getPageBreakSections(data, sectionOrder, leftSectionKeys)

  const page1Left = page1Sections.filter(k => leftSectionKeys.includes(k))
  const page1Right = page1Sections.filter(k => !leftSectionKeys.includes(k))

  const page2Left = page2Sections.filter(k => leftSectionKeys.includes(k))
  const page2Right = page2Sections.filter(k => !leftSectionKeys.includes(k))

  return (
    <div className="resume-template">
      {/* Page 1 */}
      <div className="resume-page font-sans text-[9.5pt] leading-normal text-slate-800 p-0 select-text max-w-full flex w-full min-h-[1123px] overflow-hidden">
        {/* Left column (Off-white sidebar) */}
        <div className="w-[220px] p-6 space-y-6 flex flex-col justify-start shrink-0 left-column" style={{ backgroundColor: '#f2f2f2', borderRightWidth: 1, borderRightColor: '#e2e8f0' }}>
          {/* Name header */}
          <div className="text-left pt-2 pb-2">
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight tracking-tight">
              {getFullName(contact) || 'YOUR NAME'}
            </h1>
          </div>

          {/* Contact info block */}
          <PreviewSectionWrapper
            sectionId="contact"
            activeSection={activeSection}
            atsMode={atsMode}
            atsRating={contactAts.rating}
            atsFeedback={contactAts.feedback}
            onEdit={onEditSection}
          >
            <div className="space-y-3">
              <div className="pb-1.5 border-b flex items-center gap-1.5" style={{ borderBottomColor: `${themeColor}20` }}>
                <User className="w-3.5 h-3.5" style={{ color: themeColor }} />
                <h3 className="text-[9.5px] font-black uppercase tracking-wider text-slate-900">Info</h3>
              </div>
              <div className="space-y-2 text-[9px] text-slate-700 font-medium">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                    <span>{contact.location}</span>
                  </div>
                )}
                {contact.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                    <span className="truncate">{contact.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '')}</span>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                    <span className="truncate">{contact.website.replace(/^(https?:\/\/)?(www\.)?/, '')}</span>
                  </div>
                )}
              </div>
            </div>
          </PreviewSectionWrapper>

          {/* Left Sidebar Sections */}
          {page1Left.map((secId) => {
            const component = leftSectionsMap[secId]
            return component ? <div key={secId}>{component}</div> : null
          })}
        </div>

        {/* Right column (Main details area) */}
        <div className="flex-1 p-10 space-y-5">
          {page1Right.map((secId) => {
            const component = sectionsMap[secId]
            return component ? <div key={secId}>{component}</div> : null
          })}
        </div>
      </div>

      {/* Page 2 */}
      {page2Sections.length > 0 && (
        <>
          <div className="resume-page-break" />
          <div className="resume-page resume-page-continuation font-sans text-[9.5pt] leading-normal text-slate-800 p-0 select-text max-w-full flex w-full min-h-[1123px] overflow-hidden">
            {/* Left column (Off-white sidebar) */}
            <div className="w-[220px] p-6 space-y-6 flex flex-col justify-start shrink-0 left-column" style={{ backgroundColor: '#f2f2f2', borderRightWidth: 1, borderRightColor: '#e2e8f0' }}>
              {page2Left.map((secId) => {
                const component = leftSectionsMap[secId]
                return component ? <div key={secId}>{component}</div> : null
              })}
            </div>

            {/* Right column (Main details area) */}
            <div className="flex-1 p-10 space-y-5">
              {page2Right.map((secId) => {
                const component = sectionsMap[secId]
                return component ? <div key={secId}>{component}</div> : null
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
