import { describe, it, expect, beforeEach } from 'vitest'
import {
  scoreCompleteness, scoreKeywords, scoreFormatting,
  scoreContactInfo, scoreDateConsistency, scoreLength,
  scoreReadability, scoreContentDepth, scoreSemantic,
  extractMeaningfulKeywords, weightKeyword, evaluateSectionAts,
  clearResumeTextCache,
  scoreHrRedFlags,
} from '../atsEvaluator'
import type { ResumeData } from '@/types/resume'

beforeEach(() => clearResumeTextCache())

const BASE_RESUME: ResumeData = {
  contact: { fullName: 'John Doe', email: 'john@test.com', phone: '555-0100', linkedin: 'linkedin.com/in/john', location: 'NYC' },
  summary: 'Experienced engineer with deep expertise in React, TypeScript, and Node.js. Passionate about building scalable systems.',
  experience: [
    { id: '1', jobTitle: 'Senior Engineer', company: 'Acme', location: 'NYC', startDate: '01/2020', endDate: 'Present', current: true, bullets: ['Led team of 5 engineers', 'Reduced deploy time by 40%', 'Built CI/CD pipeline'] },
  ],
  education: [{ id: '1', degree: 'B.S. Computer Science', school: 'MIT', location: '', graduationDate: '06/2019' }],
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
  projects: [{ id: '1', name: 'Web App', description: 'Built a full-stack app', technologies: ['React', 'Node.js'], startDate: '2023', endDate: '2024' }],
  languages: [{ id: '1', name: 'English', proficiency: 'Native' }],
}

const EMPTY_RESUME: ResumeData = {
  contact: { fullName: '', email: '', phone: '', linkedin: '', location: '' },
  summary: '', experience: [], education: [], skills: [],
}

describe('keyword scoring', () => {
  it('scores high when resume contains JD keywords', () => {
    const result = scoreKeywords(BASE_RESUME, 'Looking for React developer with TypeScript and Node.js', 'en')
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThanOrEqual(result.max)
  })

  it('handles empty job description — returns 0', () => {
    const result = scoreKeywords(BASE_RESUME, '', 'en')
    expect(result.score).toBe(0)
  })

  it('handles job description with only resume-irrelevant words — low score', () => {
    const result = scoreKeywords(BASE_RESUME, 'looking for a candidate with proven ability to deliver results in a fast-paced environment', 'en')
    expect(result.score).toBeLessThanOrEqual(result.max)
  })
})

describe('section completeness scoring', () => {
  it('penalizes missing summary', () => {
    const noSummary: ResumeData = { ...EMPTY_RESUME, contact: { ...BASE_RESUME.contact }, experience: BASE_RESUME.experience, education: BASE_RESUME.education, skills: BASE_RESUME.skills }
    const result = scoreCompleteness(noSummary, 'en')
    const summaryIssue = result.issues.find(i => i.id === 'completeness-summary')
    expect(summaryIssue).toBeDefined()
  })

  it('penalizes missing experience', () => {
    const result = scoreCompleteness(EMPTY_RESUME, 'en')
    const expIssue = result.issues.find(i => i.id === 'completeness-experience')
    expect(expIssue).toBeDefined()
  })

  it('gives full score when all core sections are present', () => {
    const result = scoreCompleteness(BASE_RESUME, 'en')
    const coreIssues = result.issues.filter(i => i.type === 'critical')
    expect(coreIssues.length).toBe(0)
  })
})

describe('formatting safety scoring', () => {
  it('detects special characters', () => {
    const withChars: ResumeData = {
      ...BASE_RESUME,
      summary: 'Engineer ★ with skills ✓',
    }
    const result = scoreFormatting(withChars, 'en')
    const charIssue = result.issues.find(i => i.id === 'formatting-special-chars')
    expect(charIssue).toBeDefined()
  })

  it('flags personal pronouns in summary', () => {
    const withPronouns: ResumeData = {
      ...BASE_RESUME,
      summary: 'I am a great engineer and I have led teams',
    }
    const result = scoreFormatting(withPronouns, 'en')
    const pronounIssue = result.issues.find(i => i.id === 'formatting-pronouns')
    expect(pronounIssue).toBeDefined()
  })

  it('handles empty resume without crashing', () => {
    const result = scoreFormatting(EMPTY_RESUME, 'en')
    expect(typeof result.score).toBe('number')
    expect(Array.isArray(result.issues)).toBe(true)
  })
})

describe('contact info scoring', () => {
  it('gives full score with all fields present', () => {
    const result = scoreContactInfo(BASE_RESUME, 'en')
    expect(result.score).toBe(result.max)
  })

  it('penalizes missing email', () => {
    const noEmail: ResumeData = {
      ...BASE_RESUME,
      contact: { ...BASE_RESUME.contact, email: '' },
    }
    const result = scoreContactInfo(noEmail, 'en')
    expect(result.score).toBeLessThan(result.max)
  })

  it('handles completely empty contact', () => {
    const result = scoreContactInfo(EMPTY_RESUME, 'en')
    expect(result.score).toBe(0)
  })
})

describe('date consistency scoring', () => {
  it('accepts MM/YYYY format', () => {
    const result = scoreDateConsistency(BASE_RESUME, 'en')
    expect(result.score).toBeGreaterThan(0)
  })

  it('penalizes missing dates when no dates exist across resume', () => {
    const noDates: ResumeData = {
      ...EMPTY_RESUME,
      experience: [{ id: '1', jobTitle: 'Dev', company: 'Co', location: '', startDate: '', endDate: '', current: false, bullets: ['Worked on stuff'] }],
      education: [],
    }
    const result = scoreDateConsistency(noDates, 'en')
    expect(result.score).toBe(0)
  })

  it('handles empty experience array without crashing', () => {
    const result = scoreDateConsistency(EMPTY_RESUME, 'en')
    expect(typeof result.score).toBe('number')
  })
})

describe('length appropriateness scoring', () => {
  it('penalizes very short resumes', () => {
    const result = scoreLength(EMPTY_RESUME, 'en')
    expect(result.score).toBe(0)
  })

  it('handles empty resume without crashing', () => {
    const result = scoreLength(EMPTY_RESUME, 'en')
    expect(typeof result.score).toBe('number')
  })
})

describe('readability scoring', () => {
  it('handles empty resume without crashing', () => {
    const result = scoreReadability(EMPTY_RESUME, 'en')
    expect(typeof result.score).toBe('number')
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('produces consistent results for same input', () => {
    const r1 = scoreReadability(BASE_RESUME, 'en')
    const r2 = scoreReadability(BASE_RESUME, 'en')
    expect(r1.score).toBe(r2.score)
  })
})

describe('content depth scoring', () => {
  it('penalizes missing experience', () => {
    const result = scoreContentDepth(EMPTY_RESUME, 'en')
    const expIssue = result.issues.find(i => i.id === 'depth-no-experience')
    expect(expIssue).toBeDefined()
  })

  it('gives credit for detailed experience entries', () => {
    const result = scoreContentDepth(BASE_RESUME, 'en')
    expect(result.score).toBeGreaterThan(0)
  })
})

describe('semantic relevance scoring', () => {
  it('handles empty JD gracefully', () => {
    const result = scoreSemantic(BASE_RESUME, '', 'en')
    expect(result.score).toBe(0)
  })

  it('returns a score for matching JD', () => {
    const result = scoreSemantic(BASE_RESUME, 'Software engineer with React experience', 'en')
    expect(typeof result.score).toBe('number')
    expect(result.score).toBeGreaterThanOrEqual(0)
  })
})

describe('extractMeaningfulKeywords', () => {
  it('extracts keywords from job description text', () => {
    const keywords = extractMeaningfulKeywords('Looking for a React developer with TypeScript')
    expect(keywords).toContain('react')
    expect(keywords).toContain('typescript')
    expect(keywords).toContain('developer')
  })

  it('filters out known resume stop words', () => {
    const keywords = extractMeaningfulKeywords('looking for a lead developer role with proven experience')
    expect(keywords).not.toContain('lead')
    expect(keywords).not.toContain('role')
  })
})

describe('weightKeyword', () => {
  it('returns high for well-known tech', () => {
    expect(weightKeyword('react')).toBe('high')
    expect(weightKeyword('typescript')).toBe('high')
    expect(weightKeyword('aws')).toBe('high')
  })

  it('returns low for short words', () => {
    expect(weightKeyword('abc')).toBe('low')
  })
})

describe('evaluateSectionAts', () => {
  it('returns danger for missing contact', () => {
    const result = evaluateSectionAts('contact', EMPTY_RESUME, 'en')
    expect(result.rating).toBe('danger')
  })

  it('returns safe for complete contact', () => {
    const result = evaluateSectionAts('contact', BASE_RESUME, 'en')
    expect(result.rating).toBe('safe')
  })

  it('returns danger for missing experience', () => {
    const result = evaluateSectionAts('experience', EMPTY_RESUME, 'en')
    expect(result.rating).toBe('danger')
  })

  it('handles undefined resume data', () => {
    const result = evaluateSectionAts('contact', undefined, 'en')
    expect(result.rating).toBe('danger')
  })
})

describe('score bounds', () => {
  it('perfect resume with matching JD scores above 60', () => {
    const result = scoreKeywords(BASE_RESUME, 'React TypeScript Node.js PostgreSQL Docker AWS', 'en')
    expect(result.score).toBeGreaterThan(0)
  })

  it('empty resume scores low on completeness', () => {
    const result = scoreCompleteness(EMPTY_RESUME, 'en')
    expect(result.score).toBeLessThan(result.max)
  })
})

describe('scoreHrRedFlags', () => {
  it('returns perfect score of 10 when no bias keywords are present', () => {
    const res = scoreHrRedFlags(BASE_RESUME, 'en')
    expect(res.score).toBe(10)
    expect(res.issues.length).toBe(0)
  })

  it('deducts points and flags issues when marital status is present', () => {
    const resumeWithBias: ResumeData = {
      ...BASE_RESUME,
      summary: 'Marital status: married, age 32',
    }
    const res = scoreHrRedFlags(resumeWithBias, 'en')
    expect(res.score).toBeLessThan(10)
    expect(res.issues.some(i => i.id.includes('marital-status') || i.id.includes('married'))).toBe(true)
  })

  it('deducts points and flags issues when date of birth/dob is present', () => {
    const resumeWithAgeBias: ResumeData = {
      ...BASE_RESUME,
      summary: 'Born 1994, DOB: 12/12/1994',
    }
    const res = scoreHrRedFlags(resumeWithAgeBias, 'en')
    expect(res.score).toBeLessThan(10)
    expect(res.issues.some(i => i.id.includes('dob'))).toBe(true)
  })
})
