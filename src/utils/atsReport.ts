import type { ResumeData, AtsScore, AtsReport, AtsCategoryScore } from '../types/resume'
import { classifyDomain, computeDomainPenalty } from './roleClassifier'
import { INDUSTRY_PROFILES, detectIndustry } from './atsIndustry'
import {
  extractResumeText,
  countContentWords,
  detectLanguage,
  clearResumeTextCache,
  hashContent,
  buildSectionHashes,
  loadTimeline,
  countSyllables,
  getActualSkillsCount
} from './atsUtils'
import {
  scoreCompleteness,
  scoreKeywords,
  scoreSemantic,
  scoreFormatting,
  scoreContactInfo,
  scoreDateConsistency,
  scoreLength,
  scoreReadability,
  scoreContentDepth,
  scoreAtsParseability,
  calculateLocalSemanticScore
} from './atsScoring'
import {
  scoreBulletQuality,
  scoreActionVerbs,
  scoreQuantifiedResults
} from './atsBullets'
import { calculateSkillsMatrix } from './atsMatrix'
import {
  WEAK_TO_STRONG_EN,
  WEAK_TO_STRONG_FR
} from './atsConstants'

export function evaluateResume(resume: ResumeData, jobDescription: string, fontSize: number = 10): AtsScore & { language: 'en' | 'fr'; reportV2: AtsReport } {
  clearResumeTextCache()
  const report = generateAtsReportV2(resume, jobDescription, null, fontSize)
  
  // Map categories back to the V1 "sections" format
  const sections = {
    sectionCompleteness: report.categories.find(c => c.key === 'completeness')?.score || 0,
    keywordMatch: report.categories.find(c => c.key === 'keywords')?.score || 0,
    formattingSafety: report.categories.find(c => c.key === 'formatting')?.score || 0,
    actionVerbs: report.categories.find(c => c.key === 'actionVerbs')?.score || 0,
    quantifiedResults: report.categories.find(c => c.key === 'quantifiedResults')?.score || 0,
    contactInfo: report.categories.find(c => c.key === 'contactInfo')?.score || 0,
    dateConsistency: report.categories.find(c => c.key === 'dateConsistency')?.score || 0,
    lengthAppropriateness: report.categories.find(c => c.key === 'length')?.score || 0,
  }

  // Combine critical, warnings, and suggestions into failing issues for V1 compatibility
  const failing = [
    ...report.critical,
    ...report.warnings,
    ...report.suggestions
  ].map(issue => ({
    issue: issue.issue,
    fix: issue.fix,
    section: issue.section,
    type: issue.type,
    details: issue.details
  }))

  return {
    total: report.total,
    grade: `${report.gradeLabel} (${report.grade})`,
    sections,
    passing: report.passing,
    failing,
    language: report.language,
    reportV2: report
  }
}

export function autoFix(resume: ResumeData): ResumeData {
  const raw = JSON.parse(JSON.stringify(resume)) as Record<string, unknown>
  const fixed: ResumeData = {
    contact: {
      fullName: (raw.contact as any)?.fullName ?? '',
      email: (raw.contact as any)?.email ?? '',
      phone: (raw.contact as any)?.phone ?? '',
      linkedin: (raw.contact as any)?.linkedin ?? '',
      location: (raw.contact as any)?.location ?? '',
    },
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    awards: Array.isArray(raw.awards) ? raw.awards : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    publications: Array.isArray(raw.publications) ? raw.publications : [],
    references: Array.isArray(raw.references) ? raw.references : [],
    volunteer: Array.isArray(raw.volunteer) ? raw.volunteer : [],
  }
  
  // Compile content to detect language
  let testText = resume.summary
  resume.experience.forEach(exp => {
    testText += ` ${exp.bullets.join(' ')}`
  })
  const lang = detectLanguage(testText)

  const removePronounsAndEnhance = (text: string): string => {
    if (!text) return ''
    let cleaned = text.trim()
    
    if (lang === 'en') {
      // "I led..." -> "Led..."
      cleaned = cleaned.replace(/^(?:i|we)\s+([a-z]+)/i, (_, verb) => {
        return verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase()
      })
      cleaned = cleaned.replace(/^(?:i|we)\s+(?:am|was|were)\s+responsible\s+for/i, 'Managed')
      cleaned = cleaned.replace(/^responsible\s+for/i, 'Led and managed')
      cleaned = cleaned.replace(/^(?:i|we)\s+(?:am|was|were)\s+in\s+charge\s+of/i, 'Directed')
      cleaned = cleaned.replace(/^in\s+charge\s+of/i, 'Directed')
      
      cleaned = cleaned.replace(/\bmy\s+team\b/gi, 'the team')
      cleaned = cleaned.replace(/\bour\s+team\b/gi, 'the team')
      cleaned = cleaned.replace(/\bmy\s+role\b/gi, 'the role')
      cleaned = cleaned.replace(/\bour\s+role\b/gi, 'the role')
      cleaned = cleaned.replace(/\bmy\s+responsibility\b/gi, 'responsibility')
      cleaned = cleaned.replace(/\bour\s+responsibility\b/gi, 'responsibility')
      cleaned = cleaned.replace(/\bmy\s+project\b/gi, 'the project')
      cleaned = cleaned.replace(/\bour\s+project\b/gi, 'the project')
      cleaned = cleaned.replace(/\bmy\s+clients?\b/gi, 'clients')
      cleaned = cleaned.replace(/\bour\s+clients?\b/gi, 'clients')
      
      cleaned = cleaned.replace(/\b(i|me|we|us)\b/gi, '')
    } else {
      // French
      cleaned = cleaned.replace(/^j'ai\s+([a-z\u00C0-\u00FF]+)/i, (_, verb) => {
        return verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase()
      })
      cleaned = cleaned.replace(/^nous\s+avons\s+([a-z\u00C0-\u00FF]+)/i, (_, verb) => {
        return verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase()
      })
      cleaned = cleaned.replace(/^je\s+gérais/i, 'Gestion de')
      cleaned = cleaned.replace(/^j'étais\s+responsable\s+de/i, 'Responsable de')
      cleaned = cleaned.replace(/^responsable\s+de/i, 'Pilotage de')
      cleaned = cleaned.replace(/^je\s+travaillais\s+sur/i, 'Développement de')
      
      cleaned = cleaned.replace(/\bmon\s+équipe\b/gi, "l'équipe")
      cleaned = cleaned.replace(/\bnotre\s+équipe\b/gi, "l'équipe")
      cleaned = cleaned.replace(/\bmon\s+projet\b/gi, 'le projet')
      cleaned = cleaned.replace(/\bnotre\s+projet\b/gi, 'le projet')
      cleaned = cleaned.replace(/\bmes\s+clients?\b/gi, 'les clients')
      cleaned = cleaned.replace(/\bnos\s+clients?\b/gi, 'les clients')
      
      cleaned = cleaned.replace(/\b(je|moi|nous|on)\b/gi, '')
    }

    cleaned = cleaned
      .replace(/\s+/g, ' ')
      .replace(/\s+,\s*/g, ', ')
      .replace(/,\s*,/g, ',')
      .replace(/^,\s*/, '')
      .trim()

    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    }
    return cleaned
  }

  const replaceWeakVerbs = (bullet: string): string => {
    const cleanBullet = bullet.trim()
    if (!cleanBullet) return ''
    const parts = cleanBullet.split(/\s+/)
    const firstWord = parts[0]?.toLowerCase()
    if (!firstWord) return cleanBullet

    const map = lang === 'en' ? WEAK_TO_STRONG_EN : WEAK_TO_STRONG_FR
    if (map[firstWord]) {
      parts[0] = map[firstWord]
      return parts.join(' ')
    }

    if (parts.length > 1) {
      const firstTwo = `${parts[0].toLowerCase()} ${parts[1].toLowerCase()}`
      if (map[firstTwo]) {
        parts.shift()
        parts[0] = map[firstTwo]
        return parts.join(' ')
      }
    }
    return cleanBullet
  }

  const injectMetricPlaceholder = (bullet: string): string => {
    const hasMetric = /\b\d+\b|%|\$|million|billion|thousand|k\b/i.test(bullet) || (lang === 'fr' && /millions|milliards|k\b/i.test(bullet))
    if (hasMetric) return bullet

    let placeholder
    const lower = bullet.toLowerCase()
    if (lang === 'en') {
      if (lower.includes('team') || lower.includes('people') || lower.includes('developer') || lower.includes('engineer')) {
        placeholder = ' [managing a team of 5+ members]'
      } else if (lower.includes('cost') || lower.includes('budget') || lower.includes('save') || lower.includes('saving')) {
        placeholder = ' [reducing costs by 15%]'
      } else if (lower.includes('time') || lower.includes('speed') || lower.includes('fast') || lower.includes('perform') || lower.includes('efficien')) {
        placeholder = ' [improving performance by 20%]'
      } else if (lower.includes('revenue') || lower.includes('sale') || lower.includes('growth') || lower.includes('custom') || lower.includes('user')) {
        placeholder = ' [increasing user engagement by 25%]'
      } else {
        placeholder = ' [achieving 15% efficiency gains]'
      }
    } else {
      if (lower.includes('équipe') || lower.includes('membres') || lower.includes('développeur') || lower.includes('ingénieur')) {
        placeholder = ' [encadrant une équipe de 5+ personnes]'
      } else if (lower.includes('coût') || lower.includes('budget') || lower.includes('écon')) {
        placeholder = ' [réduisant les coûts de 15%]'
      } else if (lower.includes('temps') || lower.includes('vitesse') || lower.includes('rapide') || lower.includes('efficac') || lower.includes('perf')) {
        placeholder = ' [améliorant la performance de 20%]'
      } else if (lower.includes('revenu') || lower.includes('vente') || lower.includes('croissance') || lower.includes('client') || lower.includes('utilisat')) {
        placeholder = ' [augmentant le nombre d\'utilisateurs de 25%]'
      } else {
        placeholder = ' [générant un gain d\'efficacité de 15%]'
      }
    }

    return bullet + placeholder
  }

  const standardizeDate = (date: string): string => {
    if (!date) return ''
    const clean = date.trim().toLowerCase()
    if (/^(present|current|actuel|aujourd'hui|présent)$/i.test(clean)) {
      return lang === 'fr' ? 'Présent' : 'Present'
    }

    const months: Record<string, string> = {
      january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
      july:'07', august:'08', september:'09', october:'10', november:'11', december:'12',
      jan:'01', feb:'02', mar:'03', apr:'04', jun:'06', jul:'07', aug:'08',
      sep:'09', oct:'10', nov:'11', dec:'12',
      janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06',
      juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12',
      janv: '01', févr: '02', avr: '04', juil: '07', aoû: '08', sept: '09', déc: '12'
    }

    const wordYearMatch = clean.match(/([a-z\u00C0-\u00FF]+)\s*,?\s*(\d{4})/i)
    if (wordYearMatch && wordYearMatch[1] && wordYearMatch[2]) {
      const m = months[wordYearMatch[1]]
      if (m) return `${m}/${wordYearMatch[2]}`
    }

    const numYearMatch = clean.match(/(\d{1,2})[/\-\s](\d{4})/)
    if (numYearMatch) {
      const month = numYearMatch[1].padStart(2, '0')
      return `${month}/${numYearMatch[2]}`
    }

    const justYear = clean.match(/^(\d{4})$/)
    if (justYear) {
      return `01/${justYear[1]}`
    }

    return date
  }

  const cleanSpecialChars = (text: string): string => {
    if (!text) return ''
    return text.replace(/[★✓►◆•‣⁃■●▪▲▼◇○◎●★☆]/g, '').trim()
  }

  if (fixed.contact) {
    fixed.contact.fullName = cleanSpecialChars(fixed.contact.fullName)
    fixed.contact.email = cleanSpecialChars(fixed.contact.email)
    fixed.contact.phone = cleanSpecialChars(fixed.contact.phone)
    fixed.contact.linkedin = cleanSpecialChars(fixed.contact.linkedin)
    fixed.contact.location = cleanSpecialChars(fixed.contact.location)
    if (fixed.contact.website) {
      fixed.contact.website = cleanSpecialChars(fixed.contact.website)
    }
  }

  fixed.summary = cleanSpecialChars(removePronounsAndEnhance(fixed.summary))

  fixed.experience = fixed.experience.map(exp => ({
    ...exp,
    jobTitle: cleanSpecialChars(exp.jobTitle),
    company: cleanSpecialChars(exp.company),
    location: cleanSpecialChars(exp.location),
    startDate: standardizeDate(exp.startDate),
    endDate: standardizeDate(exp.endDate),
    bullets: exp.bullets.map(b => injectMetricPlaceholder(replaceWeakVerbs(cleanSpecialChars(removePronounsAndEnhance(b))))),
  }))

  fixed.education = fixed.education.map(edu => ({
    ...edu,
    degree: cleanSpecialChars(edu.degree),
    school: cleanSpecialChars(edu.school),
    location: cleanSpecialChars(edu.location),
    graduationDate: standardizeDate(edu.graduationDate),
  }))

  if (fixed.projects) {
    fixed.projects = fixed.projects.map(proj => ({
      ...proj,
      name: cleanSpecialChars(proj.name),
      description: cleanSpecialChars(removePronounsAndEnhance(proj.description)),
      technologies: proj.technologies.map(cleanSpecialChars),
    }))
  }

  if (fixed.skills) {
    fixed.skills = fixed.skills.map(cleanSpecialChars)
  }

  return fixed
}

export function calculateTotal(categories: AtsCategoryScore[]): number {
  let weighted = 0
  let totalWeight = 0
  for (const cat of categories) {
    const pct = cat.max > 0 ? cat.score / cat.max : 0
    weighted += pct * cat.weight * 100
    totalWeight += cat.weight
  }
  return Math.round(totalWeight > 0 ? weighted / totalWeight : 0)
}

export function getGrade(total: number): { grade: string; gradeLabel: string } {
  if (total >= 90) return { grade: 'A', gradeLabel: 'Excellent' }
  if (total >= 80) return { grade: 'B+', gradeLabel: 'Great' }
  if (total >= 70) return { grade: 'B', gradeLabel: 'Good' }
  if (total >= 60) return { grade: 'C+', gradeLabel: 'Fair' }
  if (total >= 50) return { grade: 'C', gradeLabel: 'Needs Work' }
  if (total >= 40) return { grade: 'D', gradeLabel: 'Poor' }
  return { grade: 'F', gradeLabel: 'Critical' }
}

export function generateAtsReport(resume: ResumeData, jd: string): AtsReport {
  const text = extractResumeText(resume)
  const lang = detectLanguage(text)

  const completeness = scoreCompleteness(resume, lang)
  const keywords = scoreKeywords(resume, jd, lang)
  const semantic = scoreSemantic(resume, jd, lang)
  const formatting = scoreFormatting(resume, lang)
  const actionVerbs = scoreActionVerbs(resume, lang)
  const quantifiedResults = scoreQuantifiedResults(resume, lang)
  const contactInfo = scoreContactInfo(resume, lang)
  const dateConsistency = scoreDateConsistency(resume, lang)
  const length = scoreLength(resume, lang, 10)
  const bulletQuality = scoreBulletQuality(resume, lang)
  const readability = scoreReadability(resume, lang)
  const contentDepth = scoreContentDepth(resume, lang)

  const categories = [
    completeness, keywords, semantic, formatting, actionVerbs,
    quantifiedResults, contactInfo, dateConsistency, length,
    bulletQuality, readability, contentDepth,
  ]

  let total = calculateTotal(categories)
  const resumeClassification = classifyDomain(text)
  const jdClassification = classifyDomain(jd)
  const domainPenalty = computeDomainPenalty(resumeClassification.domain, jdClassification.domain)
  total = Math.max(0, total + domainPenalty)
  if (domainPenalty <= -35) {
    total = Math.min(total, 55)
  }

  // Global minimum-content gate
  const globalContentWords = countContentWords(resume)
  if (globalContentWords < 30) {
    total = Math.min(total, 10)
  } else if (globalContentWords < 80) {
    total = Math.min(total, 25)
  } else if (globalContentWords < 150) {
    total = Math.min(total, 40)
  }

  const { grade, gradeLabel } = getGrade(total)

  const allIssues = categories.flatMap(c => c.issues)
  const critical = allIssues.filter(i => i.type === 'critical')
  const warnings = allIssues.filter(i => i.type === 'warning')
  const suggestions = allIssues.filter(i => i.type === 'suggestion' || i.type === 'info')

  const wordCount = text.split(/\s+/).filter(Boolean).length
  const sectionCount = [
    resume.contact?.fullName, resume.summary,
    ...(resume.experience.length ? ['x'] : []),
    ...(resume.education.length ? ['x'] : []),
    ...(getActualSkillsCount(resume.skills) > 0 ? ['x'] : []),
    ...(resume.languages?.length ? ['x'] : []),
    ...(resume.projects?.length ? ['x'] : []),
    ...(resume.certifications?.length ? ['x'] : []),
  ].filter(Boolean).length

  const estimatedReadTime = Math.max(10, Math.round(wordCount / 200))

  // ATS Parseability
  let atsParseability = 100
  const specialChars = text.match(/[★✓►◆■●▪▲▼◆◇○◎●★☆™®©]/g)
  if (specialChars) atsParseability -= specialChars.length * 3
  if (text.length === 0) atsParseability = 0
  atsParseability = Math.max(0, Math.min(100, atsParseability))

  // Reading level
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1
  const words = text.split(/\s+/).filter(Boolean)
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0)
  const readingLevel = Math.round(
    0.39 * (wordCount / Math.max(1, sentences)) +
    11.8 * (syllables / Math.max(1, wordCount)) -
    15.59
  )

  const timeline: { date: number; score: number; label: string }[] = []
  try {
    const saved = localStorage.getItem('ats-score-history')
    if (saved) timeline.push(...JSON.parse(saved))
  } catch { /* ignore */ }

  return {
    total,
    previousScore: undefined,
    trend: 'stable',
    grade,
    gradeLabel,
    categories,
    critical,
    warnings,
    suggestions,
    passing: [],
    skillsMatrix: calculateSkillsMatrix(resume, jd),
    language: lang,
    semanticScore: 0,
    wordCount,
    sectionCount,
    estimatedReadTime,
    atsParseability,
    readingLevel: Math.max(1, Math.min(20, readingLevel)),
    timeline,
    engineVersion: 1,
    resumeDomain: resumeClassification.domain,
    jdDomain: jdClassification.domain,
    breakdown: categories.map(c => ({ key: c.key, label: c.label, score: c.score, max: c.max })),
  }
}

export function incrementalScore(
  resumeData: ResumeData,
  jd: string,
  cache: ScoreCache | null
): { report: AtsReport; newCache: ScoreCache; changed: string[] } {
  // Use interfaces/structures from sub-modules
  const resumeHash = hashContent(resumeData)
  const jdHash = hashContent(jd)

  if (cache && cache.resumeHash === resumeHash && cache.jdHash === jdHash) {
    return { report: cache.report, newCache: cache, changed: [] }
  }

  const newSectionHashes = buildSectionHashes(resumeData)

  const changed: string[] = []
  if (cache) {
    for (const [key, hash] of Object.entries(newSectionHashes)) {
      if (cache.sectionHashes[key] !== hash) {
        changed.push(key)
      }
    }
  }

  const fullReport = generateAtsReport(resumeData, jd)

  return {
    report: fullReport,
    newCache: {
      version: 1,
      resumeHash,
      jdHash,
      sectionHashes: newSectionHashes,
      report: fullReport,
    },
    changed,
  }
}

export interface ScoreCache {
  version: number
  resumeHash: string
  jdHash: string
  sectionHashes: Record<string, string>
  report: AtsReport
}

export function generateAtsReportV2(
  resume: ResumeData,
  jd: string,
  previousReport?: AtsReport | null,
  fontSize: number = 10
): AtsReport {
  clearResumeTextCache()
  const text = extractResumeText(resume)
  const lang = detectLanguage(text)
  const industryId = detectIndustry(jd, resume)
  const profile = INDUSTRY_PROFILES[industryId]

  // Score all dimensions
  const completeness = scoreCompleteness(resume, lang)
  const keywords = scoreKeywords(resume, jd, lang)
  const semantic = scoreSemantic(resume, jd, lang)
  const formatting = scoreFormatting(resume, lang)
  const actionVerbs = scoreActionVerbs(resume, lang)
  const quantifiedResults = scoreQuantifiedResults(resume, lang)
  const contactInfo = scoreContactInfo(resume, lang)
  const dateConsistency = scoreDateConsistency(resume, lang)
  const length = scoreLength(resume, lang, fontSize)
  const bulletQuality = scoreBulletQuality(resume, lang)
  const readability = scoreReadability(resume, lang)
  const contentDepth = scoreContentDepth(resume, lang)

  let categories: AtsCategoryScore[] = [
    completeness, keywords, semantic, formatting, actionVerbs,
    quantifiedResults, contactInfo, dateConsistency, length,
    bulletQuality, readability, contentDepth,
  ]

  // Apply industry-specific weight adjustments (but don't revive zero-weight dimensions)
  if (profile) {
    categories = categories.map(cat => {
      const adj = profile.weightAdjustments[cat.key]
      if (adj !== undefined && cat.weight > 0) {
        return { ...cat, weight: adj }
      }
      return cat
    })
  }

  // Parseability
  const { score: atsParseability, issues: parseabilityIssues } = scoreAtsParseability(resume)

  // Apply minor penalties to categories for parseability issues so they directly affect the score
  parseabilityIssues.forEach(issue => {
    if (issue.id === 'parseability-unicode') {
      const idx = categories.findIndex(c => c.key === 'formatting')
      if (idx !== -1) categories[idx].score = Math.max(0, categories[idx].score - 1)
    } else if (issue.id.startsWith('parseability-section')) {
      const idx = categories.findIndex(c => c.key === 'completeness')
      if (idx !== -1) categories[idx].score = Math.max(0, categories[idx].score - 1)
    } else if (issue.id === 'parseability-contact-position') {
      const idx = categories.findIndex(c => c.key === 'contactInfo')
      if (idx !== -1) categories[idx].score = Math.max(0, categories[idx].score - 1)
    }
  })

  let total = calculateTotal(categories)
  const resumeClassification = classifyDomain(text)
  const jdClassification = classifyDomain(jd)
  const domainPenalty = computeDomainPenalty(resumeClassification.domain, jdClassification.domain)
  total = Math.max(0, total + domainPenalty)
  if (domainPenalty <= -35) {
    total = Math.min(total, 55)
  }
  // Without a job description, cap at 75 — a resume can't be fully evaluated without a target role
  if (!jd.trim() && total > 75) {
    total = 75
  }

  // ── Global minimum-content gate ──
  // A resume with barely any content cannot score well regardless of individual dimensions.
  // This prevents "perfect formatting on empty page" inflation.
  const globalContentWords = countContentWords(resume)
  if (globalContentWords < 30) {
    total = Math.min(total, 10) // basically blank
  } else if (globalContentWords < 80) {
    total = Math.min(total, 25) // barely started
  } else if (globalContentWords < 150) {
    total = Math.min(total, 40) // skeleton only
  }

  const { grade, gradeLabel } = getGrade(total)

  const allIssues = [
    ...categories.flatMap(c => c.issues),
    ...parseabilityIssues,
  ]
  const critical = allIssues.filter(i => i.type === 'critical')
  const warnings = allIssues.filter(i => i.type === 'warning')
  const suggestions = allIssues.filter(i => i.type === 'suggestion' || i.type === 'info')

  const wordCount = text.split(/\s+/).filter(Boolean).length
  const sectionCount = [
    resume.contact?.fullName, resume.summary,
    ...(resume.experience.length ? ['x'] : []),
    ...(resume.education.length ? ['x'] : []),
    ...(getActualSkillsCount(resume.skills) > 0 ? ['x'] : []),
    ...(resume.languages?.length ? ['x'] : []),
    ...(resume.projects?.length ? ['x'] : []),
    ...(resume.certifications?.length ? ['x'] : []),
  ].filter(Boolean).length

  const estimatedReadTime = Math.max(10, Math.round(wordCount / 200))

  // Reading level calculation
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1
  const words = text.split(/\s+/).filter(Boolean)
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0)
  const readingLevel = Math.round(
    0.39 * (wordCount / Math.max(1, sentences)) +
    11.8 * (syllables / Math.max(1, wordCount)) -
    15.59
  )

  // Trend
  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (previousReport) {
    if (total > previousReport.total) trend = 'up'
    else if (total < previousReport.total) trend = 'down'
  }

  const timeline = loadTimeline()
  const timestamp = Date.now()

  // Determine the "passing" items — ones that are NOT failing
  const passing: string[] = categories
    .filter(c => c.issues.length === 0)
    .map(c => c.label)

  // Compute semantic score
  const semanticScore = calculateLocalSemanticScore(text, jd)

  return {
    total,
    previousScore: previousReport?.total,
    trend,
    grade,
    gradeLabel,
    categories,
    critical,
    warnings,
    suggestions,
    passing,
    skillsMatrix: calculateSkillsMatrix(resume, jd),
    language: lang,
    semanticScore,
    wordCount,
    sectionCount,
    estimatedReadTime,
    atsParseability,
    readingLevel: Math.max(1, Math.min(20, readingLevel)),
    timeline: [...timeline, { date: timestamp, score: total, label: gradeLabel }],
    engineVersion: 2,
    resumeDomain: resumeClassification.domain,
    jdDomain: jdClassification.domain,
    breakdown: categories.map(c => ({ key: c.key, label: c.label, score: c.score, max: c.max })),
  }
}
