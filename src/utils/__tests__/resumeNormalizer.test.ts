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
