import type { ResumeData, AtsScore } from '../types/resume'

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
const MESSAGES = {
  en: {
    missingSection: (s: string) => `Missing or empty section: ${s}`,
    missingSectionFix: (s: string) => `Add content to your ${s} section. ATS scanners require all key sections to parse your resume.`,
    allSectionsPresent: 'All 5 core sections present',
    highKeywordMatch: (score: number) => `High keyword match (${score}/25 pts)`,
    lowKeywordMatch: (found: number, total: number) => `Low job keyword match (${found}/${total} words found)`,
    lowKeywordMatchFix: (sample: string) => `Tailor your resume by adding keywords from the job description, such as: "${sample}".`,
    noJd: 'No target job description provided',
    noJdFix: 'Paste a job description in the "Target Job Description" box to analyze keyword matching and improve your score.',
    specialChars: 'Non-standard symbols or special characters found (e.g. ★, ✓, ►, ◆)',
    specialCharsFix: 'Remove symbols like checkboxes, stars, or fancy arrows. ATS parsers often scramble these characters.',
    noSpecialChars: 'No ATS-breaking symbols',
    pronouns: 'First-person pronouns found (e.g., "I", "me", "my", "we")',
    pronounsFix: 'Rewrite sentences to omit personal pronouns. Instead of "I managed a team", write "Managed a team of..."',
    noPronouns: 'Pronoun-free professional style',
    missingHeadings: 'Missing key professional headings',
    missingHeadingsFix: 'Ensure your resume explicitly contains sections named "Experience", "Education", and "Skills".',
    inconsistentDates: 'Inconsistent or invalid date formatting',
    inconsistentDatesFix: 'Format all dates uniformly as MM/YYYY (e.g. "05/2021") or Month YYYY (e.g. "May 2021"). Avoid mixing styles.',
    strongActionVerbs: 'Strong action-oriented phrasing',
    weakActionVerbs: (good: number, total: number) => `Weak action verbs in bullet points (${good}/${total} pass)`,
    weakActionVerbsFix: 'Start every bullet point in your work experience with a strong action verb (e.g. "Engineered", "Optimized", "Led").',
    noBullets: 'No bullet points in work experience',
    noBulletsFix: 'Add descriptive bullet points to your work experience roles starting with action verbs.',
    quantifiedAchievements: 'Quantified achievements present',
    lackMetrics: (quant: number, total: number) => `Achievements lack metrics or numbers (${quant}/${total} quantified)`,
    lackMetricsFix: 'Add metrics (%, $, numbers, timelines) to show the concrete impact of your work (e.g. "Increased revenue by 15%").',
    contactComplete: 'Contact info complete',
    contactIncomplete: 'Incomplete contact information',
    contactIncompleteFix: (missing: string) => `Provide your: ${missing}. Contact details are essential for recruiters.`,
    consistentDates: 'Consistent date formats throughout',
    lengthShort: (words: number) => `Resume length is too short (${words} words)`,
    lengthShortFix: 'Expand your experience and project descriptions to reach at least 300-400 words to give enough context.',
    lengthLong: (words: number, target: string) => `Resume is too long for your experience (${words} words, target is under ${target} words)`,
    lengthLongFix: (target: string) => `Condense your bullet points. Keep your resume under ${target} words.`,
    lengthOptimal: (target: string) => `Optimal resume length (${target})`,
  },
  fr: {
    missingSection: (s: string) => `Section manquante ou vide : ${s}`,
    missingSectionFix: (s: string) => `Ajoutez du contenu à votre section ${s}. Les systèmes ATS ont besoin de toutes les sections clés pour analyser votre parcours.`,
    allSectionsPresent: 'Les 5 sections principales sont présentes',
    highKeywordMatch: (score: number) => `Forte correspondance de mots-clés (${score}/25 pts)`,
    lowKeywordMatch: (found: number, total: number) => `Faible correspondance de mots-clés du poste (${found}/${total} mots trouvés)`,
    lowKeywordMatchFix: (sample: string) => `Personnalisez votre CV en ajoutant des mots-clés de la description de poste, tels que : "${sample}".`,
    noJd: 'Aucune description de poste cible fournie',
    noJdFix: 'Collez une description de poste dans la boîte "Target Job Description" pour analyser la correspondance des mots-clés et améliorer votre score.',
    specialChars: 'Symboles non standards ou caractères spéciaux trouvés (ex. ★, ✓, ►, ◆)',
    specialCharsFix: 'Supprimez les symboles comme les cases à cocher, les étoiles ou les flèches fantaisies. Les parseurs ATS les dégradent souvent.',
    noSpecialChars: 'Aucun symbole bloquant pour les ATS',
    pronouns: 'Pronoms de la première personne trouvés (ex. "je", "moi", "mon", "nous")',
    pronounsFix: 'Réécrivez les phrases pour omettre les pronoms personnels. Au lieu de "J\'ai géré une équipe", écrivez "Gestion d\'une équipe de..."',
    noPronouns: 'Style professionnel sans pronoms personnels',
    missingHeadings: 'Titres professionnels clés manquants',
    missingHeadingsFix: 'Assurez-vous que votre CV contient explicitement des sections nommées "Expérience", "Éducation" et "Skills" ou équivalent.',
    inconsistentDates: 'Formatage des dates incohérent ou invalide',
    inconsistentDatesFix: 'Formatez toutes les dates de manière uniforme en MM/AAAA (ex. "05/2021") ou Mois AAAA (ex. "Mai 2021"). Évitez de mélanger les styles.',
    strongActionVerbs: 'Phrasé axé sur l\'action fort',
    weakActionVerbs: (good: number, total: number) => `Verbes d'action faibles dans les puces (${good}/${total} valides)`,
    weakActionVerbsFix: 'Commencez chaque puce de votre expérience professionnelle par un verbe d\'action fort (ex. "Conçu", "Optimisé", "Dirigé").',
    noBullets: 'Aucune puce dans l\'expérience professionnelle',
    noBulletsFix: 'Ajoutez des puces descriptives à vos rôles d\'expérience professionnelle en commençant par des verbes d\'action.',
    quantifiedAchievements: 'Réalisations chiffrées présentes',
    lackMetrics: (quant: number, total: number) => `Les réalisations manquent de métriques ou de chiffres (${quant}/${total} chiffrées)`,
    lackMetricsFix: 'Ajoutez des indicateurs (%, $, chiffres, délais) pour montrer l\'impact concret de votre travail (ex. "Augmentation du chiffre d\'affaires de 15%").',
    contactComplete: 'Coordonnées complètes',
    contactIncomplete: 'Coordonnées incomplètes',
    contactIncompleteFix: (missing: string) => `Renseignez vos : ${missing}. Les coordonnées sont essentielles pour les recruteurs.`,
    consistentDates: 'Formats de date cohérents partout',
    lengthShort: (words: number) => `La longueur du CV est trop courte (${words} mots)`,
    lengthShortFix: 'Développez vos descriptions d\'expériences et de projets pour atteindre au moins 300 à 400 mots afin de donner assez de contexte.',
    lengthLong: (words: number, target: string) => `Le CV est trop long pour votre expérience (${words} mots, la cible est moins de ${target} mots)`,
    lengthLongFix: (target: string) => `Condensez vos puces. Gardez votre CV sous ${target} mots.`,
    lengthOptimal: (target: string) => `Longueur de CV optimale (${target})`,
  }
}

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

export function evaluateResume(resume: ResumeData, jobDescription: string): AtsScore & { language: 'en' | 'fr' } {
  // Compile full resume text for language detection and checks
  let fullResumeText = ''
  if (resume.contact) {
    fullResumeText += ` ${resume.contact.fullName} ${resume.contact.email} ${resume.contact.phone} ${resume.contact.linkedin} ${resume.contact.location} ${resume.contact.website || ''}`
  }
  fullResumeText += ` ${resume.summary}`
  resume.experience.forEach((exp) => {
    fullResumeText += ` ${exp.jobTitle} ${exp.company} ${exp.location} ${exp.bullets.join(' ')}`
  })
  resume.education.forEach((edu) => {
    fullResumeText += ` ${edu.degree} ${edu.school} ${edu.location}`
  })
  fullResumeText += ` ${resume.skills.join(' ')}`
  if (resume.projects) {
    resume.projects.forEach((proj) => {
      fullResumeText += ` ${proj.name} ${proj.description} ${proj.technologies.join(' ')}`
    })
  }
  const lowerResume = fullResumeText.toLowerCase()

  // Detect Language
  const lang = detectLanguage(fullResumeText)
  const dict = MESSAGES[lang]
  const langStopwords = lang === 'fr' ? FR_STOPWORDS : STOPWORDS
  const langVerbs = lang === 'fr' ? FR_STRONG_VERBS : STRONG_VERBS
  const langPronounRegex = lang === 'fr' ? FR_PRONOUNS_REGEX : EN_PRONOUNS_REGEX

  const passing: string[] = []
  const failing: { issue: string; fix: string }[] = []

  // 1. Section Completeness (Max 20 pts)
  let sectionCompleteness = 0
  const completenessChecks = {
    contact: resume.contact && resume.contact.fullName.trim() !== '',
    summary: resume.summary && resume.summary.trim() !== '',
    experience: resume.experience && resume.experience.length > 0,
    education: resume.education && resume.education.length > 0,
    skills: resume.skills && resume.skills.length > 0,
  }

  Object.entries(completenessChecks).forEach(([section, present]) => {
    if (present) {
      sectionCompleteness += 4
    } else {
      failing.push({
        issue: dict.missingSection(section),
        fix: dict.missingSectionFix(section),
      })
    }
  })
  if (sectionCompleteness === 20) {
    passing.push(dict.allSectionsPresent)
  }

  // 2. Keyword Match (Max 25 pts)
  let keywordMatch = 0
  let matchedKeywordsCount = 0

  if (jobDescription.trim() !== '') {
    const jdWords = getWords(jobDescription)
    // Filter out language stopwords and get unique keywords
    const uniqueJdKeywords = Array.from(new Set(jdWords.filter((w) => !langStopwords.has(w))))
    const totalKeywords = uniqueJdKeywords.length

    if (totalKeywords > 0) {
      const matchedKeywordsList: string[] = []
      const missingKeywordsList: string[] = []

      uniqueJdKeywords.forEach((kw) => {
        if (lowerResume.includes(kw)) {
          matchedKeywordsCount++
          matchedKeywordsList.push(kw)
        } else {
          missingKeywordsList.push(kw)
        }
      })

      keywordMatch = Math.round((matchedKeywordsCount / totalKeywords) * 25)
      
      if (keywordMatch >= 20) {
        passing.push(dict.highKeywordMatch(keywordMatch))
      } else {
        const sampleMissing = missingKeywordsList.slice(0, 5).join(', ')
        failing.push({
          issue: dict.lowKeywordMatch(matchedKeywordsCount, totalKeywords),
          fix: dict.lowKeywordMatchFix(sampleMissing),
        })
      }
    }
  } else {
    failing.push({
      issue: dict.noJd,
      fix: dict.noJdFix,
    })
  }

  // 3. Formatting Safety (Max 20 pts)
  let formattingSafety = 20

  // 3a. Special chars (★ ✓ ► ◆)
  const forbiddenCharsRegex = /[★✓►◆■●▪▲▼◆◇○◎●★☆]/g
  const hasSpecialChars = forbiddenCharsRegex.test(fullResumeText)
  if (hasSpecialChars) {
    formattingSafety -= 5
    failing.push({
      issue: dict.specialChars,
      fix: dict.specialCharsFix,
    })
  } else {
    passing.push(dict.noSpecialChars)
  }

  // 3b. Personal pronouns
  const hasPronouns = langPronounRegex.test(resume.summary) || resume.experience.some((exp) => exp.bullets.some((b) => langPronounRegex.test(b)))
  if (hasPronouns) {
    formattingSafety -= 5
    failing.push({
      issue: dict.pronouns,
      fix: dict.pronounsFix,
    })
  } else {
    passing.push(dict.noPronouns)
  }

  // 3c. Missing standard sections
  const hasStandardSections = completenessChecks.experience && completenessChecks.education && completenessChecks.skills
  if (!hasStandardSections) {
    formattingSafety -= 5
    failing.push({
      issue: dict.missingHeadings,
      fix: dict.missingHeadingsFix,
    })
  }

  // 3d. Date formatting inconsistencies
  let dateConsistencyIssue = false
  const allDates: string[] = []
  resume.experience.forEach((exp) => {
    if (exp.startDate) allDates.push(exp.startDate)
    if (exp.endDate) allDates.push(exp.endDate)
  })
  resume.education.forEach((edu) => {
    if (edu.graduationDate) allDates.push(edu.graduationDate)
  })

  const formats = allDates.map((d) => detectDateFormat(d, lang))
  const invalidDates = formats.filter((f) => f === 'Invalid')
  const uniqueFormats = Array.from(new Set(formats.filter((f) => f !== 'Invalid')))

  if (invalidDates.length > 0 || uniqueFormats.length > 1) {
    formattingSafety -= 5
    dateConsistencyIssue = true
    failing.push({
      issue: dict.inconsistentDates,
      fix: dict.inconsistentDatesFix,
    })
  }

  // 4. Action Verbs (Max 10 pts)
  let actionVerbs = 0
  let totalBullets = 0
  let goodBullets = 0

  resume.experience.forEach((exp) => {
    exp.bullets.forEach((b) => {
      totalBullets++
      const cleanBullet = b.trim().replace(/^[^\w\u00C0-\u00FF]+/, '') // strip leading bullet symbols
      const firstWord = cleanBullet.split(/\s+/)[0]?.toLowerCase()
      if (firstWord && langVerbs.has(firstWord)) {
        goodBullets++
      }
    })
  })

  if (totalBullets > 0) {
    actionVerbs = Math.round((goodBullets / totalBullets) * 10)
    if (actionVerbs >= 8) {
      passing.push(dict.strongActionVerbs)
    } else {
      failing.push({
        issue: dict.weakActionVerbs(goodBullets, totalBullets),
        fix: dict.weakActionVerbsFix,
      })
    }
  } else if (completenessChecks.experience) {
    failing.push({
      issue: dict.noBullets,
      fix: dict.noBulletsFix,
    })
  }

  // 5. Quantified Results (Max 10 pts)
  let quantifiedResults = 0
  let quantifiedBullets = 0

  resume.experience.forEach((exp) => {
    exp.bullets.forEach((b) => {
      if (/\b\d+\b|%|\$|million|billion|thousand|k\b/i.test(b) || (lang === 'fr' && /millions|milliards|k\b/i.test(b))) {
        quantifiedBullets++
      }
    })
  })

  if (totalBullets > 0) {
    quantifiedResults = Math.round((quantifiedBullets / totalBullets) * 10)
    if (quantifiedResults >= 5) {
      passing.push(dict.quantifiedAchievements)
    } else {
      failing.push({
        issue: dict.lackMetrics(quantifiedBullets, totalBullets),
        fix: dict.lackMetricsFix,
      })
    }
  }

  // 6. Contact Info (Max 5 pts)
  let contactInfo = 0
  if (resume.contact) {
    if (resume.contact.fullName?.trim()) contactInfo += 1
    if (resume.contact.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.contact.email)) contactInfo += 1
    if (resume.contact.phone?.trim()) contactInfo += 1
    if (resume.contact.linkedin?.trim()) contactInfo += 1
    if (resume.contact.location?.trim()) contactInfo += 1
  }

  if (contactInfo === 5) {
    passing.push(dict.contactComplete)
  } else {
    const missing = []
    if (!resume.contact?.fullName?.trim()) missing.push(lang === 'fr' ? 'nom complet' : 'full name')
    if (!resume.contact?.email?.trim()) missing.push('email')
    if (!resume.contact?.phone?.trim()) missing.push(lang === 'fr' ? 'téléphone' : 'phone')
    if (!resume.contact?.linkedin?.trim()) missing.push('LinkedIn')
    if (!resume.contact?.location?.trim()) missing.push(lang === 'fr' ? 'localisation' : 'location')

    failing.push({
      issue: dict.contactIncomplete,
      fix: dict.contactIncompleteFix(missing.join(', ')),
    })
  }

  // 7. Date Consistency (Max 5 pts)
  let dateConsistency = 5
  if (dateConsistencyIssue) {
    dateConsistency = 0
  } else if (allDates.length > 0) {
    passing.push(dict.consistentDates)
  }

  // 8. Length Appropriateness (Max 5 pts)
  let lengthAppropriateness = 5
  const wordCount = lowerResume.split(/\s+/).filter((w) => w.length > 0).length
  const estimatedYears = resume.experience.length * 2 
  
  if (estimatedYears <= 5) {
    if (wordCount < 250) {
      lengthAppropriateness = 2
      failing.push({
        issue: dict.lengthShort(wordCount),
        fix: dict.lengthShortFix,
      })
    } else if (wordCount > 750) {
      lengthAppropriateness = 3
      failing.push({
        issue: dict.lengthLong(wordCount, '700'),
        fix: () => dict.lengthLongFix('1 page (700)'),
      } as any)
    } else {
      passing.push(dict.lengthOptimal('1 page'))
    }
  } else {
    if (wordCount < 400) {
      lengthAppropriateness = 3
      failing.push({
        issue: dict.lengthShort(wordCount),
        fix: dict.lengthShortFix,
      })
    } else if (wordCount > 1300) {
      lengthAppropriateness = 2
      failing.push({
        issue: dict.lengthLong(wordCount, '1200'),
        fix: () => dict.lengthLongFix('2 pages (1200)'),
      } as any)
    } else {
      passing.push(dict.lengthOptimal('1-2 pages'))
    }
  }

  // Total Score (Max 100)
  const total = sectionCompleteness + keywordMatch + formattingSafety + actionVerbs + quantifiedResults + contactInfo + dateConsistency + lengthAppropriateness

  let grade: string
  if (total >= 90) grade = 'Excellent (A)'
  else if (total >= 70) grade = 'Good (B)'
  else if (total >= 50) grade = 'Needs Work (C)'
  else grade = 'Poor (F)'

  return {
    total,
    grade,
    sections: {
      sectionCompleteness,
      keywordMatch,
      formattingSafety,
      actionVerbs,
      quantifiedResults,
      contactInfo,
      dateConsistency,
      lengthAppropriateness,
    },
    passing,
    failing: failing.map(item => ({
      issue: item.issue,
      fix: typeof item.fix === 'function' ? (item.fix as any)() : item.fix
    })),
    language: lang
  }
}

export function autoFix(resume: ResumeData): ResumeData {
  const fixed = JSON.parse(JSON.stringify(resume)) as ResumeData
  
  // Compile content to detect language
  let testText = resume.summary
  resume.experience.forEach(exp => {
    testText += ` ${exp.bullets.join(' ')}`
  })
  const lang = detectLanguage(testText)
  const pronounRegex = lang === 'fr' ? FR_PRONOUNS_REGEX : EN_PRONOUNS_REGEX

  const removePronouns = (text: string): string => {
    if (!text) return ''
    return text
      .replace(new RegExp(pronounRegex.source, 'gi'), '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  const standardizeDate = (date: string): string => {
    if (!date) return ''
    const months: Record<string, string> = {
      // English
      january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
      july:'07', august:'08', september:'09', october:'10', november:'11', december:'12',
      jan:'01', feb:'02', mar:'03', apr:'04', jun:'06', jul:'07', aug:'08',
      sep:'09', oct:'10', nov:'11', dec:'12',
      // French
      janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06',
      juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12',
      janv: '01', févr: '02', avr: '04', juil: '07', aoû: '08', sept: '09', déc: '12'
    }
    
    const longMatch = date.trim().match(
      /(\w+)\s+(20\d{2}|19\d{2})/i
    )
    if (longMatch) {
      const m = months[longMatch[1].toLowerCase()]
      if (m) return `${m}/${longMatch[2]}`
    }
    if (/^\d{2}\/\d{4}$/.test(date.trim())) return date.trim()
    return date
  }

  const cleanSpecialChars = (text: string): string => {
    if (!text) return ''
    return text.replace(/[★✓►◆•‣⁃■●▪▲▼◇○◎●★☆]/g, '-')
  }

  fixed.summary = removePronouns(fixed.summary)

  fixed.experience = fixed.experience.map(exp => ({
    ...exp,
    startDate: standardizeDate(exp.startDate),
    endDate: standardizeDate(exp.endDate),
    bullets: exp.bullets.map(b => cleanSpecialChars(removePronouns(b))),
  }))

  fixed.education = fixed.education.map(edu => ({
    ...edu,
    graduationDate: standardizeDate(edu.graduationDate),
  }))

  if (fixed.projects) {
    fixed.projects = fixed.projects.map(proj => ({
      ...proj,
      description: removePronouns(proj.description),
    }))
  }

  return fixed
}
