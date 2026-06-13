import type { ResumeData } from '../types/resume'

const RESUME_AI_SYSTEM_PROMPT = `
You are Seve, an expert resume builder and career coach assistant. 
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

// Helper function to extract potential job titles from prompt text
function extractJobTitle(prompt: string): string {
  const clean = prompt.toLowerCase()
  const matches = clean.match(/(developer|engineer|designer|manager|marketer|analyst|specialist|representative|consultant|accountant)/i)
  if (matches) {
    const keywords = prompt.split(/\s+/)
    const index = keywords.findIndex(w => new RegExp(matches[0], 'i').test(w))
    if (index >= 0) {
      // Return word before and matching word (e.g., "React Developer")
      const before = index > 0 ? keywords[index - 1] : ''
      return `${before.charAt(0).toUpperCase() + before.slice(1)} ${matches[0].charAt(0).toUpperCase() + matches[0].slice(1)}`
    }
    return matches[0].charAt(0).toUpperCase() + matches[0].slice(1)
  }
  return 'Professional'
}

// Local Fallback Generator Heuristics
function generateFallbackContent(
  prompt: string,
  type: 'bullet' | 'summary' | 'improve' | 'tailor'
): string {
  const jobTitle = extractJobTitle(prompt)

  if (type === 'bullet') {
    // Return 3 strong action verb bullets based on job title
    if (/developer|engineer|software/i.test(jobTitle)) {
      return `• Engineered scalable and responsive frontend user interfaces using React and TypeScript, resulting in a 25% increase in user engagement.
• Optimized application state management and backend API integrations, reducing overall page load latency by 40%.
• Collaborated with cross-functional product and design teams to build, test, and deploy 10+ core user-facing features using CI/CD pipelines.`
    }
    if (/designer|design|ui|ux/i.test(jobTitle)) {
      return `• Designed high-fidelity prototypes and interactive wireframes in Figma, improving usability test scores by 30%.
• Established a unified client-side design system, cutting product design-to-development handoff timelines by 15%.
• Conducted user research interviews and usability testing sessions with 15+ participants to guide product features.`
    }
    if (/manager|lead|director/i.test(jobTitle)) {
      return `• Led a cross-functional team of 6 engineers to deliver enterprise software features on-schedule and 10% under budget.
• Spearheaded Agile transformation processes, increasing team sprint velocity and project delivery predictability by 20%.
• Managed stakeholder communications and product roadmap planning, aligning technical execution with strategic business goals.`
    }
    if (/marketing|marketer|seo/i.test(jobTitle)) {
      return `• Led digital marketing campaigns that increased organic website traffic by 45% and drove $50K+ in sales pipeline.
• Optimized SEO strategies and keywords, achieving top-3 search rankings for 15+ high-intent search terms.
• Managed email marketing automation flows, increasing average click-through rates (CTR) by 18% over 6 months.`
    }
    // General default fallback
    return `• Led cross-functional initiatives to streamline departmental operations, increasing overall efficiency by 15%.
• Managed key project deliverables, ensuring alignment with client requirements and delivering 100% of milestones on schedule.
• Collaborated with team members to identify process improvements, resolving bottlenecks and reducing workflow times.`
  }

  if (type === 'summary') {
    return `Results-driven and strategic ${jobTitle} with over 4 years of experience delivering high-impact solutions. Proven track record of spearheading complex projects, optimizing workflows, and leveraging data-driven insights to achieve business outcomes. Skilled in collaborating with cross-functional partners and eager to contribute technical expertise and leadership to a dynamic team.`
  }

  if (type === 'improve') {
    // Clean weak phrasing and inject active tone
    let improved = prompt.trim()
    
    // Remove "I", "We", weak intros
    improved = improved.replace(/^i was responsible for\s+/i, '')
    improved = improved.replace(/^i did\s+/i, '')
    improved = improved.replace(/^i helped to\s+/i, 'Collaborated to ')
    improved = improved.replace(/^i worked on\s+/i, 'Engineered ')
    improved = improved.replace(/^my job was to\s+/i, 'Tasked with ')

    // Replace weak verbs with strong verbs at the beginning
    if (/^helped/i.test(improved)) improved = improved.replace(/^helped/i, 'Collaborated on')
    else if (/^made/i.test(improved)) improved = improved.replace(/^made/i, 'Created')
    else if (/^did/i.test(improved)) improved = improved.replace(/^did/i, 'Executed')
    else if (/^fixed/i.test(improved)) improved = improved.replace(/^fixed/i, 'Resolved')
    else if (/^managed/i.test(improved)) improved = improved.replace(/^managed/i, 'Spearheaded')
    else if (/^led/i.test(improved)) improved = improved.replace(/^led/i, 'Spearheaded')
    
    // Remove pronouns from body
    improved = improved.replace(/\bmy team\b/gi, 'the team')
    improved = improved.replace(/\bour clients\b/gi, 'clients')
    improved = improved.replace(/\bi did\b/gi, 'executed')
    improved = improved.replace(/\bwe created\b/gi, 'created')

    // Append mock metrics if none present
    if (!/\d+|%|\$/.test(improved)) {
      improved += ', resulting in a 15% increase in operational efficiency.'
    }

    // Capitalize first letter
    improved = improved.charAt(0).toUpperCase() + improved.slice(1)
    
    return improved
  }

  if (type === 'tailor') {
    // Inject keywords into prompt
    let tailored = prompt.trim()
    
    // Simple heuristic: append missing skills found in JD context
    tailored += ' utilizing industry-standard practices, React architectures, and TypeScript development pipelines to maximize scalability.'
    return tailored
  }

  return 'Generated content fallback.'
}

export async function generateContent(
  prompt: string,
  apiKey: string,
  type: 'bullet' | 'summary' | 'improve' | 'tailor'
): Promise<string> {
  // If apiKey is provided, make the real API request to Claude
  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          // Note: Browser headers might require bypassing CORS depending on environment.
          // This is the direct API call structure as requested.
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: RESUME_AI_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.content && data.content[0] && data.content[0].text) {
          return data.content[0].text
        }
      }
      console.warn('Claude API response error, falling back to local generator')
    } catch (e) {
      console.error('Claude API call failed, falling back to local generator:', e)
    }
  }

  // Fallback to local heuristic engine if API key is not present or API call fails
  return generateFallbackContent(prompt, type)
}

// Helper: Standardize date string to MM/YYYY
function cleanDate(dateStr: string): string {
  const clean = dateStr.trim()
  if (/^present|current$/i.test(clean)) {
    return 'Present'
  }

  // Check if it's already MM/YYYY
  if (/^\d{2}\/\d{4}$/.test(clean)) {
    return clean
  }

  // Parse Month Names
  const months: Record<string, string> = {
    january: '01', feb: '02', february: '02', mar: '03', march: '03',
    apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07',
    july: '07', aug: '08', august: '08', sep: '09', september: '09',
    oct: '10', october: '10', nov: '11', november: '11', dec: '12',
    december: '12', jan: '01'
  }

  const matches = clean.match(/([a-zA-Z]+)\s*\,?\s*(\d{4})/i)
  if (matches && matches[1] && matches[2]) {
    const monthName = matches[1].toLowerCase()
    const year = matches[2]
    const monthNum = months[monthName] || '01'
    return `${monthNum}/${year}`
  }

  // Check if it's just a 4 digit year
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
  // Replace pronouns at word boundaries (case-insensitive)
  let cleaned = bullet.replace(/\b(i|me|my|we|our)\b/gi, '').trim()
  
  // Clean up double spaces or commas created by removal
  cleaned = cleaned.replace(/\s+/g, ' ')
  cleaned = cleaned.replace(/\,\s*\,/g, ',')
  cleaned = cleaned.replace(/^\,\s*/, '')
  
  // Capitalize first word if it was affected
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  return cleaned
}

export function autoFix(resume: ResumeData): ResumeData {
  // Deep copy resume to avoid mutations
  const fixed: ResumeData = JSON.parse(JSON.stringify(resume))

  // 1. Clean contact info
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

  // 2. Clean summary
  fixed.summary = stripSpecialChars(fixed.summary)
  fixed.summary = stripPronouns(fixed.summary)

  // 3. Clean experience
  fixed.experience = fixed.experience.map((exp) => ({
    ...exp,
    jobTitle: stripSpecialChars(exp.jobTitle),
    company: stripSpecialChars(exp.company),
    location: stripSpecialChars(exp.location),
    startDate: cleanDate(exp.startDate),
    endDate: cleanDate(exp.endDate),
    bullets: exp.bullets.map(stripSpecialChars).map(stripPronouns)
  }))

  // 4. Clean education
  fixed.education = fixed.education.map((edu) => ({
    ...edu,
    degree: stripSpecialChars(edu.degree),
    school: stripSpecialChars(edu.school),
    location: stripSpecialChars(edu.location),
    graduationDate: cleanDate(edu.graduationDate)
  }))

  // 5. Clean skills
  fixed.skills = fixed.skills.map(stripSpecialChars)

  // 6. Clean projects
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
