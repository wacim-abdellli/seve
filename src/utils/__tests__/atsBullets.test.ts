import { describe, it, expect } from 'vitest'
import { auditBullets, scoreActionVerbs, scoreQuantifiedResults, getAlternativeStarters, scoreBulletQuality } from '../atsEvaluator'
import type { ResumeData } from '@/types/resume'

describe('auditBullets', () => {
  it('flags "Responsible for managing..." as weak', () => {
    const issues = auditBullets(['Responsible for managing a team of developers'], 'experience')
    expect(issues.length).toBeGreaterThan(0)
  })

  it('flags "Worked on..." as weak', () => {
    const issues = auditBullets(['Worked on improving API performance'], 'experience')
    expect(issues.length).toBeGreaterThan(0)
  })

  it('flags "Helped with..." as weak', () => {
    const issues = auditBullets(['Helped with deployment pipeline'], 'experience')
    expect(issues.length).toBeGreaterThan(0)
  })

  it('does not flag "Architected payment pipeline..." as weak', () => {
    const issues = auditBullets(['Architected payment pipeline processing $2M monthly'], 'experience')
    const weakVerbIssues = issues.filter(i => i.id.includes('weak-verb'))
    expect(weakVerbIssues.length).toBe(0)
  })

  it('does not flag "Reduced latency by 42%..." as weak', () => {
    const issues = auditBullets(['Reduced latency by 42% through query optimization'], 'experience')
    const weakVerbIssues = issues.filter(i => i.id.includes('weak-verb'))
    expect(weakVerbIssues.length).toBe(0)
  })

  it('handles empty bullets array without crashing', () => {
    const issues = auditBullets([], 'experience')
    expect(Array.isArray(issues)).toBe(true)
    expect(issues.length).toBe(0)
  })

  it('handles bullets with only whitespace without crashing', () => {
    const issues = auditBullets(['   ', ''], 'experience')
    expect(Array.isArray(issues)).toBe(true)
  })

  it('handles very long bullets without crashing', () => {
    const long = 'A'.repeat(500)
    const issues = auditBullets([long], 'experience')
    expect(Array.isArray(issues)).toBe(true)
  })
})

describe('scoreActionVerbs', () => {
  const makeResume = (bullets: string[]): ResumeData => ({
    contact: { fullName: '', email: '', phone: '', linkedin: '', location: '' },
    summary: '',
    experience: [{ id: '1', jobTitle: 'Dev', company: 'Co', location: '', startDate: '', endDate: '', current: false, bullets }],
    education: [],
    skills: [],
  })

  it('scores bullets starting with strong verbs higher', () => {
    const result = scoreActionVerbs(makeResume(['Led team of 5 engineers', 'Built microservice architecture', 'Optimized query performance']), 'en')
    expect(result.score).toBeGreaterThanOrEqual(5)
  })

  it('penalizes "responsible for" / "helped with" / "assisted in"', () => {
    const result = scoreActionVerbs(makeResume(['Responsible for managing team', 'Helped with deployment', 'Assisted in code review']), 'en')
    expect(result.score).toBeLessThan(5)
  })

  it('handles bullets array being empty', () => {
    const result = scoreActionVerbs(makeResume([]), 'en')
    expect(result.score).toBe(0)
  })
})

describe('scoreQuantifiedResults', () => {
  const makeResume = (bullets: string[]): ResumeData => ({
    contact: { fullName: '', email: '', phone: '', linkedin: '', location: '' },
    summary: '',
    experience: [{ id: '1', jobTitle: 'Dev', company: 'Co', location: '', startDate: '', endDate: '', current: false, bullets }],
    education: [],
    skills: [],
  })

  it('detects percentage metrics', () => {
    const result = scoreQuantifiedResults(makeResume(['Increased revenue by 40%', 'Reduced costs by 25%']), 'en')
    expect(result.score).toBeGreaterThanOrEqual(5)
  })

  it('detects dollar amounts', () => {
    const result = scoreQuantifiedResults(makeResume(['Saved $50K annually', 'Managed $1.2M budget']), 'en')
    expect(result.score).toBeGreaterThanOrEqual(5)
  })

  it('scores 0 when no metrics found', () => {
    const result = scoreQuantifiedResults(makeResume(['Worked on features', 'Fixed bugs']), 'en')
    expect(result.score).toBe(0)
  })

  it('handles empty experience without crashing', () => {
    const empty: ResumeData = {
      contact: { fullName: '', email: '', phone: '', linkedin: '', location: '' },
      summary: '', experience: [], education: [], skills: [],
    }
    const result = scoreQuantifiedResults(empty, 'en')
    expect(result.score).toBe(0)
  })
})

describe('getAlternativeStarters', () => {
  it('returns alternatives for "led" in English', () => {
    const alts = getAlternativeStarters('led')
    expect(alts.length).toBeGreaterThan(0)
    expect(alts[0]).toBeTruthy()
  })

  it('returns alternatives for French starters', () => {
    const alts = getAlternativeStarters('dirigé', 'fr')
    expect(alts.length).toBeGreaterThan(0)
  })
})

describe('scoreBulletQuality - Punctuation Consistency', () => {
  const makeBulletsResume = (bullets: string[]): ResumeData => ({
    contact: { fullName: 'Test', email: 't@t.com', phone: '', linkedin: '', location: '' },
    summary: '',
    experience: [{ id: '1', jobTitle: 'Eng', company: 'Acme', location: '', startDate: '', endDate: '', current: true, bullets }],
    education: [],
    skills: [],
  })

  it('is consistent when all bullets end with a period', () => {
    const res = scoreBulletQuality(makeBulletsResume(['Created a feature.', 'Improved speed.']), 'en')
    expect(res.issues.some(i => i.id === 'bullet-period-inconsistency')).toBe(false)
  })

  it('is consistent when no bullets end with a period', () => {
    const res = scoreBulletQuality(makeBulletsResume(['Created a feature', 'Improved speed']), 'en')
    expect(res.issues.some(i => i.id === 'bullet-period-inconsistency')).toBe(false)
  })

  it('is inconsistent when some bullets end with a period and some do not', () => {
    const res = scoreBulletQuality(makeBulletsResume(['Created a feature.', 'Improved speed']), 'en')
    expect(res.issues.some(i => i.id === 'bullet-period-inconsistency')).toBe(true)
    expect(res.score).toBeLessThan(5)
  })
})
