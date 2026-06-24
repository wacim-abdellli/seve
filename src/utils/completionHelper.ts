import type { ResumeData } from '../types/resume'
import { getActualSkillsCount } from './atsUtils'

export function getSectionStatus(resumeData: ResumeData): Record<string, boolean> {
  const contact = resumeData?.contact || {}
  const hasContact = !!(
    contact.fullName?.trim() &&
    contact.email?.trim() &&
    contact.phone?.trim() &&
    contact.linkedin?.trim() &&
    contact.location?.trim()
  )
  const hasSummary = !!resumeData?.summary?.trim()
  const exp = resumeData?.experience || []
  const hasExperience =
    exp.length > 0 &&
    !!exp.some(e => e.jobTitle?.trim() && e.company?.trim()) &&
    (exp[0]?.bullets?.length ?? 0) >= 2
  const edu = resumeData?.education || []
  const hasEducation = edu.length > 0 &&
    !!edu.some(e => e.school?.trim() || e.degree?.trim())
  const hasSkills = getActualSkillsCount(resumeData?.skills || []) >= 3
  const hasLanguages = !!(resumeData?.languages && resumeData.languages.length > 0 &&
    resumeData.languages.some(l => l?.name?.trim()))
  const hasProjects = !!(resumeData?.projects && resumeData.projects.length > 0 &&
    resumeData.projects.some(p => p?.name?.trim()))
  const hasAwards = !!(resumeData?.awards && resumeData.awards.length > 0 &&
    resumeData.awards.some(a => a?.title?.trim()))
  const hasCertifications = !!(resumeData?.certifications && resumeData.certifications.length > 0 &&
    resumeData.certifications.some(c => c?.title?.trim()))
  const hasInterests = !!(resumeData?.interests && resumeData.interests.length > 0 &&
    resumeData.interests.some(i => i?.name?.trim()))
  const hasPublications = !!(resumeData?.publications && resumeData.publications.length > 0 &&
    resumeData.publications.some(p => p?.title?.trim()))
  const hasReferences = !!(resumeData?.references && resumeData.references.length > 0 &&
    resumeData.references.some(r => r?.name?.trim()))
  const hasVolunteer = !!(resumeData?.volunteer && resumeData.volunteer.length > 0 &&
    resumeData.volunteer.some(v => v?.organization?.trim()))

  return {
    contact: hasContact,
    summary: hasSummary,
    experience: hasExperience,
    education: hasEducation,
    skills: hasSkills,
    languages: hasLanguages,
    projects: hasProjects,
    awards: hasAwards,
    certifications: hasCertifications,
    interests: hasInterests,
    publications: hasPublications,
    references: hasReferences,
    volunteer: hasVolunteer,
  }
}

export function calculateCompletion(resumeData: ResumeData): number {
  const status = getSectionStatus(resumeData)
  const allSections = ['contact', 'summary', 'experience', 'education', 'skills', 'languages', 'projects', 'awards', 'certifications', 'interests', 'publications', 'references', 'volunteer']
  const completed = allSections.filter(s => status[s]).length
  return Math.round((completed / allSections.length) * 100)
}
