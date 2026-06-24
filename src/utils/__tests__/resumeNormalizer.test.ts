import { describe, it, expect } from 'vitest'
import { normalizeResumeData } from '../resumeNormalizer'

describe('normalizeResumeData', () => {
  it('should handle null and undefined input gracefully', () => {
    const resultFromNull = normalizeResumeData(null)
    expect(resultFromNull.contact).toEqual({ fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' })
    expect(resultFromNull.summary).toBe('')
    expect(resultFromNull.experience).toEqual([])
    expect(resultFromNull.education).toEqual([])

    const resultFromUndefined = normalizeResumeData(undefined)
    expect(resultFromUndefined.contact).toEqual({ fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' })
  })

  it('should preserve valid resume data', () => {
    const validData = {
      contact: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '123-456',
        linkedin: 'linkedin.com/in/johndoe',
        location: 'New York',
        website: 'johndoe.com',
      },
      summary: 'Experienced Engineer',
      experience: [
        {
          id: 'exp-1',
          jobTitle: 'Developer',
          company: 'Company A',
          location: 'NY',
          startDate: '2020',
          endDate: '2021',
          current: false,
          bullets: ['Worked on React projects', 'Maintained dashboard'],
        }
      ],
      education: [],
      skills: ['React', 'TypeScript'],
    }

    const normalized = normalizeResumeData(validData)
    expect(normalized.contact.fullName).toBe('John Doe')
    expect(normalized.summary).toBe('Experienced Engineer')
    expect(normalized.experience[0].jobTitle).toBe('Developer')
    expect(normalized.skills).toEqual(['React', 'TypeScript'])
  })

  it('normalizes experience with missing optional fields', () => {
    const data = {
      contact: { fullName: 'Jane', email: 'j@j.com', phone: '', linkedin: '', location: '' },
      summary: 'Test',
      experience: [{ id: '1', jobTitle: 'Dev', company: 'Co', location: '', startDate: '', endDate: '', current: false, bullets: ['Worked'] }],
      education: [],
      skills: ['React'],
    }
    const normalized = normalizeResumeData(data)
    expect(normalized.experience[0].jobTitle).toBe('Dev')
    expect(normalized.experience[0].bullets).toEqual(['Worked'])
  })

  it('normalizes project with no technologies array', () => {
    const data = {
      contact: { fullName: 'Jane', email: 'j@j.com', phone: '', linkedin: '', location: '' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      projects: [{ id: 'p1', name: 'My App', description: 'An app', technologies: undefined as unknown as string[] }],
    }
    const normalized = normalizeResumeData(data)
    expect(Array.isArray(normalized.projects)).toBe(true)
    expect(normalized.projects![0].technologies).toEqual([])
  })

  it('normalizes volunteer with no dates', () => {
    const data = {
      contact: { fullName: 'Jane', email: 'j@j.com', phone: '', linkedin: '', location: '' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      volunteer: [{ id: 'v1', organization: 'Charity', location: '', period: '', description: 'Helped' }],
    }
    const normalized = normalizeResumeData(data)
    expect(normalized.volunteer).toBeDefined()
    expect(normalized.volunteer!.length).toBe(1)
    expect(normalized.volunteer![0].organization).toBe('Charity')
  })

  it('round-trips data through normalize without data loss for valid fields', () => {
    const data = {
      contact: { fullName: 'Jane', email: 'j@j.com', phone: '555', linkedin: 'in/jane', location: 'NYC', website: 'jane.dev' },
      summary: 'A summary',
      experience: [{ id: 'e1', jobTitle: 'Dev', company: 'Co', location: 'NYC', startDate: '01/2020', endDate: 'Present', current: true, bullets: ['Built stuff'] }],
      education: [{ id: 'edu1', degree: 'BS', school: 'MIT', location: '', graduationDate: '06/2019' }],
      skills: ['React', 'TypeScript'],
      languages: [{ id: 'l1', name: 'English', proficiency: 'Native' }],
      projects: [{ id: 'p1', name: 'Project', description: 'Desc', technologies: ['React'], link: 'https://github.com' }],
    }
    const normalized = normalizeResumeData(data)
    expect(normalized.contact.fullName).toBe('Jane')
    expect(normalized.contact.website).toBe('jane.dev')
    expect(normalized.skills).toEqual(['React', 'TypeScript'])
    expect(normalized.languages![0].name).toBe('English')
    expect(normalized.projects![0].name).toBe('Project')
  })

  it('handles null input gracefully', () => {
    const result = normalizeResumeData(null)
    expect(result.contact).toBeDefined()
    expect(result.experience).toEqual([])
  })

  it('should normalize and fall back for partially malformed data', () => {
    const malformedData = {
      contact: {
        fullName: 12345, // invalid type
        email: 'john@example.com',
      },
      summary: null, // invalid type
      experience: 'not-an-array', // invalid type
      skills: ['Valid Skill', 42, null], // mixed types
    }

    const normalized = normalizeResumeData(malformedData)
    
    // Non-string fields should fallback to empty string
    expect(normalized.contact.fullName).toBe('')
    expect(normalized.contact.email).toBe('john@example.com')
    expect(normalized.summary).toBe('')
    
    // Non-array experience should fallback to empty array
    expect(normalized.experience).toEqual([])
    
    // Skills should clean out non-strings
    expect(normalized.skills).toEqual(['Valid Skill'])
  })
})
