import type { ResumeData } from '../types/resume'
import { STOPWORDS, FR_STOPWORDS, HISTORY_KEY, MAX_HISTORY } from './atsConstants'

export function toDomId(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

export function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u00FF-]/g, ' ') // support accented letters (French)
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

// Heuristic Language Detector
export function detectLanguage(text: string): 'en' | 'fr' {
  const words = getWords(text)
  let enCount = 0
  let frCount = 0

  words.forEach(w => {
    if (STOPWORDS.has(w)) enCount++
    if (FR_STOPWORDS.has(w)) frCount++
  })

  // Return French if French stopword density is higher, default to English
  return frCount > enCount ? 'fr' : 'en'
}

// Date parsing helpers supporting both English and French months
export function detectDateFormat(dateStr: string, lang: 'en' | 'fr'): 'MM/YYYY' | 'Month YYYY' | 'Invalid' {
  const clean = dateStr.trim()
  if (/^present|current|actuel|aujourd'hui$/i.test(clean)) {
    return 'MM/YYYY'
  }

  // MM/YYYY or MM/AAAA: matches 01/2020 or 12/2026
  if (/^(0[1-9]|1[0-2])\/\d{4}$/.test(clean)) {
    return 'MM/YYYY'
  }

  // YYYY-MM: matches 2021-05 or 2026-12 (onboarding / HTML inputs)
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(clean)) {
    return 'MM/YYYY'
  }

  // YYYY format: matches 2020 or 2026 (graduation/projects/etc.)
  if (/^\d{4}$/.test(clean)) {
    return 'MM/YYYY'
  }

  if (lang === 'fr') {
    const frMonthRegex = /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv|févr|mar|avr|mai|juin|juil|août|sept|oct|nov|déc)\s+\d{4}$/i
    if (frMonthRegex.test(clean)) {
      return 'Month YYYY'
    }
  } else {
    const enMonthRegex = /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}$/i
    if (enMonthRegex.test(clean)) {
      return 'Month YYYY'
    }
  }

  return 'Invalid'
}

let _resumeTextCache: string | null = null

export function clearResumeTextCache(): void {
  _resumeTextCache = null
}

export function extractResumeText(resume: ResumeData): string
export function extractResumeText(resume: ResumeData, options: { excludeContact?: boolean; asWordCount: true }): number
export function extractResumeText(resume: ResumeData, options?: { excludeContact?: boolean; asWordCount?: boolean }): string | number {
  if (_resumeTextCache !== null && !options?.excludeContact && !options?.asWordCount) {
    return _resumeTextCache
  }
  const excludeContact = options?.excludeContact ?? false
  const asWordCount = options?.asWordCount ?? false
  let text = ''
  if (!excludeContact && resume.contact) {
    text += ` ${resume.contact.fullName} ${resume.contact.email} ${resume.contact.phone} ${resume.contact.linkedin} ${resume.contact.location} ${resume.contact.website || ''}`
  }
  text += ` ${resume.summary || ''}`
  resume.experience.forEach(exp => {
    text += ` ${exp.jobTitle} ${exp.company} ${exp.location} ${exp.bullets.join(' ')}`
  })
  resume.education.forEach(edu => {
    text += ` ${edu.degree} ${edu.school} ${edu.location}`
  })
  text += ` ${resume.skills.join(' ')}`
  if (resume.languages) resume.languages.forEach(l => { text += ` ${l.name}` })
  if (resume.projects) resume.projects.forEach(p => { text += ` ${p.name} ${p.description} ${p.technologies.join(' ')}` })
  if (resume.certifications) resume.certifications.forEach(c => { text += ` ${c.title} ${c.issuer}` })
  if (resume.awards) resume.awards.forEach(a => { text += ` ${a.title}` })
  if (!excludeContact && !asWordCount) {
    _resumeTextCache = text
  }
  return asWordCount ? text.split(/\s+/).filter(w => w.length > 0).length : text
}

/** Count substantive content words (excludes contact info). */
export function countContentWords(resume: ResumeData): number {
  return extractResumeText(resume, { excludeContact: true, asWordCount: true }) as number
}

/**
 * Count total meaningful bullet points across all experience entries.
 * Only counts bullets with at least 15 characters (excludes stubs like "test" or "job 1").
 */
export function countMeaningfulBullets(resume: ResumeData): number {
  let count = 0
  resume.experience.forEach(exp => {
    exp.bullets.forEach(b => {
      if (b.trim().length >= 15) count++
    })
  })
  return count
}

export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  const vowels = word.match(/[aeiouy]+/g)
  return vowels ? Math.max(1, vowels.length) : 1
}

export function hashContent(data: unknown): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (hash >>> 0).toString(36)
}

export function buildSectionHashes(resume: ResumeData): Record<string, string> {
  return {
    contact: hashContent(resume.contact || ''),
    summary: hashContent(resume.summary || ''),
    experience: hashContent(resume.experience),
    education: hashContent(resume.education),
    skills: hashContent(resume.skills),
    projects: hashContent(resume.projects || []),
    certifications: hashContent(resume.certifications || []),
    languages: hashContent(resume.languages || []),
  }
}

export function loadTimeline(): { date: number; score: number; label: string }[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveTimelineEntry(score: number, label: string): void {
  try {
    const timeline = loadTimeline()
    timeline.push({ date: Date.now(), score, label })
    if (timeline.length > MAX_HISTORY) timeline.shift()
    localStorage.setItem(HISTORY_KEY, JSON.stringify(timeline))
  } catch {
    // localStorage full or unavailable — silently degrade
  }
}
