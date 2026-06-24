import type { ResumeData, AtsCategoryScore, AtsIssue, AtsRatingResult, SectionTier } from '../types/resume'
import { classifyDomain, computeDomainPenalty } from './roleClassifier'
import { computeKeywordOverlapRatio } from './semanticScorer'
import { estimatePageCount, getSectionHeights } from './layoutHelper'
import { tokenize, matchKeywords } from './atsKeywords'
import { evaluateSkillsQuality } from './atsMatrix'
import {
  extractResumeText,
  countContentWords,
  countMeaningfulBullets,
  detectLanguage,
  detectDateFormat,
  toDomId,
  countSyllables,
  getActualSkillsCount
} from './atsUtils'
import {
  DIMENSION_WEIGHTS,
  JD_STOPWORDS,
  EN_PRONOUNS_REGEX,
  FR_PRONOUNS_REGEX,
  USABLE_PER_PAGE
} from './atsConstants'

export function calculateKeywordOverlapScore(resumeText: string, jobDescription: string): number {
  return computeKeywordOverlapRatio(resumeText, jobDescription)
}

export function weightKeyword(keyword: string): 'high' | 'medium' | 'low' {
  const techProperNouns = /^(react|typescript|node\.?js|aws|kubernetes|docker|postgresql|redis|kafka|python|figma|salesforce|hubspot)$/i
  if (techProperNouns.test(keyword)) return 'high'
  if (keyword.length > 7) return 'medium'
  return 'low'
}

export function evaluateSectionAts(
  sectionId: string,
  resumeData?: ResumeData,
  lang?: string
): AtsRatingResult {
  if (!resumeData) {
    return { rating: 'danger', feedback: 'No resume data available.', issues: [] }
  }
  const detectedLang = lang || detectLanguage(extractResumeText(resumeData))

  switch (sectionId) {
    case 'contact': {
      const c = resumeData.contact
      if (!c || (!c.fullName?.trim() && !c.email?.trim())) {
        return { rating: 'danger', feedback: detectedLang === 'fr' ? 'Le nom complet et l\'e-mail sont requis.' : 'Full name and email are required.', issues: [] }
      }
      if (!c.phone?.trim() || !c.linkedin?.trim()) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Ajoutez votre numéro de téléphone et LinkedIn.' : 'Add phone and LinkedIn to improve reach.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Coordonnées complètes et conformes.' : 'Contact details are complete and ATS-safe.', issues: [] }
    }

    case 'summary': {
      const s = resumeData.summary?.trim()
      if (!s) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Le résumé est recommandé pour capter l\'attention.' : 'A professional summary is recommended.', issues: [] }
      }
      const langPronounRegex = detectedLang === 'fr' ? FR_PRONOUNS_REGEX : EN_PRONOUNS_REGEX
      if (langPronounRegex.test(s)) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Évitez les pronoms personnels (je, mon, nous) dans le résumé.' : 'Remove personal pronouns (I, me, my) from summary.', issues: [] }
      }
      if (s.length > 800) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Résumé trop long (max 800 caractères).' : 'Summary too long (keep under 800 chars).', issues: [] }
      }
      if (s.length < 50) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Résumé un peu court. Donnez plus de contexte.' : 'Summary is short. Write 2-3 detailed sentences.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Résumé percutant et bien structuré.' : 'Summary is pronoun-free and well-formatted.', issues: [] }
    }

    case 'experience': {
      const entries = resumeData.experience
      if (!entries || entries.length === 0) {
        return { rating: 'danger', feedback: detectedLang === 'fr' ? 'L\'expérience professionnelle est requise.' : 'Work experience history is required.', issues: [] }
      }
      const noDates = entries.filter(e => !e.startDate?.trim() || !e.endDate?.trim())
      const noBullets = entries.filter(e => !e.bullets || e.bullets.length === 0)
      if (noDates.length > 0) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Dates d\'embauche manquantes dans certaines expériences.' : 'Ensure all job entries have start and end dates.', issues: [] }
      }
      if (noBullets.length > 0) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Ajoutez des puces décrivant vos réalisations.' : 'Add bullet points starting with action verbs.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Expériences bien détaillées avec puces et dates.' : 'Experience is cleanly formatted with dates and bullets.', issues: [] }
    }

    case 'education': {
      const entries = resumeData.education
      if (!entries || entries.length === 0) {
        return { rating: 'danger', feedback: detectedLang === 'fr' ? 'La section formation est requise.' : 'Education history is essential.', issues: [] }
      }
      const incomplete = entries.filter(e => !e.degree?.trim() || !e.school?.trim())
      if (incomplete.length > 0) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Établissement ou diplôme manquant.' : 'Ensure school name and degree title are filled.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Parcours académique clair.' : 'Academic credentials listed clearly.', issues: [] }
    }

    case 'skills': {
      const actualCount = getActualSkillsCount(resumeData.skills || [])
      if (actualCount === 0) {
        return { rating: 'danger', feedback: detectedLang === 'fr' ? 'Ajoutez des compétences pour le ciblage.' : 'List skills to enable keyword indexing.', issues: [] }
      }
      const issues = evaluateSkillsQuality(resumeData)
      if (actualCount < 6) {
        return { rating: 'warning', feedback: detectedLang === 'fr' ? 'Ajoutez au moins 6 compétences.' : 'List at least 6 core technical skills.', issues }
      }
      return { rating: issues.length > 0 ? 'warning' : 'safe', feedback: detectedLang === 'fr' ? 'Compétences listées de façon optimale.' : 'Skills list covers critical keywords.', issues }
    }

    case 'projects': {
      if (!resumeData.projects || resumeData.projects.length === 0) {
        return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Aucun projet (optionnel).' : 'Optional: add projects to showcase hands-on work.', issues: [] }
      }
      const issues: AtsIssue[] = []
      const undatedProjects = resumeData.projects.filter(p => !p.startDate && !p.endDate && !p.date)
      if (undatedProjects.length > 0) {
        issues.push({
          id: 'projects-no-dates',
          type: 'warning',
          category: 'completeness',
          issue: `${undatedProjects.length} project(s) have no date — ATS parsers may skip or mislabel them.`,
          fix: 'Add a year or date range to each project: "CloudAnalytics Portal (2022 – present)"',
          section: 'projects',
          severityScore: 5,
          autoFixable: false,
        })
      }
      return { rating: issues.length > 0 ? 'warning' : 'safe', feedback: detectedLang === 'fr' ? 'Projets techniques bien présentés.' : 'Projects demonstrate practical capabilities.', issues }
    }

    case 'languages': {
      if (!resumeData.languages || resumeData.languages.length === 0) {
        return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Langues (optionnel).' : 'Optional: languages show global readiness.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Langues indiquées.' : 'Languages listed clearly.', issues: [] }
    }

    case 'awards': {
      if (!resumeData.awards || resumeData.awards.length === 0) {
        return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Distinctions (optionnel).' : 'Optional: awards show distinct achievements.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Distinctions listées.' : 'Awards listed clearly.', issues: [] }
    }

    case 'certifications': {
      if (!resumeData.certifications || resumeData.certifications.length === 0) {
        return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Certifications (optionnel).' : 'Optional: certifications validate expertise.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Certifications listées.' : 'Certifications listed clearly.', issues: [] }
    }

    case 'interests': {
      if (!resumeData.interests || resumeData.interests.length === 0) {
        return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Centres d\'intérêt (optionnel).' : 'Optional: interests add personality.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Centres d\'intérêt listés.' : 'Interests listed.', issues: [] }
    }

    case 'publications': {
      if (!resumeData.publications || resumeData.publications.length === 0) {
        return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Publications (optionnel).' : 'Optional: publications show research focus.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Publications listées.' : 'Publications listed.', issues: [] }
    }

    case 'references': {
      if (!resumeData.references || resumeData.references.length === 0) {
        return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Références (optionnel).' : 'Optional: references available.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Références listées.' : 'References listed.', issues: [] }
    }

    case 'volunteer': {
      if (!resumeData.volunteer || resumeData.volunteer.length === 0) {
        return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Bénévolat (optionnel).' : 'Optional: volunteer shows community work.', issues: [] }
      }
      return { rating: 'safe', feedback: detectedLang === 'fr' ? 'Bénévolat listé.' : 'Volunteer experience listed.', issues: [] }
    }

    default:
      return { rating: 'safe', feedback: undefined, issues: [] }
  }
}

export function scoreCompleteness(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  let score = 0
  const max = 20

  const checkPresent = (key: string, label: string, tier: SectionTier) => {
    const present = (() => {
      switch (key) {
        case 'contact': return !!(resume.contact && resume.contact.fullName?.trim())
        case 'summary': return !!(resume.summary?.trim())
        case 'experience': return !!(resume.experience?.length)
        case 'education': return !!(resume.education?.length)
        case 'skills': return !!(resume.skills?.length)
        case 'languages': return !!(resume.languages?.length)
        case 'projects': return !!(resume.projects?.length)
        case 'certifications': return !!(resume.certifications?.length)
        case 'awards': return !!(resume.awards?.length)
        case 'interests': return !!(resume.interests?.length)
        case 'publications': return !!(resume.publications?.length)
        case 'references': return !!(resume.references?.length)
        case 'volunteer': return !!(resume.volunteer?.length)
        default: return false
      }
    })()

    if (present) {
      const pts = tier === 'core' ? 5 : tier === 'expected' ? 3 : 2
      score += pts
    } else {
      const type = tier === 'core' ? 'critical' : tier === 'expected' ? 'warning' : 'suggestion'
      const msg = lang === 'fr'
        ? `Section "${label}" ${tier === 'core' ? 'requise' : 'recommandée'} manquante`
        : `Missing ${tier === 'core' ? '' : 'optional '}section: ${label}`
      if (tier !== 'optional') {
        issues.push({
          id: `completeness-${key}`,
          type,
          category: 'completeness',
          issue: msg,
          fix: lang === 'fr' ? `Ajoutez la section "${label}" à votre CV` : `Add a "${label}" section to your resume`,
          section: key,
          severityScore: tier === 'core' ? 90 : tier === 'expected' ? 60 : 30,
          autoFixable: false,
        })
      }
    }
  }

  checkPresent('contact', 'Contact', 'core')
  checkPresent('experience', 'Experience', 'core')
  checkPresent('education', 'Education', 'core')
  checkPresent('skills', 'Skills', 'core')
  checkPresent('summary', 'Summary', 'expected')
  checkPresent('projects', 'Projects', 'expected')
  checkPresent('certifications', 'Certifications', 'expected')
  checkPresent('languages', 'Languages', 'optional')
  checkPresent('awards', 'Awards', 'optional')
  checkPresent('interests', 'Interests', 'optional')
  checkPresent('publications', 'Publications', 'optional')
  checkPresent('references', 'References', 'optional')
  if (resume.projects && resume.projects.length > 0) {
    const undatedProjects = resume.projects.filter(p => !p.startDate && !p.endDate && !p.date)
    if (undatedProjects.length > 0) {
      score = Math.max(0, score - 1)
      issues.push({
        id: 'projects-no-dates',
        type: 'warning',
        category: 'completeness',
        issue: `${undatedProjects.length} project(s) have no date — ATS parsers may skip or mislabel them.`,
        fix: 'Add a year or date range to each project: "CloudAnalytics Portal (2022 – present)"',
        section: 'projects',
        severityScore: 5,
        autoFixable: false,
      })
    }
  }

  return { key: 'completeness', label: 'Section Completeness', score: Math.min(score, max), max, weight: DIMENSION_WEIGHTS.completeness, issues }
}

export function extractMeaningfulKeywords(jdText: string): string[] {
  const tokens = jdText.toLowerCase().match(/\b[a-z][a-z.+#/-]{2,}\b/g) ?? []
  return [...new Set(tokens.filter(t => !JD_STOPWORDS.has(t) && t.length > 2))]
}

export function scoreSemantic(resume: ResumeData, jd: string, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 100
  const weight = jd.trim() ? DIMENSION_WEIGHTS.semantic : 0

  if (!jd.trim()) {
    return { key: 'semantic', label: 'Semantic Relevance', score: 0, max, weight, issues }
  }

  const resumeText = extractResumeText(resume)
  const score = computeKeywordOverlapRatio(resumeText, jd)

  if (score < 40) {
    issues.push({
      id: 'semantic-low-relevance',
      type: 'warning',
      category: 'semantic',
      issue: lang === 'fr' ? `Faible pertinence sémantique (${score}%)` : `Low semantic relevance (${score}%)`,
      fix: lang === 'fr' 
        ? 'Enrichissez votre CV avec le vocabulaire et le contexte du poste' 
        : 'Align your resume context and vocabulary closer to the target job role',
      severityScore: 40,
      autoFixable: false,
    })
  }

  return { key: 'semantic', label: 'Semantic Relevance', score, max, weight, issues }
}

export function scoreKeywords(resume: ResumeData, jd: string, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 25

  if (!jd.trim()) {
    return { key: 'keywords', label: 'Keyword Match', score: 0, max, weight: 0, issues: [] }
  }

  const resumeText = extractResumeText(resume)
  const resumeClassification = classifyDomain(resumeText)
  const jdClassification = classifyDomain(jd)
  const domainPenalty = computeDomainPenalty(resumeClassification.domain, jdClassification.domain)

  const uniqueJd = extractMeaningfulKeywords(jd)
  
  // We need resume tokens for variant matching
  const resumeTokens = tokenize(resumeText)
  const uniqueResume = [...new Set(resumeTokens)]

  const { matched, missing, partial } = matchKeywords(uniqueJd, uniqueResume)
  const totalJd = uniqueJd.length

  if (totalJd === 0) {
    return { key: 'keywords', label: 'Keyword Match', score: 0, max, weight: DIMENSION_WEIGHTS.keywords, issues: [] }
  }

  // Weight all keywords
  let matchedWeight = 0
  let totalJdWeight = 0
  
  const weightsMap: Record<string, number> = {}
  for (const kw of uniqueJd) {
    const wStr = weightKeyword(kw)
    const numericWeight = wStr === 'high' ? 2.0 : wStr === 'medium' ? 1.0 : 0.5
    weightsMap[kw] = numericWeight
    totalJdWeight += numericWeight
  }

  for (const kw of matched) {
    matchedWeight += weightsMap[kw] ?? 1.0
  }
  for (const p of partial) {
    matchedWeight += (weightsMap[p.jdTerm] ?? 1.0) * 0.7
  }

  const rawScore = Math.round((matchedWeight / totalJdWeight) * max)
  
  // Apply domainPenalty to the final keyword score
  // Cap keyword match to reflect that technical skills simply don't map
  const score = domainPenalty < -20
    ? Math.min(rawScore, 8) // hard mismatch: max 8/25
    : Math.min(rawScore, max)

  // Push a new critical issue if hard mismatch is detected:
  if (domainPenalty < -20) {
    issues.push({
      id: 'domain-mismatch',
      type: 'critical',
      category: 'semantic',
      issue: `Role mismatch detected: your resume is classified as "${resumeClassification.domain.replace(/_/g,' ')}" but the JD targets "${jdClassification.domain.replace(/_/g,' ')}".`,
      fix: 'Tailor this resume specifically for this role, or verify you are targeting the correct position.',
      severityScore: 35,
      autoFixable: false,
    })
  }

  if (missing.length > 0 && score < 20) {
    const sample = missing.slice(0, 5).join(', ')
    issues.push({
      id: 'keywords-low-match',
      type: 'warning',
      category: 'keywords',
      issue: lang === 'fr' ? `Faible correspondance de mots-clés (${matched.length}/${totalJd})` : `Low keyword match (${matched.length}/${totalJd})`,
      fix: lang === 'fr' ? `Ajoutez ces mots-clés manquants : ${sample}` : `Add these missing keywords: ${sample}`,
      section: 'skills',
      severityScore: 70,
      autoFixable: false,
    })
  }

  if (partial.length > 0) {
    const sample = partial.slice(0, 3).map(p => `"${p.jdTerm}" → "${p.resumeTerm}"`).join(', ')
    issues.push({
      id: 'keywords-synonym',
      type: 'info',
      category: 'keywords',
      issue: lang === 'fr' ? 'Correspondances partielles détectées' : 'Partial keyword matches detected',
      fix: lang === 'fr' ? `Synonymes trouvés : ${sample}` : `Synonyms mapped: ${sample}`,
      severityScore: 20,
      autoFixable: false,
    })
  }

  return { key: 'keywords', label: 'Keyword Match', score, max, weight: DIMENSION_WEIGHTS.keywords, issues }
}

export function scoreFormatting(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 20
  const text = extractResumeText(resume)
  const cw = countContentWords(resume)

  // Content-proportional base: empty resume gets 0, not 20
  // Ramp from 0 to 20 over 0–300 content words
  let score = Math.min(max, Math.round((cw / 300) * max))
  if (cw < 50) score = Math.min(score, 3) // almost nothing written

  const skillIssues = evaluateSkillsQuality(resume)
  if (skillIssues.length > 0) {
    score = Math.max(0, score - 1)
    issues.push(...skillIssues)
  }

  // Word repetition check — flag words used 3+ times across resume text
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  const freq: Record<string, number> = {}
  for (const w of words) freq[w] = (freq[w] || 0) + 1
  const repeated = Object.entries(freq).filter(([, n]) => n >= 3).sort(([, a], [, b]) => b - a).slice(0, 5)
  if (repeated.length > 0) {
    score -= 3
    const top = repeated.slice(0, 3).map(([w, n]) => `${w} (${n}x)`).join(', ')
    issues.push({
      id: 'formatting-repetition',
      type: 'suggestion',
      category: 'style',
      issue: lang === 'fr' ? `Mots répétés: ${top}` : `Repeated words: ${top}`,
      fix: 'Replace repeated words with synonyms for better readability and vocabulary range.',
      section: 'experience',
      severityScore: 30,
      autoFixable: false,
    })
  }

  const specialChars = text.match(/[★✓►◆■●▪▲▼◆◇○◎●★☆™®©]/g)
  if (specialChars) {
    score -= 5
    issues.push({
      id: 'formatting-special-chars',
      type: 'warning',
      category: 'formatting',
      issue: lang === 'fr' ? 'Caractères spéciaux détectés' : 'Special characters detected',
      fix: lang === 'fr' ? 'Supprimez les symboles (★, ✓, ►, etc.) qui bloquent les parseurs ATS' : 'Remove symbols (★, ✓, ►, etc.) that break ATS parsers',
      section: 'experience',
      severityScore: 60,
      autoFixable: true,
    })
  }

  const langPronounRegex = lang === 'fr' ? FR_PRONOUNS_REGEX : EN_PRONOUNS_REGEX
  const hasPronouns = langPronounRegex.test(resume.summary) ||
    resume.experience.some(exp => exp.bullets.some(b => langPronounRegex.test(b)))
  if (hasPronouns) {
    score -= 5
    issues.push({
      id: 'formatting-pronouns',
      type: 'warning',
      category: 'formatting',
      issue: lang === 'fr' ? 'Pronoms personnels détectés' : 'Personal pronouns detected',
      fix: lang === 'fr' ? 'Remplacez "je/mon/nous" par un style professionnel sans pronoms' : 'Remove "I/my/we" — use professional third-person style',
      section: 'summary',
      severityScore: 60,
      autoFixable: true,
    })
  }

  if (resume.experience.length > 0) {
    const bulletStarts = resume.experience.flatMap(exp =>
      exp.bullets.map(b => b.trim().replace(/^[^\w]+/, '').charAt(0))
    )
    const lowerStart = bulletStarts.filter(c => c >= 'a' && c <= 'z')
    if (lowerStart.length > bulletStarts.length * 0.5) {
      score -= 3
      issues.push({
        id: 'formatting-capitalization',
        type: 'suggestion',
        category: 'formatting',
        issue: lang === 'fr' ? 'Certaines puces commencent en minuscule' : 'Some bullets start with lowercase',
        fix: lang === 'fr' ? 'Commencez chaque puce par une majuscule' : 'Start every bullet with a capital letter',
        section: 'experience',
        severityScore: 25,
        autoFixable: true,
      })
    }
  }

  // Detect leading bullet symbols (•, -, *, etc.)
  const hasBulletSymbols = resume.experience.some(exp =>
    exp.bullets.some(b => /^[•\-*‣⁃]\s/.test(b.trim()))
  )
  if (hasBulletSymbols) {
    score -= 2
    issues.push({
      id: 'formatting-bullet-symbols',
      type: 'suggestion',
      category: 'formatting',
      issue: lang === 'fr' ? 'Symboles de puces visibles' : 'Visible bullet symbols detected',
      fix: lang === 'fr' ? 'Supprimez les • et - au début des puces' : 'Remove bullet symbols (•, -) from the start of lines',
      section: 'experience',
      severityScore: 20,
      autoFixable: true,
    })
  }

  return { key: 'formatting', label: 'Formatting Safety', score: Math.max(0, score), max, weight: DIMENSION_WEIGHTS.formatting, issues }
}

export function scoreContactInfo(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 5
  let score = 0
  const c = resume.contact

  if (c) {
    if (c.fullName?.trim()) score++
    if (c.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) score++
    if (c.phone?.trim()) score++
    if (c.linkedin?.trim()) score++
    if (c.location?.trim()) score++

    // Detect all-caps URLs — ATS encoding risk
    const resumeText = extractResumeText(resume)
    const allCapsUrlPattern = /HTTPS?:\/\/[A-Z0-9./-]+/
    if (allCapsUrlPattern.test(resumeText)) {
      score = Math.max(0, score - 1)
      issues.push({
        id: 'contact-caps-url',
        type: 'warning',
        category: 'formatting',
        issue: 'LinkedIn or website URL is in ALL CAPS — increases ATS parsing error risk.',
        fix: 'Use lowercase URLs: linkedin.com/in/janedoe instead of LINKEDIN.COM/IN/JANEDOE.',
        severityScore: 8,
        autoFixable: true,
        section: 'contact'
      })
    }
  }

  if (score < max) {
    const missing: string[] = []
    if (!c?.fullName?.trim()) missing.push(lang === 'fr' ? 'nom' : 'name')
    if (!c?.email?.trim()) missing.push('email')
    if (!c?.phone?.trim()) missing.push(lang === 'fr' ? 'téléphone' : 'phone')
    if (!c?.linkedin?.trim()) missing.push('LinkedIn')

    if (missing.length > 0) {
      issues.push({
        id: 'contact-incomplete',
        type: 'critical',
        category: 'completeness',
        issue: lang === 'fr' ? 'Coordonnées incomplètes' : 'Incomplete contact info',
        fix: lang === 'fr' ? `Ajoutez : ${missing.join(', ')}` : `Add: ${missing.join(', ')}`,
        section: 'contact',
        severityScore: 85,
        autoFixable: false,
      })
    }
  }

  return { key: 'contactInfo', label: 'Contact Info', score, max, weight: DIMENSION_WEIGHTS.contactInfo, issues }
}

export function scoreDateConsistency(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 5
  let score = 5

  const experience = resume.experience || []
  const education = resume.education || []
  const volunteer = resume.volunteer || []
  const certifications = resume.certifications || []
  const awards = resume.awards || []

  const allDates: string[] = []
  experience.forEach(exp => {
    if (exp.startDate) allDates.push(exp.startDate)
    if (exp.endDate) allDates.push(exp.endDate)
  })
  education.forEach(edu => {
    if (edu.graduationDate) {
      const parts = edu.graduationDate.split(/[–-]/)
      parts.forEach(p => {
        const trimmed = p.trim()
        if (trimmed) allDates.push(trimmed)
      })
    }
  })
  volunteer.forEach(v => {
    if (v.period) {
      const parts = v.period.split(/[–-]/)
      parts.forEach(p => {
        const trimmed = p.trim()
        if (trimmed) allDates.push(trimmed)
      })
    }
  })
  certifications.forEach(c => {
    if (c.date) {
      const parts = c.date.split(/[–-]/)
      parts.forEach(p => {
        const trimmed = p.trim()
        if (trimmed) allDates.push(trimmed)
      })
    }
  })
  awards.forEach(a => {
    if (a.date) {
      const parts = a.date.split(/[–-]/)
      parts.forEach(p => {
        const trimmed = p.trim()
        if (trimmed) allDates.push(trimmed)
      })
    }
  })
  const projects = resume.projects || []
  projects.forEach(p => {
    if (p.date) {
      const parts = p.date.split(/[–-]/)
      parts.forEach(part => {
        const trimmed = part.trim()
        if (trimmed) allDates.push(trimmed)
      })
    }
  })

  if (allDates.length === 0) {
    const hasAnyExperience = resume.experience.length > 0 || resume.education.length > 0
    if (hasAnyExperience) {
      issues.push({
        id: 'dates-completely-missing',
        type: 'critical',
        category: 'completeness',
        issue: lang === 'fr' ? 'Aucune date trouvée dans le CV' : 'No dates found in the resume',
        fix: lang === 'fr' ? 'Ajoutez les dates de début et fin pour chaque expérience et formation' : 'Add start/end dates for every experience and education entry',
        section: 'experience',
        severityScore: 85,
        autoFixable: false,
      })
    }
    return { key: 'dateConsistency', label: 'Date Consistency', score: hasAnyExperience ? 0 : max, max, weight: DIMENSION_WEIGHTS.dateConsistency, issues }
  }

  const formats = allDates.map(d => detectDateFormat(d, lang as 'en' | 'fr'))
  const invalidDates = formats.filter(f => f === 'Invalid')
  const uniqueFormats = [...new Set(formats.filter(f => f !== 'Invalid'))]

  if (invalidDates.length > 0 || uniqueFormats.length > 1) {
    score = 0
    issues.push({
      id: 'dates-inconsistent',
      type: 'warning',
      category: 'formatting',
      issue: lang === 'fr' ? 'Formats de date incohérents' : 'Inconsistent date formats',
      fix: lang === 'fr' ? 'Utilisez un format uniforme MM/AAAA pour toutes les dates' : 'Use consistent MM/YYYY format for all dates',
      section: 'experience',
      severityScore: 60,
      autoFixable: true,
    })
  }

  // Extract all raw date strings from ALL sections including volunteer, certifications
  const allDateStrings: string[] = [
    ...experience.flatMap(e => [e.startDate, e.endDate]),
    ...education.map(e => e.graduationDate),
    ...(volunteer ?? []).flatMap(v => [v.startDate || '', v.endDate || '', v.period || '']),
    ...(certifications ?? []).map(c => c.date),
    ...(awards ?? []).map(a => a.date),
  ].filter(Boolean)

  // Check separator consistency — some use "–" some use "-" some use " - "
  const separators = allDateStrings
    .filter(d => d && (d.includes('present') || d.includes('Present') || d.includes('actuel') || d.includes('Actuel')))
    .map(d => d.replace(/\d+\/\d+/, '').trim())
  const uniqueSeparators = new Set(separators)
  if (uniqueSeparators.size > 1) {
    score = Math.max(0, score - 1)
    issues.push({
      id: 'dates-separator-inconsistent',
      type: 'warning',
      category: 'formatting',
      issue: lang === 'fr' ? 'Séparateurs de date incohérents' : 'Inconsistent date range separators across sections',
      fix: lang === 'fr' 
        ? 'Utilisez un séparateur de date uniforme (ex: " - ") dans toutes les sections' 
        : 'Use a consistent separator (e.g., " - ") for all date ranges and periods.',
      section: 'experience',
      severityScore: 25,
      autoFixable: true,
    })
  }

  return { key: 'dateConsistency', label: 'Date Consistency', score, max, weight: DIMENSION_WEIGHTS.dateConsistency, issues }
}

export function scoreLength(resume: ResumeData, lang: string, fontSize: number = 10): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 5
  const text = extractResumeText(resume)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const parseYear = (s: string | undefined | null) => {
    const m = (s || '').match(/\b(\d{4})\b/)
    return m ? parseInt(m[1]) : 0
  }
  const years = resume.experience.reduce((sum, e) => {
    const start = parseYear(e.startDate)
    if (start === 0) return sum
    const endStr = e.endDate
    const end = /present|current/i.test(endStr || '')
      ? new Date().getFullYear()
      : parseYear(endStr)
    return sum + Math.max(0, end - start)
  }, 0)

  let target: string
  let score: number

  // Use content words (excludes contact info) for more honest counting
  const contentWc = countContentWords(resume)

  // Critically short — this is barely a resume
  if (contentWc < 50) {
    score = 0
    target = lang === 'fr' ? 'Minimum 200 mots de contenu' : 'Minimum 200 words of content'
  } else if (contentWc < 150) {
    score = 1
    target = lang === 'fr' ? '1 page (~300-400 mots)' : '1 page (~300-400 words)'
  } else if (years <= 5) {
    if (wordCount < 250) { score = 2; target = lang === 'fr' ? '1 page (~300-400 mots)' : '1 page (~300-400 words)' }
    else if (wordCount > 750) { score = 3; target = lang === 'fr' ? '1 page (max 700 mots)' : '1 page (max 700 words)' }
    else { score = 5; target = lang === 'fr' ? '1 page' : '1 page' }
  } else {
    if (wordCount < 400) { score = 3; target = lang === 'fr' ? '1-2 pages (400-1200 mots)' : '1-2 pages (400-1200 words)' }
    else if (wordCount > 1300) { score = 2; target = lang === 'fr' ? '2 pages (max 1200 mots)' : '2 pages (max 1200 words)' }
    else { score = 5; target = lang === 'fr' ? '1-2 pages' : '1-2 pages' }
  }

  if (score < 5) {
    issues.push({
      id: 'length-inappropriate',
      type: 'suggestion',
      category: 'structure',
      issue: lang === 'fr' ? `Longueur non optimale (${wordCount} mots)` : `Suboptimal length (${wordCount} words)`,
      fix: lang === 'fr' ? `Visez environ ${target}` : `Aim for roughly ${target}`,
      section: 'summary',
      severityScore: 30,
      autoFixable: false,
    })
  }

  // Check sparse Page 2 layout
  const defaultSectionOrder = ['summary', 'experience', 'projects', 'education', 'skills', 'languages', 'awards', 'certifications', 'publications', 'volunteer', 'interests', 'references']
  const pageCount = estimatePageCount(resume, defaultSectionOrder, fontSize)

  // Compute overflow heuristic: how much content spills onto page 2
  const hasContent = (key: string): boolean => {
    if (key === 'summary') return !!(resume.summary && resume.summary.trim() !== '')
    if (key === 'skills') return !!(resume.skills && getActualSkillsCount(resume.skills) > 0)
    const val = (resume as unknown as Record<string, unknown>)[key]
    return Array.isArray(val) && val.length > 0
  }
  const activeSections = defaultSectionOrder.filter(hasContent)
  const heights = getSectionHeights(resume, fontSize)
  const totalHeight = activeSections.reduce((sum, sec) => sum + (heights[sec] || 60), 0)
  const overflow = totalHeight - USABLE_PER_PAGE

  if (pageCount >= 2 && overflow > 0 && overflow < USABLE_PER_PAGE * 0.4) {
    score = Math.max(1, score - 1) // Deduct 1 point for sparse page layout
    const spillPercent = Math.round((overflow / USABLE_PER_PAGE) * 100)
    issues.push({
      id: 'page2-sparse',
      type: 'warning',
      category: 'structure',
      issue: `Page 2 is sparse (~${spillPercent}% of a page spills over) — wastes most of the page.`,
      fix: 'Move Certifications and Volunteer to bottom of page 1, or add more content to justify a second page. A near-empty page 2 signals poor layout to human reviewers.',
      severityScore: 8,
      autoFixable: false,
    })
  }

  return { key: 'length', label: 'Length', score, max, weight: DIMENSION_WEIGHTS.length, issues }
}

export function scoreReadability(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 5
  const text = extractResumeText(resume)
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length || 1

  // Can't evaluate readability of near-empty content
  const cw = countContentWords(resume)
  if (cw < 80) {
    issues.push({
      id: 'readability-insufficient-content',
      type: 'warning',
      category: 'completeness',
      issue: lang === 'fr' ? 'Contenu insuffisant pour évaluer la lisibilité' : 'Not enough content to evaluate readability',
      fix: lang === 'fr' ? 'Ajoutez plus de contenu descriptif (min. 80 mots)' : 'Add more descriptive content (minimum 80 words)',
      severityScore: 40,
      autoFixable: false,
    })
    return { key: 'readability', label: 'Readability', score: cw < 30 ? 0 : 1, max, weight: DIMENSION_WEIGHTS.readability, issues }
  }
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0)

  // Count sentences properly: bullets are individual sentences, summary has real periods, etc.
  let sentenceCount = 0
  if (resume.summary) sentenceCount += resume.summary.split(/[.!?]+/).filter(Boolean).length
  resume.experience.forEach(exp => { sentenceCount += exp.bullets.filter(b => b.trim()).length })
  resume.projects?.forEach(p => { if (p.description?.trim()) sentenceCount++ })
  const sentences = Math.max(1, sentenceCount)

  const fkgl = 0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59

  // Flesch-Kincaid grade scoring calibrated for resume text
  const readabilityScore = (gradeLevel: number): number => {
    if (gradeLevel <= 14) return 5
    if (gradeLevel <= 18) return 4
    if (gradeLevel <= 22) return 3
    if (gradeLevel <= 26) return 2
    return 1
  }

  const gradeLevel = Math.floor(fkgl)
  const score = readabilityScore(gradeLevel)

  if (fkgl > 22) {
    issues.push({
      id: 'readability-complex',
      type: 'suggestion',
      category: 'style',
      issue: lang === 'fr' ? 'CV trop complexe (niveau > 22)' : 'Resume complex (grade > 22)',
      fix: lang === 'fr' ? 'Utilisez un langage plus simple. Remplacez le jargon par des termes courants.' : 'Shorten sentences and simplify technical jargon where possible.',
      severityScore: 25,
      autoFixable: false,
    })
  } else if (fkgl < 6) {
    issues.push({
      id: 'readability-simple',
      type: 'suggestion',
      category: 'style',
      issue: lang === 'fr' ? 'CV trop simple (niveau < 8)' : 'Resume too simple (grade < 8)',
      fix: lang === 'fr' ? 'Ajoutez du vocabulaire technique et des descriptions détaillées.' : 'Add technical vocabulary and detailed descriptions.',
      severityScore: 15,
      autoFixable: false,
    })
  }

  return { key: 'readability', label: 'Readability', score, max, weight: DIMENSION_WEIGHTS.readability, issues }
}

export function scoreContentDepth(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 15
  let score = 0

  // 1. Summary depth (0-3 points)
  const summaryWords = (resume.summary || '').trim().split(/\s+/).filter(w => w.length > 0).length
  if (summaryWords >= 25) {
    score += 3
  } else if (summaryWords >= 10) {
    score += 1
    issues.push({
      id: 'depth-summary-thin',
      type: 'warning',
      category: 'completeness',
      issue: lang === 'fr' ? `Résumé trop court (${summaryWords} mots)` : `Summary too thin (${summaryWords} words)`,
      fix: lang === 'fr' ? 'Écrivez un résumé de 2-4 phrases (30+ mots) décrivant votre profil' : 'Write a 2-4 sentence summary (30+ words) describing your profile and value',
      section: 'summary',
      severityScore: 50,
      autoFixable: false,
    })
  } else {
    issues.push({
      id: 'depth-summary-missing',
      type: 'critical',
      category: 'completeness',
      issue: lang === 'fr' ? 'Résumé professionnel absent ou quasi-vide' : 'Professional summary is missing or nearly empty',
      fix: lang === 'fr' ? 'Ajoutez un résumé professionnel de 2-4 phrases' : 'Add a 2-4 sentence professional summary highlighting your key strengths',
      section: 'summary',
      severityScore: 70,
      autoFixable: false,
    })
  }

  // 2. Experience bullet depth (0-5 points)
  const totalExperiences = resume.experience.length
  if (totalExperiences > 0) {
    const meaningfulBullets = countMeaningfulBullets(resume)
    const totalBullets = resume.experience.reduce((sum, e) => sum + e.bullets.length, 0)

    // Expect at least 3 meaningful bullets per experience entry
    const expectedBullets = totalExperiences * 3
    const bulletRatio = meaningfulBullets / expectedBullets
    const bulletScore = Math.min(5, Math.round(bulletRatio * 5))
    score += bulletScore

    if (meaningfulBullets === 0) {
      issues.push({
        id: 'depth-no-bullets',
        type: 'critical',
        category: 'completeness',
        issue: lang === 'fr' ? 'Aucune description dans les expériences' : 'Experience entries have no meaningful bullet points',
        fix: lang === 'fr' ? 'Ajoutez 3-5 puces décrivant vos réalisations pour chaque poste' : 'Add 3-5 bullet points describing achievements for each role',
        section: 'experience',
        severityScore: 90,
        autoFixable: false,
      })
    } else if (bulletRatio < 0.5) {
      issues.push({
        id: 'depth-few-bullets',
        type: 'warning',
        category: 'completeness',
        issue: lang === 'fr' ? `Trop peu de descriptions (${meaningfulBullets} puces pour ${totalExperiences} postes)` : `Too few bullet points (${meaningfulBullets} for ${totalExperiences} roles)`,
        fix: lang === 'fr' ? 'Ajoutez au moins 3 puces par poste' : 'Add at least 3 bullet points per role',
        section: 'experience',
        severityScore: 65,
        autoFixable: false,
      })
    }

    // Check for stub bullets (very short, placeholder-like)
    const stubBullets = resume.experience.reduce((sum, e) =>
      sum + e.bullets.filter(b => b.trim().length > 0 && b.trim().length < 15).length, 0)
    if (stubBullets > 0 && totalBullets > 0) {
      issues.push({
        id: 'depth-stub-bullets',
        type: 'warning',
        category: 'formatting',
        issue: lang === 'fr' ? `${stubBullets} puce(s) trop courtes` : `${stubBullets} bullet(s) are too short (under 15 characters)`,
        fix: lang === 'fr' ? 'Chaque puce doit faire au moins 15 caractères et décrire un résultat' : 'Each bullet should be at least 15 characters and describe a concrete achievement',
        section: 'experience',
        severityScore: 45,
        autoFixable: false,
      })
    }
  } else {
    issues.push({
      id: 'depth-no-experience',
      type: 'critical',
      category: 'completeness',
      issue: lang === 'fr' ? 'Aucune expérience professionnelle' : 'No work experience entries',
      fix: lang === 'fr' ? 'Ajoutez au moins une expérience professionnelle' : 'Add at least one work experience entry with detailed bullet points',
      section: 'experience',
      severityScore: 90,
      autoFixable: false,
    })
  }

  // 3. Skills depth (0-3 points)
  const skillCount = getActualSkillsCount(resume.skills || [])
  if (skillCount >= 6) {
    score += 3
  } else if (skillCount >= 3) {
    score += 1
    issues.push({
      id: 'depth-few-skills',
      type: 'warning',
      category: 'completeness',
      issue: lang === 'fr' ? `Seulement ${skillCount} compétences listées` : `Only ${skillCount} skills listed`,
      fix: lang === 'fr' ? 'Listez au moins 6 compétences clés' : 'List at least 6 core skills relevant to your target role',
      section: 'skills',
      severityScore: 50,
      autoFixable: false,
    })
  } else {
    issues.push({
      id: 'depth-no-skills',
      type: 'critical',
      category: 'completeness',
      issue: lang === 'fr' ? 'Section compétences vide ou quasi-vide' : 'Skills section is empty or nearly empty',
      fix: lang === 'fr' ? 'Ajoutez vos compétences techniques et soft skills' : 'Add your technical skills and soft skills',
      section: 'skills',
      severityScore: 80,
      autoFixable: false,
    })
  }

  // 4. Education depth (0-2 points)
  const eduCount = resume.education?.length || 0
  if (eduCount > 0) {
    const hasValidEdu = resume.education.some(e => e.degree?.trim().length > 2 && e.school?.trim().length > 2)
    if (hasValidEdu) {
      score += 2
    } else {
      score += 1
      issues.push({
        id: 'depth-edu-incomplete',
        type: 'warning',
        category: 'completeness',
        issue: lang === 'fr' ? 'Formation incomplète (diplôme ou école manquant)' : 'Education entry is incomplete (missing degree or school name)',
        fix: lang === 'fr' ? 'Renseignez le diplôme et l\'établissement' : 'Fill in both the degree name and school name',
        section: 'education',
        severityScore: 45,
        autoFixable: false,
      })
    }
  }

  // 5. Overall content word check (0-2 points)
  const cw = countContentWords(resume)
  if (cw >= 200) {
    score += 2
  } else if (cw >= 100) {
    score += 1
  }

  return { key: 'contentDepth', label: 'Content Depth', score: Math.min(score, max), max, weight: DIMENSION_WEIGHTS.contentDepth, issues }
}

export function scoreAtsParseability(resume: ResumeData): { score: number; issues: AtsIssue[] } {
  const text = extractResumeText(resume)
  let score = 100
  const issues: AtsIssue[] = []

  // Special characters that break parsers
  const specialChars = text.match(/[★✓►◆■●▪▲▼◇○◎™®©‣⁃►☆★]/g)
  if (specialChars) {
    const penalty = Math.min(20, specialChars.length * 3)
    score -= penalty
    issues.push({
      id: 'parseability-special-chars',
      type: 'warning',
      category: 'formatting',
      issue: `Special characters may block ATS parsing (${specialChars.length} found)`,
      fix: 'Remove decorative symbols (stars, checkmarks, arrows). Use plain text only.',
      severityScore: 60,
      autoFixable: true,
    })
  }

  // Unusual Unicode (non-ASCII, non-accented)
  const unusualUnicode = text.match(/[^\u0020-\u007E\u00C0-\u024F\u1E00-\u1EFF]/g)
  if (unusualUnicode) {
    const penalty = Math.min(15, unusualUnicode.length * 2)
    score -= penalty
    issues.push({
      id: 'parseability-unicode',
      type: 'suggestion',
      category: 'formatting',
      issue: `Unusual unicode characters detected (${unusualUnicode.length})`,
      fix: 'Stick to standard ASCII and common accented characters only.',
      severityScore: 30,
      autoFixable: false,
    })
  }

  // Check contact info position - if empty the whole resume has issues
  if (!resume.contact?.fullName && !resume.summary && resume.experience.length === 0) {
    score -= 40
  }

  // Very short or empty text
  if (text.length < 100) {
    score -= 20
  }

  // Check for standard section names (non-standard names hurt parseability)
  const sectionHints = [
    { key: 'experience', names: ['experience', 'work experience', 'employment', 'work history', 'professional experience'] },
    { key: 'education', names: ['education', 'academic', 'academic background', 'studies'] },
    { key: 'skills', names: ['skills', 'technical skills', 'core competencies', 'expertise'] },
  ]
  for (const section of sectionHints) {
    const hasStandard = section.names.some(name => text.toLowerCase().includes(name))
    if (!hasStandard) {
      score -= 5
      issues.push({
        id: `parseability-section-${toDomId(section.key)}`,
        type: 'suggestion',
        category: 'structure',
        issue: `Section "${section.key}" may use non-standard heading`,
        fix: `Use a standard heading like "${section.names[0]}" for better ATS recognition.`,
        severityScore: 20,
        autoFixable: false,
      })
    }
  }

  // Contact info position check
  if (resume.contact?.fullName && text.length > 50) {
    const first100 = text.slice(0, 100).toLowerCase()
    const nameParts = resume.contact.fullName.toLowerCase().split(/\s+/)
    const nameNearTop = nameParts.some(p => p.length > 2 && first100.includes(p))
    if (!nameNearTop) {
      score -= 5
      issues.push({
        id: 'parseability-contact-position',
        type: 'suggestion',
        category: 'structure',
        issue: 'Contact info should be at the top of the resume',
        fix: 'Move your name and contact details to the very top of the document.',
        severityScore: 20,
        autoFixable: false,
      })
    }
  }

  return { score: Math.max(0, Math.min(100, score)), issues }
}
