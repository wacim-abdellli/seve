import { describe, it, expect, beforeEach } from 'vitest'
import {
  evaluateResume,
  calculateTotal,
  getGrade,
  generateAtsReport,
  autoFix,
} from '../atsReport'
import { clearResumeTextCache } from '../atsEvaluator'
import type { ResumeData } from '@/types/resume'
import type { AtsCategoryScore } from '@/types/resume'

beforeEach(() => clearResumeTextCache())

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const STRONG_RESUME: ResumeData = {
  contact: {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0199',
    linkedin: 'linkedin.com/in/janesmith',
    location: 'San Francisco, CA',
  },
  summary:
    'Senior software engineer with 7 years building distributed systems. Led teams of 8+ engineers, reduced infrastructure costs by 35%, and shipped products used by 2M+ users. Expert in React, TypeScript, Node.js, and AWS.',
  experience: [
    {
      id: 'e1',
      jobTitle: 'Senior Software Engineer',
      company: 'Stripe',
      location: 'San Francisco, CA',
      startDate: '01/2021',
      endDate: 'Present',
      current: true,
      bullets: [
        'Architected payment pipeline handling $50M/day, reducing latency by 42%',
        'Led team of 8 engineers through 3 major product launches',
        'Reduced infrastructure costs by 35% through caching optimization',
        'Mentored 5 junior engineers, 3 of whom received promotions within 18 months',
      ],
    },
    {
      id: 'e2',
      jobTitle: 'Software Engineer',
      company: 'Datadog',
      location: 'New York, NY',
      startDate: '06/2018',
      endDate: '12/2020',
      current: false,
      bullets: [
        'Built distributed tracing UI handling 10B+ daily spans',
        'Reduced incident resolution time by 35% through improved alerting',
      ],
    },
  ],
  education: [
    {
      id: 'ed1',
      degree: 'B.S. Computer Science',
      school: 'MIT',
      location: 'Cambridge, MA',
      graduationDate: '06/2018',
      gpa: '3.9',
    },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'PostgreSQL', 'Docker', 'Python', 'Go'],
  languages: [{ id: 'l1', name: 'English', proficiency: 'Native' }],
  projects: [
    {
      id: 'p1',
      name: 'Open Source CLI Tool',
      description: 'Built a CLI tool with 2,000+ GitHub stars for automating deployments',
      technologies: ['Go', 'Docker'],
    },
  ],
  awards: [],
  certifications: [],
  interests: [],
  publications: [],
  references: [],
  volunteer: [],
}

const EMPTY_RESUME: ResumeData = {
  contact: { fullName: '', email: '', phone: '', linkedin: '', location: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  awards: [],
  certifications: [],
  interests: [],
  publications: [],
  references: [],
  volunteer: [],
}

const MINIMAL_RESUME: ResumeData = {
  contact: {
    fullName: 'Bob Jones',
    email: 'bob@test.com',
    phone: '555-0100',
    linkedin: '',
    location: 'Austin, TX',
  },
  summary: 'Developer with experience in web technologies.',
  experience: [
    {
      id: 'e1',
      jobTitle: 'Developer',
      company: 'Acme Corp',
      location: 'Austin, TX',
      startDate: '01/2022',
      endDate: 'Present',
      current: true,
      bullets: ['Worked on various projects', 'Helped the team with tasks'],
    },
  ],
  education: [
    {
      id: 'ed1',
      degree: 'B.S. Computer Science',
      school: 'State University',
      location: '',
      graduationDate: '06/2021',
    },
  ],
  skills: ['JavaScript', 'HTML', 'CSS'],
  languages: [],
  projects: [],
  awards: [],
  certifications: [],
  interests: [],
  publications: [],
  references: [],
  volunteer: [],
}

// ─── calculateTotal ───────────────────────────────────────────────────────────

describe('calculateTotal', () => {
  it('returns 0 for empty categories array', () => {
    expect(calculateTotal([])).toBe(0)
  })

  it('returns 100 when every category scores max', () => {
    const cats: AtsCategoryScore[] = [
      { key: 'a', label: 'A', score: 10, max: 10, weight: 1, issues: [] },
      { key: 'b', label: 'B', score: 20, max: 20, weight: 1, issues: [] },
    ]
    expect(calculateTotal(cats)).toBe(100)
  })

  it('returns 0 when every category scores 0', () => {
    const cats: AtsCategoryScore[] = [
      { key: 'a', label: 'A', score: 0, max: 10, weight: 1, issues: [] },
      { key: 'b', label: 'B', score: 0, max: 20, weight: 1, issues: [] },
    ]
    expect(calculateTotal(cats)).toBe(0)
  })

  it('handles a single category correctly', () => {
    const cats: AtsCategoryScore[] = [
      { key: 'a', label: 'A', score: 5, max: 10, weight: 1, issues: [] },
    ]
    expect(calculateTotal(cats)).toBe(50)
  })

  it('result is always between 0 and 100', () => {
    const cats: AtsCategoryScore[] = [
      { key: 'a', label: 'A', score: 7, max: 10, weight: 2, issues: [] },
      { key: 'b', label: 'B', score: 3, max: 10, weight: 1, issues: [] },
    ]
    const result = calculateTotal(cats)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })

  it('weights heavier categories more', () => {
    const equalWeight: AtsCategoryScore[] = [
      { key: 'a', label: 'A', score: 10, max: 10, weight: 1, issues: [] },
      { key: 'b', label: 'B', score: 0, max: 10, weight: 1, issues: [] },
    ]
    const unequalWeight: AtsCategoryScore[] = [
      { key: 'a', label: 'A', score: 10, max: 10, weight: 3, issues: [] },
      { key: 'b', label: 'B', score: 0, max: 10, weight: 1, issues: [] },
    ]
    expect(calculateTotal(unequalWeight)).toBeGreaterThan(calculateTotal(equalWeight))
  })
})

// ─── getGrade ─────────────────────────────────────────────────────────────────

describe('getGrade', () => {
  it('returns A / Excellent for score >= 90', () => {
    expect(getGrade(90)).toEqual({ grade: 'A', gradeLabel: 'Excellent' })
    expect(getGrade(100)).toEqual({ grade: 'A', gradeLabel: 'Excellent' })
    expect(getGrade(95)).toEqual({ grade: 'A', gradeLabel: 'Excellent' })
  })

  it('returns B+ / Great for score 80–89', () => {
    expect(getGrade(80)).toEqual({ grade: 'B+', gradeLabel: 'Great' })
    expect(getGrade(85)).toEqual({ grade: 'B+', gradeLabel: 'Great' })
    expect(getGrade(89)).toEqual({ grade: 'B+', gradeLabel: 'Great' })
  })

  it('returns B / Good for score 70–79', () => {
    expect(getGrade(70)).toEqual({ grade: 'B', gradeLabel: 'Good' })
    expect(getGrade(75)).toEqual({ grade: 'B', gradeLabel: 'Good' })
  })

  it('returns C+ / Fair for score 60–69', () => {
    expect(getGrade(60)).toEqual({ grade: 'C+', gradeLabel: 'Fair' })
    expect(getGrade(65)).toEqual({ grade: 'C+', gradeLabel: 'Fair' })
  })

  it('returns C / Needs Work for score 50–59', () => {
    expect(getGrade(50)).toEqual({ grade: 'C', gradeLabel: 'Needs Work' })
    expect(getGrade(55)).toEqual({ grade: 'C', gradeLabel: 'Needs Work' })
  })

  it('returns D / Poor for score 40–49', () => {
    expect(getGrade(40)).toEqual({ grade: 'D', gradeLabel: 'Poor' })
    expect(getGrade(45)).toEqual({ grade: 'D', gradeLabel: 'Poor' })
  })

  it('returns F / Critical for score below 40', () => {
    expect(getGrade(39)).toEqual({ grade: 'F', gradeLabel: 'Critical' })
    expect(getGrade(0)).toEqual({ grade: 'F', gradeLabel: 'Critical' })
  })

  it('handles boundary values exactly', () => {
    expect(getGrade(89).grade).toBe('B+')
    expect(getGrade(90).grade).toBe('A')
    expect(getGrade(79).grade).toBe('B')
    expect(getGrade(80).grade).toBe('B+')
  })
})

// ─── evaluateResume ───────────────────────────────────────────────────────────

describe('evaluateResume', () => {
  it('returns a total score between 0 and 100', () => {
    const result = evaluateResume(STRONG_RESUME, '')
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  it('strong resume scores higher than empty resume', () => {
    const strong = evaluateResume(STRONG_RESUME, '')
    const empty = evaluateResume(EMPTY_RESUME, '')
    expect(strong.total).toBeGreaterThan(empty.total)
  })

  it('returns a grade string', () => {
    const result = evaluateResume(STRONG_RESUME, '')
    expect(typeof result.grade).toBe('string')
    expect(result.grade.length).toBeGreaterThan(0)
  })

  it('returns a language of en or fr', () => {
    const result = evaluateResume(STRONG_RESUME, 'React TypeScript engineer')
    expect(['en', 'fr']).toContain(result.language)
  })

  it('includes all required section scores', () => {
    const result = evaluateResume(STRONG_RESUME, '')
    expect(result.sections).toHaveProperty('sectionCompleteness')
    expect(result.sections).toHaveProperty('keywordMatch')
    expect(result.sections).toHaveProperty('formattingSafety')
    expect(result.sections).toHaveProperty('actionVerbs')
    expect(result.sections).toHaveProperty('quantifiedResults')
    expect(result.sections).toHaveProperty('contactInfo')
    expect(result.sections).toHaveProperty('dateConsistency')
    expect(result.sections).toHaveProperty('lengthAppropriateness')
  })

  it('includes passing and failing arrays', () => {
    const result = evaluateResume(STRONG_RESUME, '')
    expect(Array.isArray(result.passing)).toBe(true)
    expect(Array.isArray(result.failing)).toBe(true)
  })

  it('includes reportV2 with categories', () => {
    const result = evaluateResume(STRONG_RESUME, 'React TypeScript engineer')
    expect(result.reportV2).toBeDefined()
    expect(Array.isArray(result.reportV2.categories)).toBe(true)
    expect(result.reportV2.categories.length).toBeGreaterThan(0)
  })

  it('keyword match is higher when JD matches resume skills', () => {
    const withJD = evaluateResume(STRONG_RESUME, 'React TypeScript Node.js AWS engineer')
    const withoutJD = evaluateResume(STRONG_RESUME, '')
    expect(withJD.sections.keywordMatch).toBeGreaterThanOrEqual(withoutJD.sections.keywordMatch)
  })

  it('empty resume scores below 30', () => {
    const result = evaluateResume(EMPTY_RESUME, '')
    expect(result.total).toBeLessThan(30)
  })

  it('does not crash with empty job description', () => {
    expect(() => evaluateResume(STRONG_RESUME, '')).not.toThrow()
  })

  it('does not crash with very long job description', () => {
    const longJD = 'React TypeScript Node.js '.repeat(200)
    expect(() => evaluateResume(STRONG_RESUME, longJD)).not.toThrow()
  })

  it('all section scores are non-negative', () => {
    const result = evaluateResume(MINIMAL_RESUME, 'developer')
    for (const [, value] of Object.entries(result.sections)) {
      expect(value).toBeGreaterThanOrEqual(0)
    }
  })

  it('blends AI audit sub-scores into final categories and total score', () => {
    const aiAudit = {
      spellingScore: 90,
      parserScore: 50,
      roleFitScore: 40,
      skillsDepthScore: 30,
      grammarIssuesCount: 3,
      issues: [
        {
          id: 'ai-spelling-0',
          type: 'critical' as const,
          category: 'formatting' as const,
          issue: 'Typo found',
          fix: 'Fix it',
          severityScore: 80,
          autoFixable: false
        }
      ]
    }
    
    const result = evaluateResume(STRONG_RESUME, 'software engineer', 10, aiAudit)
    
    // Local formatting safety is normally 10/10. Blended with parserScore 50/100 should be 0.4*10 + 0.6*5 = 7/10
    expect(result.reportV2.categories.find(c => c.key === 'formatting')?.score).toBe(7)
    
    // Check that spelling issues from AI are merged
    expect(result.reportV2.critical.some(i => i.id === 'ai-spelling-0')).toBe(true)
  })
})

// ─── generateAtsReport ────────────────────────────────────────────────────────

describe('generateAtsReport', () => {
  it('returns a report with a total between 0 and 100', () => {
    const report = generateAtsReport(STRONG_RESUME, '')
    expect(report.total).toBeGreaterThanOrEqual(0)
    expect(report.total).toBeLessThanOrEqual(100)
  })

  it('returns categories array with entries', () => {
    const report = generateAtsReport(STRONG_RESUME, 'React TypeScript')
    expect(Array.isArray(report.categories)).toBe(true)
    expect(report.categories.length).toBeGreaterThan(0)
  })

  it('each category has key, label, score, max, weight', () => {
    const report = generateAtsReport(STRONG_RESUME, '')
    for (const cat of report.categories) {
      expect(typeof cat.key).toBe('string')
      expect(typeof cat.label).toBe('string')
      expect(typeof cat.score).toBe('number')
      expect(typeof cat.max).toBe('number')
      expect(typeof cat.weight).toBe('number')
    }
  })

  it('every category score is between 0 and its max', () => {
    const report = generateAtsReport(STRONG_RESUME, 'React TypeScript Node.js')
    for (const cat of report.categories) {
      expect(cat.score).toBeGreaterThanOrEqual(0)
      expect(cat.score).toBeLessThanOrEqual(cat.max)
    }
  })

  it('returns grade and gradeLabel strings', () => {
    const report = generateAtsReport(STRONG_RESUME, '')
    expect(typeof report.grade).toBe('string')
    expect(typeof report.gradeLabel).toBe('string')
  })

  it('returns critical, warnings, suggestions arrays', () => {
    const report = generateAtsReport(EMPTY_RESUME, '')
    expect(Array.isArray(report.critical)).toBe(true)
    expect(Array.isArray(report.warnings)).toBe(true)
    expect(Array.isArray(report.suggestions)).toBe(true)
  })

  it('empty resume generates critical issues', () => {
    const report = generateAtsReport(EMPTY_RESUME, '')
    expect(report.critical.length + report.warnings.length).toBeGreaterThan(0)
  })

  it('strong resume generates fewer critical issues than empty resume', () => {
    const strong = generateAtsReport(STRONG_RESUME, 'React TypeScript Node.js engineer')
    const empty = generateAtsReport(EMPTY_RESUME, '')
    expect(strong.critical.length).toBeLessThan(empty.critical.length + empty.warnings.length)
  })

  it('does not crash on empty resume', () => {
    expect(() => generateAtsReport(EMPTY_RESUME, '')).not.toThrow()
  })

  it('does not crash on empty job description', () => {
    expect(() => generateAtsReport(STRONG_RESUME, '')).not.toThrow()
  })

  it('strong resume scores above baseline', () => {
    const report = generateAtsReport(
      STRONG_RESUME,
      'Senior software engineer with React TypeScript Node.js AWS experience'
    )
    const empty = generateAtsReport(EMPTY_RESUME, '')
    expect(report.total).toBeGreaterThan(empty.total)
  })
})

// ─── autoFix ──────────────────────────────────────────────────────────────────

describe('autoFix', () => {
  it('returns a ResumeData object', () => {
    const result = autoFix(STRONG_RESUME)
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  })

  it('does not mutate the input resume', () => {
    const original = JSON.parse(JSON.stringify(STRONG_RESUME))
    autoFix(STRONG_RESUME)
    expect(STRONG_RESUME).toEqual(original)
  })

  it('preserves contact info', () => {
    const result = autoFix(STRONG_RESUME)
    expect(result.contact.fullName).toBe(STRONG_RESUME.contact.fullName)
    expect(result.contact.email).toBe(STRONG_RESUME.contact.email)
  })

  it('handles empty resume without crashing', () => {
    expect(() => autoFix(EMPTY_RESUME)).not.toThrow()
  })

  it('handles resume with missing optional arrays without crashing', () => {
    const sparse: ResumeData = {
      contact: { fullName: 'Test', email: 't@t.com', phone: '', linkedin: '', location: '' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
    }
    expect(() => autoFix(sparse)).not.toThrow()
  })
})
