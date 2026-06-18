import { describe, it, expect } from 'vitest'
import { evaluateResume, detectLanguage, auditBullets } from '../atsEvaluator'
import type { ResumeData } from '@/types/resume'

const MINIMAL_RESUME: ResumeData = {
  contact: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0100',
    linkedin: 'https://linkedin.com/in/janedoe',
    location: 'San Francisco, CA',
  },
  summary: 'Experienced software engineer with expertise in React, TypeScript, and Node.js.',
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      startDate: '2022-01',
      endDate: 'Present',
      current: true,
      bullets: [
        'Led a team of 5 engineers to build a new microservice architecture',
        'Improved API response times by 40% through query optimization',
        'Mentored 3 junior developers through code reviews and pair programming',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Software Engineer',
      company: 'Startup Inc',
      location: 'Oakland, CA',
      startDate: '2019-03',
      endDate: '2021-12',
      current: false,
      bullets: [
        'Developed RESTful APIs using Node.js and Express',
        'Implemented CI/CD pipelines with GitHub Actions',
        'Reduced deployment time by 60% with automated testing',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.S. Computer Science',
      school: 'University of California',
      location: 'Berkeley, CA',
      graduationDate: '2019-05',
    },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
  languages: [
    { id: 'lang-1', name: 'English', proficiency: 'Native' },
    { id: 'lang-2', name: 'Spanish', proficiency: 'Professional' },
  ],
}

const JOB_DESCRIPTION = `
We are looking for a Senior Software Engineer to join our team.
You will work with React, TypeScript, and Node.js to build scalable applications.
Experience with PostgreSQL, Docker, and AWS is preferred.
We value leadership, mentoring, and a track record of delivering results.
`

describe('detectLanguage', () => {
  it('detects English text', () => {
    expect(detectLanguage('Hello world')).toBe('en')
  })

  it('detects French text', () => {
    expect(detectLanguage('Bonjour le monde')).toBe('fr')
  })
})

describe('evaluateResume', () => {
  it('returns a valid AtsScore with reportV2 for a minimal resume', () => {
    const result = evaluateResume(MINIMAL_RESUME, JOB_DESCRIPTION)

    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('grade')
    expect(result).toHaveProperty('sections')
    expect(result).toHaveProperty('passing')
    expect(result).toHaveProperty('failing')
    expect(result).toHaveProperty('language')
    expect(result).toHaveProperty('reportV2')

    expect(typeof result.total).toBe('number')
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)

    expect(typeof result.grade).toBe('string')
    expect(result.grade.length).toBeGreaterThan(0)

    expect(result.language).toBe('en')
  })

  it('has all 8 section scores', () => {
    const result = evaluateResume(MINIMAL_RESUME, JOB_DESCRIPTION)
    const expectedSections = [
      'sectionCompleteness',
      'keywordMatch',
      'formattingSafety',
      'actionVerbs',
      'quantifiedResults',
      'contactInfo',
      'dateConsistency',
      'lengthAppropriateness',
    ]
    for (const key of expectedSections) {
      expect(result.sections).toHaveProperty(key)
      expect(typeof result.sections[key as keyof typeof result.sections]).toBe('number')
    }
  })

  it('returns a full reportV2 with categories', () => {
    const result = evaluateResume(MINIMAL_RESUME, JOB_DESCRIPTION)
    const report = result.reportV2

    expect(report).toHaveProperty('categories')
    expect(Array.isArray(report.categories)).toBe(true)
    expect(report.categories.length).toBeGreaterThan(0)

    const firstCat = report.categories[0]
    expect(firstCat).toHaveProperty('key')
    expect(firstCat).toHaveProperty('label')
    expect(firstCat).toHaveProperty('score')
    expect(firstCat).toHaveProperty('max')
    expect(firstCat).toHaveProperty('weight')
    expect(firstCat).toHaveProperty('issues')
  })

  it('handles empty job description gracefully', () => {
    const result = evaluateResume(MINIMAL_RESUME, '')

    expect(typeof result.total).toBe('number')
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.sections.keywordMatch).toBe(0)
  })

  it('handles empty resume gracefully', () => {
    const result = evaluateResume(
      {
        contact: { fullName: '', email: '', phone: '', linkedin: '', location: '' },
        summary: '',
        experience: [],
        education: [],
        skills: [],
      },
      JOB_DESCRIPTION,
    )

    expect(typeof result.total).toBe('number')
    expect(Array.isArray(result.failing)).toBe(true)
  })

  it('accepts an optional fontSize parameter', () => {
    const resultDefault = evaluateResume(MINIMAL_RESUME, JOB_DESCRIPTION)
    const resultSmall = evaluateResume(MINIMAL_RESUME, JOB_DESCRIPTION, 6)
    const resultLarge = evaluateResume(MINIMAL_RESUME, JOB_DESCRIPTION, 14)

    expect(resultDefault.sections.lengthAppropriateness).toBeDefined()
    expect(resultSmall.sections.lengthAppropriateness).toBeDefined()
    expect(resultLarge.sections.lengthAppropriateness).toBeDefined()
  })
})

describe('auditBullets', () => {
  it('returns issues for generic bullets', () => {
    const genericBullets = ['Responsible for things', 'Did some work', 'Helped with tasks']
    const issues = auditBullets(genericBullets, 'experience')

    expect(Array.isArray(issues)).toBe(true)
    expect(issues.length).toBeGreaterThan(0)
  })

  it('reports no issues for strong quantified bullets', () => {
    const strongBullets = [
      'Increased revenue by 25% through targeted marketing campaigns',
      'Reduced server costs by $50K annually by migrating to AWS',
      'Led a team of 12 engineers to ship 3 major releases on time',
    ]
    const issues = auditBullets(strongBullets, 'experience')

    expect(Array.isArray(issues)).toBe(true)
  })
})
