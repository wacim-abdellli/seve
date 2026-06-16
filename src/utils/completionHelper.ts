import type { ResumeData } from '../types/resume'

export function getSectionStatus(resumeData: ResumeData): Record<string, boolean> {
  const hasContact = !!(
    resumeData.contact.fullName?.trim() &&
    resumeData.contact.email?.trim() &&
    resumeData.contact.phone?.trim() &&
    resumeData.contact.linkedin?.trim() &&
    resumeData.contact.location?.trim()
  )
  const hasSummary = !!resumeData.summary?.trim()
  const hasExperience =
    resumeData.experience.length > 0 &&
    !!resumeData.experience.some(e => e.jobTitle?.trim() && e.company?.trim()) &&
    (resumeData.experience[0].bullets?.length ?? 0) >= 2
  const hasEducation = resumeData.education.length > 0 &&
    !!resumeData.education.some(e => e.school?.trim() || e.degree?.trim())
  const hasSkills = (resumeData.skills?.length ?? 0) >= 3
  const hasLanguages = !!(resumeData.languages && resumeData.languages.length > 0 &&
    resumeData.languages.some(l => l.name?.trim()))
  const hasProjects = !!(resumeData.projects && resumeData.projects.length > 0 &&
    resumeData.projects.some(p => p.name?.trim()))
  const hasAwards = !!(resumeData.awards && resumeData.awards.length > 0 &&
    resumeData.awards.some(a => a.title?.trim()))
  const hasCertifications = !!(resumeData.certifications && resumeData.certifications.length > 0 &&
    resumeData.certifications.some(c => c.title?.trim()))
  const hasInterests = !!(resumeData.interests && resumeData.interests.length > 0 &&
    resumeData.interests.some(i => i.name?.trim()))
  const hasPublications = !!(resumeData.publications && resumeData.publications.length > 0 &&
    resumeData.publications.some(p => p.title?.trim()))
  const hasReferences = !!(resumeData.references && resumeData.references.length > 0 &&
    resumeData.references.some(r => r.name?.trim()))
  const hasVolunteer = !!(resumeData.volunteer && resumeData.volunteer.length > 0 &&
    resumeData.volunteer.some(v => v.organization?.trim()))

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
  let score = 0
  if (status.contact) score += 20
  if (status.summary) score += 15
  if (status.experience) score += 25
  if (status.education) score += 15
  if (status.skills) score += 15
  if (status.languages) score += 5
  if (status.projects) score += 5
  if (status.awards) score += 2
  if (status.certifications) score += 2
  if (status.interests) score += 1
  if (status.publications) score += 2
  if (status.references) score += 1
  if (status.volunteer) score += 2
  
  // Cap at 100%
  return Math.min(100, score)
}
