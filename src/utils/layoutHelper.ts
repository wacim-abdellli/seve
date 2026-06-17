import type { ResumeData } from '../types/resume'

export const estimateTextHeight = (text: string | undefined, charsPerLine: number = 80): number => {
  if (!text || !text.trim()) return 0
  const lines = Math.ceil(text.length / charsPerLine)
  return lines * 18 + 12 // 18px line height + 12px padding/margin
}

export const getSectionHeights = (resumeData: ResumeData): Record<string, number> => {
  return {
    contact: 80,
    summary: estimateTextHeight(resumeData.summary, 80),
    experience: (resumeData.experience || []).reduce((h, e) => h + 60 + (e.bullets || []).filter(b => b.trim() !== '').length * 28, 0),
    education: (resumeData.education || []).length * 64,
    skills: 48,
    projects: (resumeData.projects?.length ?? 0) * 80,
    awards: (resumeData.awards?.length ?? 0) * 56,
    certifications: (resumeData.certifications?.length ?? 0) * 56,
    volunteer: (resumeData.volunteer?.length ?? 0) * 72,
    languages: 36,
    publications: (resumeData.publications?.length ?? 0) * 56,
    references: (resumeData.references?.length ?? 0) * 72,
    interests: 36,
  }
}

export function getPageBreakSections(
  resumeData: ResumeData,
  sectionOrder: string[],
  leftSectionKeys?: string[]
): {
  page1Sections: string[];
  page2Sections: string[];
} {
  const sectionHeights = getSectionHeights(resumeData)
  const USABLE_PER_PAGE = 1026  // A4 minus margins

  const page1Sections: string[] = []
  const page2Sections: string[] = []

  // Helper to check if a section actually has content
  const hasContent = (key: string): boolean => {
    if (key === 'summary') return !!(resumeData.summary && resumeData.summary.trim() !== '')
    if (key === 'skills') return !!(resumeData.skills && resumeData.skills.length > 0)
    const val = (resumeData as unknown as Record<string, unknown>)[key]
    return Array.isArray(val) && val.length > 0
  }

  // Filter sectionOrder to only include sections with content
  const activeSections = sectionOrder.filter(hasContent)

  if (leftSectionKeys && leftSectionKeys.length > 0) {
    // Two-column layout
    // Left column: starts with contact info (80px)
    let leftRunning = 80
    const leftOrdered = activeSections.filter(k => leftSectionKeys.includes(k))
    for (const secId of leftOrdered) {
      const h = sectionHeights[secId] ?? 0
      if (leftRunning + h <= USABLE_PER_PAGE) {
        page1Sections.push(secId)
        leftRunning += h
      } else {
        page2Sections.push(secId)
      }
    }

    // Right column: no contact header, starts with 0
    let rightRunning = 0
    const rightOrdered = activeSections.filter(k => !leftSectionKeys.includes(k))
    for (const secId of rightOrdered) {
      const h = sectionHeights[secId] ?? 0
      if (rightRunning + h <= USABLE_PER_PAGE) {
        page1Sections.push(secId)
        rightRunning += h
      } else {
        page2Sections.push(secId)
      }
    }
  } else {
    // Single-column layout: starts with contact (80px)
    let runningHeight = 80
    for (const secId of activeSections) {
      const h = sectionHeights[secId] ?? 0
      if (runningHeight + h <= USABLE_PER_PAGE) {
        page1Sections.push(secId)
        runningHeight += h
      } else {
        page2Sections.push(secId)
      }
    }
  }

  return { page1Sections, page2Sections }
}
