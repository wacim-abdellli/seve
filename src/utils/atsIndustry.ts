import type { IndustryProfile, AtsCategoryScore, ResumeData } from '../types/resume'

export const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  tech: {
    id: 'tech',
    name: 'Tech / Engineering',
    expectedSections: ['contact', 'summary', 'skills', 'experience', 'education', 'projects'],
    preferredOrder: ['contact', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    synonymOverrides: {
      javascript: ['js', 'ecmascript', 'es6', 'es2015'],
      python: ['python', 'py', 'python3'],
      typescript: ['ts', 'typescript'],
      react: ['reactjs', 'react.js', 'react js'],
    },
    lengthExpectation: 'standard',
    verbPreference: 'technical',
    weightAdjustments: { keywords: 0.30, quantifiedResults: 0.08 },
  },
  finance: {
    id: 'finance',
    name: 'Finance / Banking',
    expectedSections: ['contact', 'summary', 'experience', 'education', 'certifications'],
    preferredOrder: ['contact', 'summary', 'experience', 'education', 'certifications', 'skills'],
    synonymOverrides: {
      analysis: ['analytics', 'financial analysis', 'modeling'],
      excel: ['spreadsheet', 'vba', 'pivot'],
    },
    lengthExpectation: 'short',
    verbPreference: 'leadership',
    weightAdjustments: { quantifiedResults: 0.20, actionVerbs: 0.15, keywords: 0.15 },
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing / Creative',
    expectedSections: ['contact', 'summary', 'experience', 'skills', 'projects'],
    preferredOrder: ['contact', 'summary', 'experience', 'skills', 'projects', 'education'],
    synonymOverrides: {
      content: ['copywriting', 'blog', 'editorial'],
      seo: ['search engine optimization', 'sem'],
    },
    lengthExpectation: 'standard',
    verbPreference: 'creative',
    weightAdjustments: { keywords: 0.20, readability: 0.10 },
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare / Clinical',
    expectedSections: ['contact', 'summary', 'experience', 'education', 'certifications', 'licenses'],
    preferredOrder: ['contact', 'summary', 'certifications', 'experience', 'education', 'skills'],
    synonymOverrides: {},
    lengthExpectation: 'long',
    verbPreference: 'leadership',
    weightAdjustments: { completeness: 0.20, contactInfo: 0.10 },
  },
  executive: {
    id: 'executive',
    name: 'Executive / Leadership',
    expectedSections: ['contact', 'summary', 'experience', 'education', 'skills', 'certifications'],
    preferredOrder: ['contact', 'summary', 'experience', 'education', 'certifications', 'skills'],
    synonymOverrides: {
      leadership: ['executive', 'c-level', 'director', 'vp', 'chief'],
      strategy: ['strategic planning', 'vision', 'transformation'],
    },
    lengthExpectation: 'standard',
    verbPreference: 'leadership',
    weightAdjustments: { actionVerbs: 0.15, bulletQuality: 0.10, keywords: 0.15 },
  },
  entryLevel: {
    id: 'entryLevel',
    name: 'Entry Level / Graduate',
    expectedSections: ['contact', 'education', 'skills', 'experience', 'projects'],
    preferredOrder: ['contact', 'summary', 'education', 'skills', 'experience', 'projects'],
    synonymOverrides: {},
    lengthExpectation: 'short',
    verbPreference: 'technical',
    weightAdjustments: { completeness: 0.20, keywords: 0.15, quantifiedResults: 0.05 },
  },
}

export function detectIndustry(jd: string, resumeData?: ResumeData): string {
  const lower = jd.toLowerCase()
  const scores: { id: string; count: number }[] = Object.entries(INDUSTRY_PROFILES).map(([id, profile]) => {
    const keywords = Object.keys(profile.synonymOverrides).flat()
    const matched = keywords.filter(k => lower.includes(k)).length
    return { id, count: matched }
  })

  scores.sort((a, b) => b.count - a.count)
  const top = scores[0]
  if (top && top.count > 0) return top.id

  if (resumeData) {
    if (resumeData.projects && resumeData.projects.length > 0) return 'tech'
    if (resumeData.certifications && resumeData.certifications.length > 0) return 'healthcare'
  }

  return 'general'
}

export function applyProfileAdjustments(
  categories: AtsCategoryScore[],
  profile: IndustryProfile
): AtsCategoryScore[] {
  return categories.map(cat => {
    const adj = profile.weightAdjustments[cat.key]
    return {
      ...cat,
      weight: adj !== undefined ? adj : cat.weight,
    }
  })
}
