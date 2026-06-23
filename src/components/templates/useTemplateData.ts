import { useMemo } from 'react'
import type { ResumeData } from '../../types/resume'
import { evaluateSectionAts } from '../../utils/atsEvaluator'
import { getPageBreakSections } from '../../utils/layoutHelper'

export interface TemplateSectionData {
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
  const contact = useMemo(() => data?.contact || { fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' }, [data])
  const summary = useMemo(() => data?.summary || '', [data])
  const experience = useMemo(() => (data?.experience || []).filter(
    (exp) => exp?.jobTitle?.trim() && exp?.company?.trim()
  ), [data])
  const education = useMemo(() => (data?.education || []).filter(
    (edu) => edu?.school?.trim() && edu?.degree?.trim()
  ), [data])
  const skills = useMemo(() => (data?.skills || []).filter((s) => s?.trim()), [data])
  const projects = useMemo(() => (data?.projects || []).filter((p) => p?.name?.trim()), [data])
  const languages = useMemo(() => (data?.languages || []).filter((l) => l?.name?.trim()), [data])
  const awards = useMemo(() => (data?.awards || []).filter((a) => a?.title?.trim()), [data])
  const certifications = useMemo(() => (data?.certifications || []).filter((c) => c?.title?.trim()), [data])
  const interests = useMemo(() => (data?.interests || []).filter((i) => i?.name?.trim()), [data])
  const publications = useMemo(() => (data?.publications || []).filter((p) => p?.title?.trim()), [data])
  const references = useMemo(() => (data?.references || []).filter((r) => r?.name?.trim()), [data])
  const volunteer = useMemo(() => (data?.volunteer || []).filter((v) => v?.organization?.trim()), [data])

  const atsEntries = useMemo(() => ['contact', 'summary', 'experience', 'projects', 'education', 'skills',
    'languages', 'awards', 'certifications', 'interests', 'publications', 'references', 'volunteer'] as const, [])

  const ats = useMemo(() => {
    const result: Record<string, { rating: string; feedback: string | undefined }> = {}
    for (const section of atsEntries) {
      const r = evaluateSectionAts(section, data)
      result[section] = { rating: r.rating, feedback: r.feedback }
    }
    return result
  }, [data, atsEntries])

  const { page1Sections, page2Sections } = useMemo(() => getPageBreakSections(data, sectionOrder), [data, sectionOrder])

  const sectionData: TemplateSectionData = useMemo(() => ({
    data,
    activeSection,
    atsMode,
    onEditSection,
    onDragStart,
    onDragOver,
    onDrop,
    sectionOrder,
    page1Sections,
    page2Sections,
    contactAts: ats.contact,
  }), [
    data,
    activeSection,
    atsMode,
    onEditSection,
    onDragStart,
    onDragOver,
    onDrop,
    sectionOrder,
    page1Sections,
    page2Sections,
    ats.contact
  ])

  return useMemo(() => ({
    contact, summary, experience, education, skills, projects, languages,
    awards, certifications, interests, publications, references, volunteer,
    ats,
    sectionData,
  }), [
    contact, summary, experience, education, skills, projects, languages,
    awards, certifications, interests, publications, references, volunteer,
    ats,
    sectionData
  ])
}
