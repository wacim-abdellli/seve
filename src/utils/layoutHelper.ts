import type { ResumeData } from '../types/resume'

export const estimateTextHeight = (text: string | undefined, charsPerLine: number = 80, fontSize: number = 10): number => {
  if (!text || !text.trim()) return 0
  const lines = Math.ceil(text.length / charsPerLine)
  const scale = fontSize / 10
  return lines * (18 * scale) + (12 * scale)
}

export const getSectionHeights = (resumeData?: ResumeData, fontSize: number = 10): Record<string, number> => {
  const s = fontSize / 10
  if (!resumeData) return {}
  return {
    contact: 80 * s,
    summary: estimateTextHeight(resumeData.summary, 90, fontSize) + (30 * s),
    experience: (resumeData.experience || []).reduce((h, e) => h + (45 * s) + (e?.bullets || []).filter(b => b && b.trim() !== '').reduce((bh, b) => bh + estimateTextHeight(b, 90, fontSize), 0), (40 * s)),
    education: (resumeData.education || []).reduce((h, e) => h + (50 * s) + (e?.gpa ? (18 * s) : 0), (40 * s)),
    skills: estimateTextHeight(resumeData.skills?.join(' · '), 90, fontSize) + (40 * s),
    projects: (resumeData.projects || []).reduce((h, p) => h + (45 * s) + estimateTextHeight(p?.description, 90, fontSize) + estimateTextHeight(p?.technologies?.join(' · '), 90, fontSize), (40 * s)),
    awards: (resumeData.awards || []).reduce((h, a) => h + (40 * s) + estimateTextHeight(a?.description, 90, fontSize), (40 * s)),
    certifications: (resumeData.certifications || []).reduce((h, c) => h + (40 * s) + estimateTextHeight(c?.description, 90, fontSize), (40 * s)),
    volunteer: (resumeData.volunteer || []).reduce((h, v) => h + (45 * s) + estimateTextHeight(v?.description, 90, fontSize), (40 * s)),
    languages: estimateTextHeight((resumeData.languages || []).map(l => l?.name).filter(Boolean).join(' · '), 90, fontSize) + (40 * s),
    publications: (resumeData.publications || []).reduce((h, p) => h + (40 * s) + estimateTextHeight(p?.description, 90, fontSize), (40 * s)),
    references: (resumeData.references || []).length * (60 * s) + (40 * s),
    interests: estimateTextHeight((resumeData.interests || []).map(i => i?.name).filter(Boolean).join(' · '), 90, fontSize) + (40 * s),
  }
}

const USABLE_PER_PAGE = 1026

export function estimatePageCount(resumeData?: ResumeData, sectionOrder: string[] = [], fontSize: number = 10): number {
  if (!resumeData) return 1
  const hasContent = (key: string): boolean => {
    if (key === 'summary') return !!(resumeData.summary && resumeData.summary.trim() !== '')
    if (key === 'skills') return !!(resumeData.skills && resumeData.skills.length > 0)
    const val = (resumeData as unknown as Record<string, unknown>)[key]
    return Array.isArray(val) && val.length > 0
  }

  const activeSections = sectionOrder.filter(hasContent)
  const heights = getSectionHeights(resumeData, fontSize)
  const totalHeight = activeSections.reduce((sum, sec) => sum + (heights[sec] || 60), 0)
  return Math.ceil(totalHeight / USABLE_PER_PAGE)
}

export function getPageBreakSections(
  resumeData?: ResumeData,
  sectionOrder: string[] = [],
): {
  page1Sections: string[];
  page2Sections: string[];
} {
  if (!resumeData) return { page1Sections: [], page2Sections: [] }
  const hasContent = (key: string): boolean => {
    if (key === 'summary') return !!(resumeData.summary && resumeData.summary.trim() !== '')
    if (key === 'skills') return !!(resumeData.skills && resumeData.skills.length > 0)
    const val = (resumeData as unknown as Record<string, unknown>)[key]
    return Array.isArray(val) && val.length > 0
  }

  const activeSections = sectionOrder.filter(hasContent)

  // ALL content goes in a single page container.
  // CSS break-inside:avoid + html2pdf handle pagination.
  return { page1Sections: activeSections, page2Sections: [] }
}
