import type { ResumeData, AtsIssue, AtsCategoryScore } from '../types/resume'
import { toDomId } from './atsUtils'
import {
  WEAK_VERB_STARTERS,
  FR_WEAK_VERB_STARTERS,
  STRONG_VERB_SUGGESTIONS,
  FR_STRONG_VERB_SUGGESTIONS,
  STRONG_VERBS,
  FR_STRONG_VERBS,
  EN_PRONOUNS_REGEX,
  FR_PRONOUNS_REGEX,
  DIMENSION_WEIGHTS
} from './atsConstants'

export function getAlternativeStarters(word: string, lang: 'en' | 'fr' = 'en'): string[] {
  if (lang === 'fr') {
    const map: Record<string, string[]> = {
      dirigé: ['Piloté', 'Conduit', 'Supervisé', 'Géré', 'Coordonné'],
      conçu: ['Créé', 'Développé', 'Bâti', 'Réalisé', 'Implémenté'],
      géré: ['Piloté', 'Supervisé', 'Dirigé', 'Coordonné', 'Organisé'],
      créé: ['Développé', 'Conçu', 'Bâti', 'Lancé', 'Établi'],
      développé: ['Conçu', 'Créé', 'Bâti', 'Réalisé', 'Implémenté'],
      amélioré: ['Optimisé', 'Structuré', 'Simplifié', 'Modernisé', 'Revitalisé'],
      accru: ['Développé', 'Augmenté', 'Généré', 'Propulsé', 'Accéléré'],
    }
    return map[word.toLowerCase()] || ['Piloté', 'Conçu', 'Développé', 'Géré', 'Optimisé']
  }
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

interface BulletCheckResult {
  fail: boolean
  detail?: string
  fix?: string
}

interface BulletCheck {
  name: string
  check: (bullet: string, index: number, bullets: string[], lang: 'en' | 'fr') => BulletCheckResult | null
  category: 'style' | 'formatting'
  type: 'warning' | 'suggestion'
}

const BULLET_CHECKS: BulletCheck[] = [
  {
    name: 'Pronoun usage',
    check: (b, _i, _bs, lang) => {
      const regex = lang === 'fr' ? FR_PRONOUNS_REGEX : EN_PRONOUNS_REGEX
      const m = b.match(regex)
      if (m) {
        return {
          fail: true,
          detail: b,
          fix: lang === 'fr'
            ? `Supprimez "${m[0]}". Rédigez sans pronom personnel.`
            : `Remove "${m[0]}". Rewrite: "${b.replace(new RegExp(regex.source, 'gi'), '').trim()}"`
        }
      }
      return null
    },
    category: 'style',
    type: 'warning',
  },
  {
    name: 'Weak verb start',
    check: (b, _i, _bs, lang) => {
      const clean = b.trim().replace(/^[^\w\u00C0-\u00FF]+/, '')
      const regex = lang === 'fr' ? FR_WEAK_VERB_STARTERS : WEAK_VERB_STARTERS
      const m = clean.match(regex)
      if (m) {
        return {
          fail: true,
          detail: b,
          fix: lang === 'fr'
            ? `Commencez par un verbe d'action fort: ${FR_STRONG_VERB_SUGGESTIONS}`
            : `Start with a strong verb: ${STRONG_VERB_SUGGESTIONS}`
        }
      }
      return null
    },
    category: 'style',
    type: 'suggestion',
  },
  {
    name: 'Missing metrics',
    check: (b, _i, _bs, lang) => {
      const hasMetric = /[%$\d]{2,}/.test(b)
      if (hasMetric) return null
      return {
        fail: true,
        detail: b,
        fix: lang === 'fr'
          ? 'Ajoutez un impact mesurable (%, $, chiffres, temps gagné)'
          : 'Add measurable impact (%, $, numbers, time saved)'
      }
    },
    category: 'style',
    type: 'suggestion',
  },
  {
    name: 'Bullet too short',
    check: (b, _i, _bs, lang) => {
      const words = b.trim().split(/\s+/).length
      if (words >= 5) return null
      return {
        fail: true,
        detail: b,
        fix: lang === 'fr'
          ? 'Ajoutez plus de détails — qui, quoi, et l\'impact ?'
          : 'Add more detail — who, what, and the impact?'
      }
    },
    category: 'formatting',
    type: 'suggestion',
  },
  {
    name: 'Bullet too long',
    check: (b, _i, _bs, lang) => {
      const words = b.trim().split(/\s+/).length
      if (words <= 35) return null
      return {
        fail: true,
        detail: b,
        fix: lang === 'fr'
          ? 'Divisez en 2 ou 3 puces plus courtes et faciles à lire'
          : 'Split into 2–3 shorter, scannable bullets'
      }
    },
    category: 'formatting',
    type: 'suggestion',
  },
  {
    name: 'Passive voice',
    check: (b, _i, _bs, lang) => {
      if (lang === 'fr') {
        const m = b.match(/\b(a\s+été|ont\s+été|fut|furent)\s+\w+(é|és|ée|ées)\b/i)
        return m ? { fail: true, detail: b, fix: `Utilisez la voix active : remplacez "${m[0]}" par une action directe` } : null
      }
      const m = b.match(/\b(was|were)\s+\w+ed\b/i)
      return m ? { fail: true, detail: b, fix: `Use active voice: replace "${m[0]}" with direct action` } : null
    },
    category: 'style',
    type: 'warning',
  },
  {
    name: 'Same starter as previous',
    check: (b, i, bullets, lang) => {
      if (i === 0) return null
      const prev = bullets[i - 1]?.trim().replace(/^[^\w\u00C0-\u00FF]+/, '').match(/^\w+/)?.[0]?.toLowerCase()
      const curr = b.trim().replace(/^[^\w\u00C0-\u00FF]+/, '').match(/^\w+/)?.[0]?.toLowerCase()
      if (prev && curr && prev === curr) {
        const alt = getAlternativeStarters(curr, lang)
        return {
          fail: true,
          detail: b,
          fix: lang === 'fr'
            ? `"${curr}" utilisé dans la puce précédente. Essayez : ${alt.join(', ')}`
            : `"${curr}" used in the previous bullet. Try: ${alt.join(', ')}`
        }
      }
      return null
    },
    category: 'style',
    type: 'suggestion',
  },
]

export function auditBullets(bullets: string[], sectionName: string, lang: 'en' | 'fr' = 'en'): AtsIssue[] {
  const issues: AtsIssue[] = []

  bullets.forEach((bullet, i) => {
    BULLET_CHECKS.forEach(check => {
      const result = check.check(bullet, i, bullets, lang)
      if (result?.fail) {
        issues.push({
          id: `bullet-${check.name.replace(/\s+/g, '-').toLowerCase()}-${toDomId(sectionName)}-${i}`,
          type: check.type,
          category: check.category === 'style' ? 'style' : 'formatting',
          issue: lang === 'fr' ? `${check.name} dans ${sectionName}` : `${check.name} in ${sectionName}`,
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

export function scoreBulletQuality(resume: ResumeData, lang: 'en' | 'fr' = 'en'): AtsCategoryScore {
  const issues: AtsIssue[] = []
  const max = 5
  const TOO_LONG_CHARS = 180 // ~2 lines at typical resume width

  let index = 0
  resume.experience.forEach(exp => {
    const bulletIssues = auditBullets(exp.bullets, 'experience', lang)
    issues.push(...bulletIssues)

    exp.bullets.forEach(bullet => {
      const charCount = bullet.length
      if (charCount > TOO_LONG_CHARS) {
        issues.push({
          id: `bullet-wraps-${index}`,
          type: 'suggestion',
          category: 'style',
          issue: lang === 'fr'
            ? `La puce est assez longue (${charCount} caract.) et peut être difficile à lire rapidement.`
            : `Bullet is quite long (${charCount} chars) and may be hard to scan quickly.`,
          fix: lang === 'fr'
            ? 'Divisez en deux puces : une pour l\'action, une pour le résultat chiffré.'
            : 'Split into two bullets: one for the action/method, one for the quantified result.',
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

  return { key: 'bulletQuality', label: lang === 'fr' ? 'Qualité des puces' : 'Bullet Quality', score, max, weight: DIMENSION_WEIGHTS.bulletQuality, issues }
}

export function scoreActionVerbs(resume: ResumeData, lang: string): AtsCategoryScore {
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

  if (score < 5) {
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

export function scoreQuantifiedResults(resume: ResumeData, lang: string): AtsCategoryScore {
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
