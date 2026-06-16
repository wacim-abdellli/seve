import type { ResumeData } from '../types/resume'

const RESUME_TN_SYSTEM_PROMPT = `
You are Seve Coach, an expert resume builder and career coach assistant. 
Your job is to help users create professional, ATS-optimized resumes 
that get past applicant tracking systems and impress hiring managers. 
You are friendly, encouraging, and precise.

CORE RESPONSIBILITIES:

1. RESUME CONTENT WRITING
- Write powerful, concise bullet points for work experience
- Use strong action verbs to start every bullet (Led, Built, Increased, Managed, Designed, etc.)
- Quantify achievements whenever possible (%, $, numbers, timeframes)
- Write professional summaries tailored to the user's target role
- Suggest relevant skills based on job title and industry
- Adapt tone: entry-level (eager, learning), mid (results-driven), senior (strategic, leadership)

2. ATS OPTIMIZATION
STRUCTURE RULES:
- Must include: Contact Info, Summary, Experience, Education, Skills
- Use standard section headings (not creative ones like "My Journey")
- No tables, text boxes, columns, headers/footers, or images in content
- Use simple bullet points (•), not symbols or icons
- Fonts must be standard: Arial, Calibri, Times New Roman, Georgia

KEYWORD RULES:
- Extract keywords from the job description the user provides
- Naturally embed those keywords into experience and skills sections
- Include both spelled-out and abbreviated versions (e.g. "Search Engine Optimization (SEO)")
- Match the exact phrasing the job description uses

FORMATTING RULES:
- Dates format: MM/YYYY or Month YYYY (consistent throughout)
- Job titles must be clear and recognizable
- No special characters: %, &, # are fine — avoid: ★ ✓ ► ◆
- Keep to 1 page (0-5 years exp) or 2 pages max (5+ years)
- File should export as clean text-readable PDF

CONTENT RULES:
- Every bullet point must start with an action verb (past tense for old jobs, present for current)
- No personal pronouns (I, me, my, we)
- No photos, age, marital status, religion (bias-free)
- GPA only if above 3.5 and recent graduate
- References: never include on resume
`

export async function generateContent(
  prompt: string,
  apiKey: string,
  _type: 'bullet' | 'summary' | 'improve' | 'tailor'
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API_KEY_REQUIRED')
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt}\n\nStrict Guidelines:\n${RESUME_TN_SYSTEM_PROMPT}`
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          }
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text
      ) {
        return data.candidates[0].content.parts[0].text
      }
    }
    throw new Error('API_RESPONSE_ERROR')
  } catch (e) {
    console.error('Gemini API call failed:', e)
    throw e
  }
}

// Helper: Standardize date string to MM/YYYY
function cleanDate(dateStr: string): string {
  const clean = dateStr.trim()
  if (/^present|current$/i.test(clean)) {
    return 'Present'
  }

  if (/^\d{2}\/\d{4}$/.test(clean)) {
    return clean
  }

  const months: Record<string, string> = {
    january: '01', feb: '02', february: '02', mar: '03', march: '03',
    apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07',
    july: '07', aug: '08', august: '08', sep: '09', september: '09',
    oct: '10', october: '10', nov: '11', november: '11', dec: '12',
    december: '12', jan: '01'
  }

  const matches = clean.match(/([a-zA-Z]+)\s*,?\s*(\d{4})/i)
  if (matches && matches[1] && matches[2]) {
    const monthName = matches[1].toLowerCase()
    const year = matches[2]
    const monthNum = months[monthName] || '01'
    return `${monthNum}/${year}`
  }

  const yearMatch = clean.match(/^\d{4}$/)
  if (yearMatch) {
    return `01/${yearMatch[0]}`
  }

  return clean
}

// Helper: Remove special characters from text fields
function stripSpecialChars(text: string): string {
  return text.replace(/[★✓►◆■●▪▲▼◆◇○◎●★☆]/g, '').trim()
}

// Helper: Remove personal pronouns from bullets
function stripPronouns(bullet: string): string {
  let cleaned = bullet.replace(/\b(i|me|my|we|our)\b/gi, '').trim()
  cleaned = cleaned.replace(/\s+/g, ' ')
  cleaned = cleaned.replace(/,\s*,/g, ',')
  cleaned = cleaned.replace(/^,\s*/, '')
  
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  return cleaned
}

export function autoFix(resume: ResumeData): ResumeData {
  const fixed: ResumeData = JSON.parse(JSON.stringify(resume))

  if (fixed.contact) {
    fixed.contact.fullName = stripSpecialChars(fixed.contact.fullName)
    fixed.contact.email = stripSpecialChars(fixed.contact.email)
    fixed.contact.phone = stripSpecialChars(fixed.contact.phone)
    fixed.contact.linkedin = stripSpecialChars(fixed.contact.linkedin)
    fixed.contact.location = stripSpecialChars(fixed.contact.location)
    if (fixed.contact.website) {
      fixed.contact.website = stripSpecialChars(fixed.contact.website)
    }
  }

  fixed.summary = stripSpecialChars(fixed.summary)
  fixed.summary = stripPronouns(fixed.summary)

  fixed.experience = fixed.experience.map((exp) => ({
    ...exp,
    jobTitle: stripSpecialChars(exp.jobTitle),
    company: stripSpecialChars(exp.company),
    location: stripSpecialChars(exp.location),
    startDate: cleanDate(exp.startDate),
    endDate: cleanDate(exp.endDate),
    bullets: exp.bullets.map(stripSpecialChars).map(stripPronouns)
  }))

  fixed.education = fixed.education.map((edu) => ({
    ...edu,
    degree: stripSpecialChars(edu.degree),
    school: stripSpecialChars(edu.school),
    location: stripSpecialChars(edu.location),
    graduationDate: cleanDate(edu.graduationDate)
  }))

  fixed.skills = fixed.skills.map(stripSpecialChars)

  if (fixed.projects) {
    fixed.projects = fixed.projects.map((proj) => ({
      ...proj,
      name: stripSpecialChars(proj.name),
      description: stripSpecialChars(proj.description),
      technologies: proj.technologies.map(stripSpecialChars)
    }))
  }

  return fixed
}
