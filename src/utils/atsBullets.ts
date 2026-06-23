import type { ResumeData, AtsIssue, AtsCategoryScore } from '../types/resume'
import { toDomId } from './atsUtils'
import {
  WEAK_VERB_STARTERS,
  STRONG_VERB_SUGGESTIONS,
  STRONG_VERBS,
  FR_STRONG_VERBS,
  DIMENSION_WEIGHTS
} from './atsConstants'

export function getAlternativeStarters(word: string): string[] {
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
  check: (bullet: string, index: number, bullets: string[]) => BulletCheckResult | null
  category: 'style' | 'formatting'
  type: 'warning' | 'suggestion'
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
          id: `bullet-${check.name.replace(/\s+/g, '-').toLowerCase()}-${toDomId(sectionName)}-${i}`,
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

export function scoreBulletQuality(resume: ResumeData): AtsCategoryScore {
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
