import { useMemo } from 'react'
import type { ResumeData } from '../../types/resume'
import { evaluateSectionAts } from '../../utils/atsEvaluator'
import { getPageBreakSections } from '../../utils/layoutHelper'

export interface TemplateSectionData {
  atsRating: string
  atsFeedback: string | undefined
  data: ResumeData
  activeSection: string | null | undefined
  atsMode: boolean | undefined
  onEditSection: ((section: string) => void) | undefined
  onDragStart: ((e: React.DragEvent, sectionId: string) => void) | undefined
  onDragOver: ((e: React.DragEvent) => void) | undefined
  onDrop: ((sectionId: string) => void) | undefined
  sectionOrder: string[]
  page1Sections: string[]
  page2Sections: string[]
  contactAts: { rating: string; feedback: string | undefined }
}

export function useTemplateData(
  data: ResumeData,
  activeSection: string | null | undefined,
  atsMode: boolean | undefined,
  onEditSection: ((section: string) => void) | undefined,
  onDragStart: ((e: React.DragEvent, sectionId: string) => void) | undefined,
  onDragOver: ((e: React.DragEvent) => void) | undefined,
  onDrop: ((sectionId: string) => void) | undefined,
  sectionOrder: string[] = ['summary', 'experience', 'projects', 'education', 'skills']
): {
  contact: ResumeData['contact']
  summary: string
  experience: ResumeData['experience']
  education: ResumeData['education']
  skills: string[]
  projects: NonNullable<ResumeData['projects']>
  languages: NonNullable<ResumeData['languages']>
  awards: NonNullable<ResumeData['awards']>
  certifications: NonNullable<ResumeData['certifications']>
  interests: NonNullable<ResumeData['interests']>
  publications: NonNullable<ResumeData['publications']>
  references: NonNullable<ResumeData['references']>
  volunteer: NonNullable<ResumeData['volunteer']>
  ats: Record<string, { rating: string; feedback: string | undefined }>
  sectionData: TemplateSectionData
} {
  const contact = data?.contact || { fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' }
  const summary = data?.summary || ''
  const experience = (data?.experience || []).filter(
    (exp) => exp?.jobTitle?.trim() && exp?.company?.trim()
  )
  const education = (data?.education || []).filter(
    (edu) => edu?.school?.trim() && edu?.degree?.trim()
  )
  const skills = (data?.skills || []).filter((s) => s?.trim())
  const projects = (data?.projects || []).filter((p) => p?.name?.trim())
  const languages = (data?.languages || []).filter((l) => l?.name?.trim())
  const awards = (data?.awards || []).filter((a) => a?.title?.trim())
  const certifications = (data?.certifications || []).filter((c) => c?.title?.trim())
  const interests = (data?.interests || []).filter((i) => i?.name?.trim())
  const publications = (data?.publications || []).filter((p) => p?.title?.trim())
  const references = (data?.references || []).filter((r) => r?.name?.trim())
  const volunteer = (data?.volunteer || []).filter((v) => v?.organization?.trim())

  const atsEntries = ['contact', 'summary', 'experience', 'projects', 'education', 'skills',
    'languages', 'awards', 'certifications', 'interests', 'publications', 'references', 'volunteer'] as const

  const ats = useMemo(() => {
    const result: Record<string, { rating: string; feedback: string | undefined }> = {}
    for (const section of atsEntries) {
      const r = evaluateSectionAts(section, data)
      result[section] = { rating: r.rating, feedback: r.feedback }
    }
    return result
  }, [data])

  const { page1Sections, page2Sections } = getPageBreakSections(data, sectionOrder)

  const sectionData: TemplateSectionData = {
    atsRating: '',
    atsFeedback: '',
    data,
    activeSection,
    atsMode,
    onEditSection: onEditSection as ((section: string) => void) | undefined,
    onDragStart: onDragStart as ((e: React.DragEvent, sectionId: string) => void) | undefined,
    onDragOver,
    onDrop: onDrop as ((sectionId: string) => void) | undefined,
    sectionOrder,
    page1Sections,
    page2Sections,
    contactAts: ats.contact,
  }

  return {
    contact, summary, experience, education, skills, projects, languages,
    awards, certifications, interests, publications, references, volunteer,
    ats,
    sectionData,
  }
}
