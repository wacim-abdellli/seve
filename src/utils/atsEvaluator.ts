import type { ResumeData, AtsScore, SkillsMatrixItem, AtsIssue, AtsCategoryScore, AtsReport, AtsRatingResult, SectionTier, IndustryProfile } from '../types/resume'
import { classifyDomain, computeDomainPenalty } from './roleClassifier'
import { computeSemanticRelevance } from './semanticScorer'
import { getPageBreakSections } from './layoutHelper'

// Helper list of strong active verbs (English)
const STRONG_VERBS = new Set([
  'led', 'built', 'created', 'designed', 'developed', 'managed',
  'increased', 'decreased', 'improved', 'launched', 'delivered',
  'achieved', 'executed', 'optimized', 'automated', 'coordinated',
  'generated', 'reduced', 'implemented', 'streamlined', 'negotiated',
  'established', 'transformed', 'spearheaded', 'drove', 'deployed',
  'engineered', 'analyzed', 'produced', 'trained', 'mentored',
  'directed', 'facilitated', 'collaborated', 'resolved', 'maintained',
  'monitored', 'supported', 'authored'
])

// Helper list of strong active verbs (French - participles and infinitives)
const FR_STRONG_VERBS = new Set([
  'dirigé', 'conçu', 'créé', 'développé', 'géré', 'optimisé', 'automatisé', 'implémenté',
  'amélioré', 'lancé', 'livré', 'réalisé', 'exécuté', 'coordonné', 'généré', 'réduit',
  'mis', 'structuré', 'négocié', 'établi', 'transformé', 'piloté', 'propulsé', 'déployé',
  'conduit', 'analysé', 'produit', 'formé', 'encadré', 'supervisé', 'facilité', 'collaboré',
  'résolu', 'maintenu', 'suivi', 'soutenu', 'rédigé', 'administré', 'déterminé', 'accru',
  // Infinitives
  'diriger', 'concevoir', 'créer', 'développer', 'gérer', 'optimiser', 'automatiser', 'implémenter',
  'améliorer', 'lancer', 'livrer', 'réaliser', 'exécuter', 'coordonner', 'générer', 'réduire',
  'mettre', 'structurer', 'négocier', 'établir', 'transformer', 'piloter', 'propulser', 'déployer',
  'conduire', 'analyser', 'produire', 'former', 'encadrer', 'superviser', 'faciliter', 'collaborer',
  'résoudre', 'maintenir', 'suivre', 'soutenir', 'rédiger', 'administrer', 'déterminer', 'accroître'
])

// Helper list of common English stopwords
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'and', 'or', 'but', 'if', 'about'
])

// Helper list of common French stopwords
const FR_STOPWORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'est', 'sont', 'a', 'ont', 'de', 'en',
  'pour', 'sur', 'avec', 'dans', 'par', 'du', 'au', 'aux', 'et', 'ou', 'mais',
  'si', 'se', 'sa', 'ses', 'ce', 'cet', 'cette', 'ces', 'qui', 'que', 'quoi',
  'dont', 'ou', 'dans', 'chez', 'sous', 'vers', 'pourquoi', 'comment', 'plus'
])

const EN_PRONOUNS_REGEX = /\b(i|me|my|we|our|us)\b/i
const FR_PRONOUNS_REGEX = /\b(je|moi|mon|ma|mes|nous|notre|nos|on)\b/i

// Localized UI feedback messages
// Helper function to extract words from text
function getWords(text: string): string[] {
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
function detectDateFormat(dateStr: string, lang: 'en' | 'fr'): 'MM/YYYY' | 'Month YYYY' | 'Invalid' {
  const clean = dateStr.trim()
  if (/^present|current|actuel|aujourd'hui$/i.test(clean)) {
    return 'MM/YYYY'
  }

  // MM/YYYY or MM/AAAA: matches 01/2020 or 12/2026
  if (/^(0[1-9]|1[0-2])\/\d{4}$/.test(clean)) {
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

export function evaluateResume(resume: ResumeData, jobDescription: string): AtsScore & { language: 'en' | 'fr'; reportV2: AtsReport } {
  const report = generateAtsReportV2(resume, jobDescription)
  
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


const WEAK_TO_STRONG_EN: Record<string, string> = {
  helped: 'Collaborated',
  assisted: 'Facilitated',
  made: 'Created',
  did: 'Executed',
  worked: 'Engineered',
  managed: 'Led',
  went: 'Navigated',
  had: 'Acquired',
  saw: 'Monitored',
  took: 'Spearheaded',
  gave: 'Delivered',
  talked: 'Presented',
  got: 'Secured',
}

const WEAK_TO_STRONG_FR: Record<string, string> = {
  aidé: 'Collaboré',
  assisté: 'Facilité',
  fait: 'Créé',
  faisais: 'Conçu',
  travaillé: 'Développé',
  eu: 'Obtenu',
  donné: 'Présenté',
  parlé: 'Communiqué',
  pris: 'Dirigé',
}

export function autoFix(resume: ResumeData): ResumeData {
  const fixed = JSON.parse(JSON.stringify(resume)) as ResumeData
  
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
      
      cleaned = cleaned.replace(/\b(?:i|me|we|us)\b/gi, '')
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
      
      cleaned = cleaned.replace(/\b(?:je|moi|nous|on)\b/gi, '')
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

export function calculateLocalSemanticScore(resumeText: string, jobDescription: string): number {
  return computeSemanticRelevance(resumeText, jobDescription)
}

export function calculateSkillsMatrix(resume: ResumeData, jobDescription: string): SkillsMatrixItem[] {
  // Compile resume text
  let resumeText = ''
  if (resume.contact) {
    resumeText += ` ${resume.contact.fullName} ${resume.contact.email} ${resume.contact.phone} ${resume.contact.linkedin} ${resume.contact.location} ${resume.contact.website || ''}`
  }
  resumeText += ` ${resume.summary}`
  resume.experience.forEach((exp) => {
    resumeText += ` ${exp.jobTitle} ${exp.company} ${exp.location} ${exp.bullets.join(' ')}`
  })
  resume.education.forEach((edu) => {
    resumeText += ` ${edu.degree} ${edu.school} ${edu.location}`
  })
  resume.skills.forEach((s) => {
    resumeText += ` ${s}`
  })
  if (resume.languages) {
    resume.languages.forEach((l) => {
      resumeText += ` ${l.name} ${l.proficiency}`
    })
  }
  if (resume.projects) {
    resume.projects.forEach((proj) => {
      resumeText += ` ${proj.name} ${proj.description} ${proj.technologies.join(' ')}`
    })
  }
  
  const lowerResume = resumeText.toLowerCase()
  const lowerJd = jobDescription.toLowerCase()
  
  // Detect language of resume/JD to select correct labels
  const lang = detectLanguage(resumeText)

  const checkPresence = (sourceText: string, keyword: string): boolean => {
    if (/[^a-z0-9\u00c0-\u00ff]/i.test(keyword)) {
      return sourceText.includes(keyword.toLowerCase())
    }
    const regex = new RegExp(`\\b${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i')
    return regex.test(sourceText)
  }

  const SKILL_CATEGORIES_CONFIG = [
    {
      subject: lang === 'fr' ? 'Langages & Algorithmique' : 'Languages & Core Tech',
      keywords: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'html', 'css', 'sql', 'bash', 'shell', 'r', 'c']
    },
    {
      subject: lang === 'fr' ? 'Frameworks & Libs' : 'Frameworks & Libs',
      keywords: ['react', 'angular', 'vue', 'svelte', 'nextjs', 'next.js', 'nuxt', 'django', 'flask', 'fastapi', 'express', 'nestjs', 'rails', 'spring', 'springboot', 'laravel', 'tailwind', 'bootstrap', 'redux', 'graphql', 'jquery']
    },
    {
      subject: lang === 'fr' ? 'Bases de Données & Architecture' : 'Databases & Systems',
      keywords: ['postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'nosql', 'dynamodb', 'cassandra', 'elasticsearch', 'mariadb', 'microservices', 'rest', 'api', 'apis', 'grpc', 'rabbitmq', 'kafka', 'graphql', 'system design', 'architecture']
    },
    {
      subject: lang === 'fr' ? 'DevOps & Cloud' : 'DevOps & Cloud',
      keywords: ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'git', 'github', 'gitlab', 'terraform', 'ansible', 'jenkins', 'linux', 'cloudflare', 'prometheus', 'grafana', 'travis']
    },
    {
      subject: lang === 'fr' ? 'Méthodologies & Soft Skills' : 'Methodology & Soft Skills',
      keywords: ['agile', 'scrum', 'kanban', 'leadership', 'management', 'communication', 'collaboration', 'product management', 'project management', 'mentoring', 'coaching', 'teamwork', 'problem solving', 'creative', 'organization']
    }
  ]

  return SKILL_CATEGORIES_CONFIG.map(cat => {
    // Find which words in this category are in JD
    const jdWords = cat.keywords.filter(kw => checkPresence(lowerJd, kw))
    
    // Find which words in this category are in Resume
    const resumeWords = cat.keywords.filter(kw => checkPresence(lowerResume, kw))

    let candidateScore
    let requiredScore
    let matched: string[]
    let missing: string[]

    if (jdWords.length > 0) {
      // Required level is determined by intensity in the JD
      requiredScore = Math.min(100, 50 + jdWords.length * 10)
      
      // Matched are words that exist in both
      matched = jdWords.filter(w => resumeWords.includes(w))
      missing = jdWords.filter(w => !resumeWords.includes(w))
      
      // Cap candidate score at requiredScore (since we compare them)
      candidateScore = Math.min(100, Math.round((matched.length / jdWords.length) * 100))
    } else {
      // Fallback standard when JD has no keywords in this category
      requiredScore = 40 // baseline
      matched = resumeWords
      missing = []
      
      // Standard score compared to common tech base in this category (up to 4 items is considered 100%)
      const maxExpectedCommon = 4
      candidateScore = Math.min(100, Math.round((resumeWords.length / maxExpectedCommon) * 100))
    }

    // Format capitalizations nicely for presentation
    const formatWord = (w: string) => {
      if (w === 'javascript') return 'JavaScript'
      if (w === 'typescript') return 'TypeScript'
      if (w === 'html') return 'HTML'
      if (w === 'css') return 'CSS'
      if (w === 'sql') return 'SQL'
      if (w === 'nextjs' || w === 'next.js') return 'Next.js'
      if (w === 'vue') return 'Vue.js'
      if (w === 'nestjs') return 'NestJS'
      if (w === 'springboot') return 'Spring Boot'
      if (w === 'gcp') return 'Google Cloud (GCP)'
      if (w === 'aws') return 'AWS'
      if (w === 'ci/cd') return 'CI/CD'
      if (w === 'postgres' || w === 'postgresql') return 'PostgreSQL'
      if (w === 'nosql') return 'NoSQL'
      if (w === 'dynamodb') return 'DynamoDB'
      if (w === 'mongodb') return 'MongoDB'
      if (w === 'elasticsearch') return 'Elasticsearch'
      if (w === 'microservices') return 'Microservices'
      if (w === 'system design') return 'System Design'
      if (w === 'project management') return 'Project Management'
      if (w === 'product management') return 'Product Management'
      if (w === 'problem solving') return 'Problem Solving'
      return w.charAt(0).toUpperCase() + w.slice(1)
    }

    return {
      subject: cat.subject,
      candidate: candidateScore,
      required: requiredScore,
      matched: matched.map(formatWord),
      missing: missing.map(formatWord)
    }
  })
}

/* ═══════════════════════════════════════════
   Phase 1: Section Classification
   ═══════════════════════════════════════════ */

export const SECTION_TIERS: Record<string, SectionTier> = {
  contact: 'core',
  summary: 'expected',
  experience: 'core',
  education: 'core',
  skills: 'core',
  languages: 'optional',
  projects: 'expected',
  awards: 'optional',
  certifications: 'expected',
  interests: 'optional',
  publications: 'optional',
  references: 'optional',
  volunteer: 'optional',
}

export const CORE_SECTION_KEYS = ['contact', 'experience', 'education', 'skills']
export const EXPECTED_SECTION_KEYS = ['summary', 'projects', 'certifications']


/* ═══════════════════════════════════════════
   Phase 1: Word-Boundary Tokenizer
   ═══════════════════════════════════════════ */

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b\w+\b/g) || [])
    .filter(w => w.length > 1)
}

/* ═══════════════════════════════════════════
   Phase 1: Synonym Map
   ═══════════════════════════════════════════ */

export const SYNONYM_MAP: Record<string, string[]> = {
  javascript: ['js', 'ecmascript', 'es6'],
  js: ['javascript', 'ecmascript'],
  typescript: ['ts'],
  ts: ['typescript'],
  postgresql: ['postgres', 'psql'],
  postgres: ['postgresql', 'psql'],
  nextjs: ['next.js', 'next'],
  'next.js': ['nextjs', 'next'],
  react: ['reactjs', 'react.js'],
  reactjs: ['react', 'react.js'],
  node: ['nodejs', 'node.js'],
  nodejs: ['node', 'node.js'],
  aws: ['amazon web services', 'amazon webservices', 'amazon'],
  gcp: ['google cloud', 'google cloud platform'],
  python: ['py', 'python3'],
  docker: ['dockerized', 'container', 'containers', 'containerization'],
  kubernetes: ['k8s', 'kube'],
  k8s: ['kubernetes', 'kube'],
  'machine learning': ['ml', 'deep learning', 'ai'],
  ml: ['machine learning', 'deep learning'],
  ai: ['artificial intelligence', 'machine learning'],
  leadership: ['leader', 'leading', 'led'],
  management: ['manager', 'managing', 'managed'],
  communication: ['communicating', 'communicated', 'verbal', 'written'],
  agile: ['scrum', 'kanban', 'sprint'],
  ci: ['continuous integration', 'ci/cd'],
  cd: ['continuous delivery', 'continuous deployment', 'ci/cd'],
  'ci/cd': ['continuous integration', 'continuous delivery', 'continuous deployment', 'ci', 'cd'],
  mongodb: ['mongo', 'nosql'],
  sql: ['database', 'relational database', 'rdbms', 'mysql', 'postgresql'],
  mysql: ['sql', 'database', 'mariadb'],
  analysis: ['analytics', 'analyzing', 'analyzed', 'data analysis'],
  testing: ['test', 'tests', 'qa', 'quality assurance', 'automated testing'],
  'problem solving': ['problem-solving', 'critical thinking', 'analytical'],
  'project management': ['pm', 'project planning', 'project manager'],
  html: ['html5'],
  css: ['css3', 'stylesheets'],
  ux: ['user experience', 'usability'],
  ui: ['user interface', 'frontend'],
  saas: ['software as a service', 'cloud'],
  api: ['apis', 'rest', 'restful', 'rest api', 'restful api', 'graphql', 'endpoint'],
  graphql: ['api', 'apis', 'graph ql', 'gql'],
  rest: ['restful', 'rest api', 'api'],
  microservices: ['micro-service', 'micro service', 'service-oriented', 'soa'],
  cloud: ['aws', 'azure', 'gcp', 'cloud computing', 'saas'],
  azure: ['microsoft azure', 'cloud'],
  devops: ['dev ops', 'dev-ops', 'site reliability', 'sre', 'ci/cd'],
  linux: ['unix', 'bash', 'shell', 'posix'],
  data: ['analytics', 'data analysis', 'data science', 'data engineering', 'big data'],
  blockchain: ['web3', 'web 3', 'solidity', 'ethereum', 'crypto', 'cryptocurrency'],
  mobile: ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'mobile app'],
  security: ['cybersecurity', 'cyber security', 'infosec', 'information security', 'appsec'],
}

/* ═══════════════════════════════════════════
   Phase 1: matchKeywords()
   ═══════════════════════════════════════════ */

export interface MatchResult {
  matched: string[]
  missing: string[]
  partial: { jdTerm: string; resumeTerm: string }[]
}

export function matchKeywords(jdTokens: string[], resumeTokens: string[]): MatchResult {
  const resumeSet = new Set(resumeTokens)
  const matched: string[] = []
  const missing: string[] = []
  const partial: { jdTerm: string; resumeTerm: string }[] = []
  const seen = new Set<string>()

  for (const token of jdTokens) {
    if (seen.has(token)) continue
    seen.add(token)

    if (resumeSet.has(token)) {
      matched.push(token)
      continue
    }

    const variants = SYNONYM_MAP[token]
    if (variants) {
      const found = variants.find(v => resumeSet.has(v))
      if (found) {
        matched.push(token)
        partial.push({ jdTerm: token, resumeTerm: found })
        continue
      }
    }

    for (const [key, vals] of Object.entries(SYNONYM_MAP)) {
      if (vals.includes(token) && resumeSet.has(key)) {
        matched.push(token)
        partial.push({ jdTerm: token, resumeTerm: key })
        continue
      }
    }

    missing.push(token)
  }

  return { matched, missing, partial }
}

/* ═══════════════════════════════════════════
   Phase 1: Multi-Word Skill Phrase Matching
   ═══════════════════════════════════════════ */

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export function extractMultiWordSkills(text: string, skillPhrases: string[]): string[] {
  const lower = text.toLowerCase()
  return skillPhrases.filter(phrase =>
    new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i').test(lower)
  )
}

/* ═══════════════════════════════════════════
   Phase 1: Bullet Audit
   ═══════════════════════════════════════════ */

interface BulletCheckResult {
  fail: boolean
  detail?: string
  fix?: string
}

interface BulletCheck {
  name: string
  check: (bullet: string, index: number, bullets: string[]) => BulletCheckResult | null
  category: 'style' | 'formatting'
  type: 'warning' | 'suggestion'
}

const WEAK_VERB_STARTERS = /^(was|were|been|being|had|has|have|am|is|are|used to|responsible for|worked on|helped with|in charge of|tasked with|participated in|involved in|assisted with|supported|handled|performed|did|made|got|took|gave|went|saw)/i

const STRONG_VERB_SUGGESTIONS = 'Led • Built • Developed • Engineered • Optimized • Delivered • Created • Designed • Implemented • Launched • Drove • Established • Generated • Produced • Transformed • Spearheaded'

function getAlternativeStarters(word: string): string[] {
  const map: Record<string, string[]> = {
    led: ['Built', 'Created', 'Established', 'Drove', 'Directed'],
    built: ['Developed', 'Engineered', 'Architected', 'Constructed', 'Implemented'],
    managed: ['Led', 'Directed', 'Oversaw', 'Spearheaded', 'Coordinated'],
    created: ['Developed', 'Designed', 'Established', 'Founded', 'Initiated'],
    developed: ['Built', 'Engineered', 'Created', 'Designed', 'Implemented'],
    improved: ['Optimized', 'Enhanced', 'Upgraded', 'Streamlined', 'Refined'],
    increased: ['Grew', 'Expanded', 'Scaled', 'Boosted', 'Accelerated'],
  }
  return map[word.toLowerCase()] || ['Led', 'Built', 'Developed', 'Engineered', 'Optimized']
}

const BULLET_CHECKS: BulletCheck[] = [
  {
    name: 'Pronoun usage',
    check: (b) => {
      const m = b.match(/\b(I|my|me|we|our|us)\b/i)
      return m ? { fail: true, detail: b, fix: `Remove "${m[0]}". Rewrite: "${b.replace(/\b(I|my|me|we|our|us)\b/gi, '').trim()}"` } : null
    },
    category: 'style',
    type: 'warning',
  },
  {
    name: 'Weak verb start',
    check: (b) => {
      const clean = b.trim().replace(/^[^\w]+/, '')
      const m = clean.match(WEAK_VERB_STARTERS)
      if (m) {
        return { fail: true, detail: b, fix: `Start with a strong verb: ${STRONG_VERB_SUGGESTIONS}` }
      }
      return null
    },
    category: 'style',
    type: 'suggestion',
  },
  {
    name: 'Missing metrics',
    check: (b) => {
      const hasMetric = /[%$\d]{2,}/.test(b)
      return hasMetric ? null : { fail: true, detail: b, fix: 'Add measurable impact (%, $, numbers, time saved)' }
    },
    category: 'style',
    type: 'suggestion',
  },
  {
    name: 'Bullet too short',
    check: (b) => {
      const words = b.trim().split(/\s+/).length
      return words < 5 ? { fail: true, detail: b, fix: 'Add more detail — who, what, and the impact?' } : null
    },
    category: 'formatting',
    type: 'suggestion',
  },
  {
    name: 'Bullet too long',
    check: (b) => {
      const words = b.trim().split(/\s+/).length
      return words > 35 ? { fail: true, detail: b, fix: 'Split into 2–3 shorter, scannable bullets' } : null
    },
    category: 'formatting',
    type: 'suggestion',
  },
  {
    name: 'Passive voice',
    check: (b) => {
      const m = b.match(/\b(was|were)\s+\w+ed\b/i)
      return m ? { fail: true, detail: b, fix: `Use active voice: replace "${m[0]}" with direct action` } : null
    },
    category: 'style',
    type: 'warning',
  },
  {
    name: 'Same starter as previous',
    check: (b, i, bullets) => {
      if (i === 0) return null
      const prev = bullets[i - 1]?.trim().replace(/^[^\w]+/, '').match(/^\w+/)?.[0]?.toLowerCase()
      const curr = b.trim().replace(/^[^\w]+/, '').match(/^\w+/)?.[0]?.toLowerCase()
      if (prev && curr && prev === curr) {
        const alt = getAlternativeStarters(curr)
        return { fail: true, detail: b, fix: `"${curr}" used in the previous bullet. Try: ${alt.join(', ')}` }
      }
      return null
    },
    category: 'style',
    type: 'suggestion',
  },
]

export function auditBullets(bullets: string[], sectionName: string): AtsIssue[] {
  const issues: AtsIssue[] = []

  bullets.forEach((bullet, i) => {
    BULLET_CHECKS.forEach(check => {
      const result = check.check(bullet, i, bullets)
      if (result?.fail) {
        issues.push({
          id: `bullet-${check.name.replace(/\s+/g, '-').toLowerCase()}-${sectionName}-${i}`,
          type: check.type,
          category: check.category === 'style' ? 'style' : 'formatting',
          issue: `${check.name} in ${sectionName}`,
          fix: result.fix || '',
          section: sectionName,
          bulletIndex: i,
          details: result.detail ? [result.detail] : undefined,
          severityScore: check.type === 'warning' ? 65 : 35,
          autoFixable: false,
        })
      }
    })
  })

  return issues
}

/* ═══════════════════════════════════════════
   Phase 1: evaluateSectionAts() — for PDF templates
   ═══════════════════════════════════════════ */

function extractResumeText(resume: ResumeData): string {
  let text = ''
  if (resume.contact) {
    text += ` ${resume.contact.fullName} ${resume.contact.email} ${resume.contact.phone} ${resume.contact.linkedin} ${resume.contact.location} ${resume.contact.website || ''}`
  }
  text += ` ${resume.summary}`
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
  return text
}

export function evaluateSectionAts(
  sectionId: string,
  resumeData: ResumeData,
  lang?: string
): AtsRatingResult {
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
      if (!resumeData.skills || resumeData.skills.length === 0) {
        return { rating: 'danger', feedback: detectedLang === 'fr' ? 'Ajoutez des compétences pour le ciblage.' : 'List skills to enable keyword indexing.', issues: [] }
      }
      const issues = evaluateSkillsQuality(resumeData)
      if (resumeData.skills.length < 6) {
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


/* ═══════════════════════════════════════════
   Phase 1: 10 Dimension Scoring Functions
   ═══════════════════════════════════════════ */

const DIMENSION_WEIGHTS: Record<string, number> = {
  completeness: 0.15,
  keywords: 0.20,
  semantic: 0.20,
  formatting: 0.15,
  actionVerbs: 0.08,
  quantifiedResults: 0.08,
  contactInfo: 0.04,
  dateConsistency: 0.05,
  length: 0.05,
  bulletQuality: 0.00,
  readability: 0.05,
}

function scoreCompleteness(resume: ResumeData, lang: string): AtsCategoryScore {
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

const JD_STOPWORDS = new Set([
  // Generic management verbs — every resume has these
  'lead', 'leads', 'led', 'manage', 'manages', 'managed', 'develop', 'develops',
  'developed', 'support', 'collaborate', 'build', 'create', 'implement', 'drive',
  'deliver', 'ensure', 'work', 'help', 'strong', 'excellent', 'proven', 'ability',
  'experience', 'team', 'project', 'company', 'client', 'role', 'opportunity',
  // Filler JD words
  'passionate', 'dynamic', 'innovative', 'results', 'fast-paced', 'environment',
  'growth', 'join', 'hiring', 'apply', 'candidate', 'profile', 'responsibilities',
])

function extractMeaningfulKeywords(jdText: string): string[] {
  const tokens = jdText.toLowerCase().match(/\b[a-z][a-z.+#/-]{2,}\b/g) ?? []
  return [...new Set(tokens.filter(t => !JD_STOPWORDS.has(t) && t.length > 3))]
}

export function weightKeyword(keyword: string): 'high' | 'medium' | 'low' {
  const techProperNouns = /^(react|typescript|node\.?js|aws|kubernetes|docker|postgresql|redis|kafka|python|figma|salesforce|hubspot)$/i
  if (techProperNouns.test(keyword)) return 'high'
  if (keyword.length > 7) return 'medium'
  return 'low'
}

function scoreSemantic(resume: ResumeData, jd: string, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 100
  const weight = jd.trim() ? DIMENSION_WEIGHTS.semantic : 0

  if (!jd.trim()) {
    return { key: 'semantic', label: 'Semantic Relevance', score: 0, max, weight, issues }
  }

  const resumeText = extractResumeText(resume)
  const score = computeSemanticRelevance(resumeText, jd)

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

function scoreKeywords(resume: ResumeData, jd: string, lang: string): AtsCategoryScore {
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
    matchedWeight += weightsMap[kw] || 1.0
  }
  for (const p of partial) {
    matchedWeight += (weightsMap[p.jdTerm] || 1.0) * 0.7
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

export function evaluateSkillsQuality(resume: ResumeData): AtsIssue[] {
  const issues: AtsIssue[] = []
  const skills = resume.skills || []
  const skillsRawText = skills.join(' ')
  if (skills.length > 8 && !skillsRawText.includes(':')) {
    issues.push({
      id: 'skills-ungrouped',
      type: 'suggestion',
      category: 'structure',
      issue: `${skills.length} skills listed without categories — harder for ATS to classify.`,
      fix: 'Group skills by category: "Frontend: React, TypeScript | Backend: Node.js | Infra: AWS, Docker"',
      section: 'skills',
      severityScore: 4,
      autoFixable: false,
    })
  }
  return issues
}

function scoreFormatting(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  let score = 20
  const max = 20
  const text = extractResumeText(resume)

  const skillIssues = evaluateSkillsQuality(resume)
  if (skillIssues.length > 0) {
    score = Math.max(0, score - 1)
    issues.push(...skillIssues)
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

function scoreActionVerbs(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 10
  const langVerbs = lang === 'fr' ? FR_STRONG_VERBS : STRONG_VERBS

  let totalBullets = 0
  let goodBullets = 0

  resume.experience.forEach(exp => {
    exp.bullets.forEach(b => {
      totalBullets++
      const clean = b.trim().replace(/^[^\w\u00C0-\u00FF]+/, '')
      const firstWord = clean.split(/\s+/)[0]?.toLowerCase()
      if (firstWord && langVerbs.has(firstWord)) {
        goodBullets++
      }
    })
  })

  if (totalBullets === 0) {
    return { key: 'actionVerbs', label: 'Action Verbs', score: 0, max, weight: DIMENSION_WEIGHTS.actionVerbs, issues: [] }
  }

  const score = Math.round((goodBullets / totalBullets) * max)

  if (score < 8) {
        issues.push({
      id: 'verbs-weak',
      type: 'warning',
      category: 'style',
      issue: lang === 'fr' ? `Verbes d'action faibles (${goodBullets}/${totalBullets} forts)` : `Weak action verbs (${goodBullets}/${totalBullets} strong)`,
      fix: lang === 'fr' ? 'Commencez chaque puce par un verbe fort (Conçu, Optimisé, Piloté, etc.)' : 'Start each bullet with Led, Built, Engineered, Optimized, etc.',
      section: 'experience',
      severityScore: 65,
      autoFixable: true,
    })
  }

  return { key: 'actionVerbs', label: 'Action Verbs', score, max, weight: DIMENSION_WEIGHTS.actionVerbs, issues }
}

function scoreQuantifiedResults(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 10

  let totalBullets = 0
  let quantifiedBullets = 0

  resume.experience.forEach(exp => {
    exp.bullets.forEach(b => {
      totalBullets++
      if (/\b\d+\b|%|\$|million|billion|thousand|k\b/i.test(b)) {
        quantifiedBullets++
      }
    })
  })

  if (totalBullets === 0) {
    return { key: 'quantifiedResults', label: 'Quantified Results', score: 0, max, weight: DIMENSION_WEIGHTS.quantifiedResults, issues: [] }
  }

  const score = Math.round((quantifiedBullets / totalBullets) * max)

  if (score < 5) {
    issues.push({
      id: 'metrics-missing',
      type: 'suggestion',
      category: 'style',
      issue: lang === 'fr' ? `Manque de métriques (${quantifiedBullets}/${totalBullets} avec chiffres)` : `Missing metrics (${quantifiedBullets}/${totalBullets} quantified)`,
      fix: lang === 'fr' ? 'Ajoutez des %, $, ou chiffres pour montrer l\'impact mesurable' : 'Add %, $, or numbers to show measurable impact',
      section: 'experience',
      severityScore: 55,
      autoFixable: false,
    })
  }

  return { key: 'quantifiedResults', label: 'Quantified Results', score, max, weight: DIMENSION_WEIGHTS.quantifiedResults, issues }
}

function scoreContactInfo(resume: ResumeData, lang: string): AtsCategoryScore {
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

    // All contact fields (including website) rendered inline — no orphaned line possible

    // Detect all-caps URLs — ATS encoding risk
    const resumeText = extractResumeText(resume)
    const allCapsUrlPattern = /HTTPS?:\/\/[A-Z0-9./-]+/
    if (allCapsUrlPattern.test(resumeText)) {
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

function scoreDateConsistency(resume: ResumeData, lang: string): AtsCategoryScore {
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
    if (edu.graduationDate) allDates.push(edu.graduationDate)
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
    if (c.date) allDates.push(c.date)
  })
  awards.forEach(a => {
    if (a.date) allDates.push(a.date)
  })
  const projects = resume.projects || []
  projects.forEach(p => {
    if (p.date) allDates.push(p.date)
  })

  if (allDates.length === 0) {
    return { key: 'dateConsistency', label: 'Date Consistency', score: max, max, weight: DIMENSION_WEIGHTS.dateConsistency, issues }
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

function scoreLength(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 5
  const text = extractResumeText(resume)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const years = resume.experience.reduce((sum, e) => {
    const start = parseInt(e.startDate?.split('/')[1] || '0') || 0
    const end = parseInt(e.endDate?.split('/')[1] || '0') || 0
    return sum + Math.max(0, end - start)
  }, 0)

  let target: string
  let score: number

  if (years <= 5) {
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
  const { page2Sections } = getPageBreakSections(resume, defaultSectionOrder)
  const page2SectionCount = page2Sections.length

  if (page2SectionCount > 0 && page2SectionCount < 3) {
    score = Math.max(1, score - 1) // Deduct 1 point for sparse page layout
    issues.push({
      id: 'page2-sparse',
      type: 'warning',
      category: 'structure',
      issue: `Page 2 contains only ${page2SectionCount} section(s) — wastes most of the page.`,
      fix: 'Move Certifications and Volunteer to bottom of page 1, or add more content to justify a second page. A near-empty page 2 signals poor layout to human reviewers.',
      severityScore: 8,
      autoFixable: false,
    })
  }

  return { key: 'length', label: 'Length', score, max, weight: DIMENSION_WEIGHTS.length, issues }
}

function scoreBulletQuality(resume: ResumeData): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 5
  const TOO_LONG_CHARS = 180 // ~2 lines at typical resume width

  let index = 0
  resume.experience.forEach(exp => {
    const bulletIssues = auditBullets(exp.bullets, 'experience')
    issues.push(...bulletIssues)

    exp.bullets.forEach(bullet => {
      const charCount = bullet.length
      if (charCount > TOO_LONG_CHARS) {
        issues.push({
          id: `bullet-wraps-${index}`,
          type: 'suggestion',
          category: 'style',
          issue: `Bullet is quite long (${charCount} chars) and may be hard to scan quickly.`,
          fix: 'Split into two bullets: one for the action/method, one for the quantified result.',
          section: 'experience',
          bulletIndex: index,
          details: [bullet],
          severityScore: 2,
          autoFixable: false,
        })
      }
      index++
    })
  })

  const issueCount = issues.filter(i => i.type === 'warning').length * 2 + issues.filter(i => i.type === 'suggestion').length
  const raw = Math.max(0, max - issueCount * 0.5)
  const score = Math.round(Math.max(0, Math.min(max, raw)))

  return { key: 'bulletQuality', label: 'Bullet Quality', score, max, weight: DIMENSION_WEIGHTS.bulletQuality, issues }
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  const vowels = word.match(/[aeiouy]+/g)
  return vowels ? Math.max(1, vowels.length) : 1
}

function scoreReadability(resume: ResumeData, lang: string): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 5
  const text = extractResumeText(resume)
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length || 1
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0)

  const fkgl = 0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59

  // Flesch-Kincaid grade scoring (in the readability evaluator)
  const readabilityScore = (gradeLevel: number): number => {
    if (gradeLevel <= 10) return 5       // ideal: grade 8-10
    if (gradeLevel <= 12) return 4       // acceptable
    if (gradeLevel <= 14) return 3       // warning zone
    if (gradeLevel <= 16) return 1.5     // poor — Grade 17 current score
    return 0                             // unusable for NLP parsing
  }

  const gradeLevel = Math.floor(fkgl)
  const score = readabilityScore(gradeLevel)

  if (fkgl > 14) {
    issues.push({
      id: 'readability-complex',
      type: 'suggestion',
      category: 'style',
      issue: lang === 'fr' ? 'CV trop complexe (niveau > 14)' : 'Resume too complex (grade > 14)',
      fix: lang === 'fr' ? 'Utilisez un langage plus simple. Remplacez le jargon par des termes courants.' : 'Use simpler language. Replace jargon with plain terms.',
      severityScore: 25,
      autoFixable: false,
    })
  } else if (fkgl < 8) {
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

/* ═══════════════════════════════════════════
   Phase 1: Weighted Total + generateAtsReport()
   ═══════════════════════════════════════════ */

function calculateTotal(categories: AtsCategoryScore[]): number {
  let weighted = 0
  let totalWeight = 0
  for (const cat of categories) {
    const pct = cat.max > 0 ? cat.score / cat.max : 0
    weighted += pct * cat.weight * 100
    totalWeight += cat.weight
  }
  return Math.round(totalWeight > 0 ? weighted / totalWeight : 0)
}

function getGrade(total: number): { grade: string; gradeLabel: string } {
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
  const length = scoreLength(resume, lang)
  const bulletQuality = scoreBulletQuality(resume)
  const readability = scoreReadability(resume, lang)

  const categories = [
    completeness, keywords, semantic, formatting, actionVerbs,
    quantifiedResults, contactInfo, dateConsistency, length,
    bulletQuality, readability,
  ]

  let total = calculateTotal(categories)
  const resumeClassification = classifyDomain(text)
  const jdClassification = classifyDomain(jd)
  const domainPenalty = computeDomainPenalty(resumeClassification.domain, jdClassification.domain)
  total = Math.max(0, total + domainPenalty)
  if (domainPenalty <= -35) {
    total = Math.min(total, 55)
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
    ...(resume.skills.length ? ['x'] : []),
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

/* ═══════════════════════════════════════════
   Phase 2: Industry Profiles
   ═══════════════════════════════════════════ */

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

  // Fallback: detect from resume if it has project sections (likely tech)
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

/* ═══════════════════════════════════════════
   Phase 2: ATS Parseability Score
   ═══════════════════════════════════════════ */

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
        id: `parseability-section-${section.key}`,
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

/* ═══════════════════════════════════════════
   Phase 2: Incremental / Cached Scoring
   ═══════════════════════════════════════════ */

export interface ScoreCache {
  version: number
  resumeHash: string
  jdHash: string
  sectionHashes: Record<string, string>
  report: AtsReport
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

function buildSectionHashes(resume: ResumeData): Record<string, string> {
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

export function incrementalScore(
  resumeData: ResumeData,
  jd: string,
  cache: ScoreCache | null
): { report: AtsReport; newCache: ScoreCache; changed: string[] } {
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

/* ═══════════════════════════════════════════
   Phase 2: Timeline History (localStorage)
   ═══════════════════════════════════════════ */

const HISTORY_KEY = 'ats-score-history'
const MAX_HISTORY = 30

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

/* ═══════════════════════════════════════════
   Phase 2: Enhanced generateAtsReportV2()
   ═══════════════════════════════════════════ */

export function generateAtsReportV2(
  resume: ResumeData,
  jd: string,
  previousReport?: AtsReport | null
): AtsReport {
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
  const length = scoreLength(resume, lang)
  const bulletQuality = scoreBulletQuality(resume)
  const readability = scoreReadability(resume, lang)

  let categories: AtsCategoryScore[] = [
    completeness, keywords, semantic, formatting, actionVerbs,
    quantifiedResults, contactInfo, dateConsistency, length,
    bulletQuality, readability,
  ]

  // Apply industry-specific weight adjustments
  if (profile) {
    categories = applyProfileAdjustments(categories, profile)
  }

  // Parseability
  const { score: atsParseability, issues: parseabilityIssues } = scoreAtsParseability(resume)

  // Add parseability as an 11th dimension, or just add its issues
    // We don't add parseability as a separate category, just pass its issues

  let total = calculateTotal(categories)
  const resumeClassification = classifyDomain(text)
  const jdClassification = classifyDomain(jd)
  const domainPenalty = computeDomainPenalty(resumeClassification.domain, jdClassification.domain)
  total = Math.max(0, total + domainPenalty)
  if (domainPenalty <= -35) {
    total = Math.min(total, 55)
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
    ...(resume.skills.length ? ['x'] : []),
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

  // Compute semantic score (TF-IDF style)
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


