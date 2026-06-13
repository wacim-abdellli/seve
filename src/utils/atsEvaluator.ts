import type { ResumeData, AtsScore } from '../types/resume'

// Helper list of strong action verbs
const STRONG_VERBS = new Set([
  'led', 'built', 'created', 'designed', 'developed', 'managed',
  'increased', 'decreased', 'improved', 'launched', 'delivered',
  'achieved', 'executed', 'optimized', 'automated', 'coordinated',
  'generated', 'reduced', 'implemented', 'streamlined', 'negotiated',
  'established', 'transformed', 'spearheaded', 'drove', 'deployed',
  'engineered', 'analyzed', 'produced', 'trained', 'mentored',
  'directed', 'facilitated', 'collaborated', 'resolved', 'maintained',
  'monitored', 'supported', 'authored'
])

// Helper list of common English stopwords
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'and', 'or', 'but', 'if', 'about', 'by'
])

// Helper function to extract words from text
function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // replace punctuation with spaces
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

// Date parsing helpers
function detectDateFormat(dateStr: string): 'MM/YYYY' | 'Month YYYY' | 'Invalid' {
  const clean = dateStr.trim()
  if (/^present|current$/i.test(clean)) {
    return 'MM/YYYY' // Treat "Present" as matching whatever the other date is
  }

  // MM/YYYY: matches 01/2020 or 12/2026
  if (/^(0[1-9]|1[0-2])\/\d{4}$/.test(clean)) {
    return 'MM/YYYY'
  }

  // Month YYYY: matches May 2020 or December 2026
  const monthRegex = /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}$/i
  if (monthRegex.test(clean)) {
    return 'Month YYYY'
  }

  return 'Invalid'
}

export function evaluateResume(resume: ResumeData, jobDescription: string): AtsScore {
  const passing: string[] = []
  const failing: { issue: string; fix: string }[] = []

  // 1. Section Completeness (Max 20 pts)
  let sectionCompleteness = 0
  const completenessChecks = {
    contact: resume.contact && resume.contact.fullName.trim() !== '',
    summary: resume.summary && resume.summary.trim() !== '',
    experience: resume.experience && resume.experience.length > 0,
    education: resume.education && resume.education.length > 0,
    skills: resume.skills && resume.skills.length > 0,
  }

  Object.entries(completenessChecks).forEach(([section, present]) => {
    if (present) {
      sectionCompleteness += 4
    } else {
      failing.push({
        issue: `Missing or empty section: ${section}`,
        fix: `Add content to your ${section} section. ATS scanners require all key sections to parse your background.`,
      })
    }
  })
  if (sectionCompleteness === 20) {
    passing.push('All 5 core sections present')
  }

  // Compile full resume text for search matching
  let fullResumeText = ''
  if (resume.contact) {
    fullResumeText += ` ${resume.contact.fullName} ${resume.contact.email} ${resume.contact.phone} ${resume.contact.linkedin} ${resume.contact.location} ${resume.contact.website || ''}`
  }
  fullResumeText += ` ${resume.summary}`
  resume.experience.forEach((exp) => {
    fullResumeText += ` ${exp.jobTitle} ${exp.company} ${exp.location} ${exp.bullets.join(' ')}`
  })
  resume.education.forEach((edu) => {
    fullResumeText += ` ${edu.degree} ${edu.school} ${edu.location}`
  })
  fullResumeText += ` ${resume.skills.join(' ')}`
  if (resume.projects) {
    resume.projects.forEach((proj) => {
      fullResumeText += ` ${proj.name} ${proj.description} ${proj.technologies.join(' ')}`
    })
  }
  const lowerResume = fullResumeText.toLowerCase()

  // 2. Keyword Match (Max 25 pts)
  let keywordMatch = 0
  let totalKeywords = 0
  let matchedKeywordsCount = 0

  if (jobDescription.trim() !== '') {
    const jdWords = getWords(jobDescription)
    // Filter out stopwords and get unique keywords
    const uniqueJdKeywords = Array.from(new Set(jdWords.filter((w) => !STOPWORDS.has(w))))
    totalKeywords = uniqueJdKeywords.length

    if (totalKeywords > 0) {
      const matchedKeywordsList: string[] = []
      const missingKeywordsList: string[] = []

      uniqueJdKeywords.forEach((kw) => {
        // Use word inclusions check
        if (lowerResume.includes(kw)) {
          matchedKeywordsCount++
          matchedKeywordsList.push(kw)
        } else {
          missingKeywordsList.push(kw)
        }
      })

      keywordMatch = Math.round((matchedKeywordsCount / totalKeywords) * 25)
      
      if (keywordMatch >= 20) {
        passing.push(`High keyword match (${keywordMatch}/25 pts)`)
      } else {
        const sampleMissing = missingKeywordsList.slice(0, 5).join(', ')
        failing.push({
          issue: `Low job keyword match (${matchedKeywordsCount}/${totalKeywords} words found)`,
          fix: `Tailor your resume by adding keywords from the job description, such as: "${sampleMissing}".`,
        })
      }
    }
  } else {
    // If no JD, default to 0 for keyword match but give advice
    failing.push({
      issue: 'No target job description provided',
      fix: 'Paste a job description in the "Tailor JD" tab to analyze keyword matching and improve your score.',
    })
  }

  // 3. Formatting Safety (Max 20 pts)
  let formattingSafety = 20

  // 3a. Special chars (★ ✓ ► ◆)
  const forbiddenCharsRegex = /[★✓►◆■●▪▲▼◆◇○◎●★☆]/g
  const hasSpecialChars = forbiddenCharsRegex.test(fullResumeText)
  if (hasSpecialChars) {
    formattingSafety -= 5
    failing.push({
      issue: 'Non-standard symbols or special characters found (e.g. ★, ✓, ►, ◆)',
      fix: 'Remove symbols like checkboxes, stars, or fancy arrows. ATS parsers often scramble these characters.',
    })
  } else {
    passing.push('No ATS-breaking symbols')
  }

  // 3b. Personal pronouns (I, me, my, we, our)
  const pronounRegex = /\b(i|me|my|we|our)\b/i
  // We check summary and experience bullets
  const hasPronouns = pronounRegex.test(resume.summary) || resume.experience.some((exp) => exp.bullets.some((b) => pronounRegex.test(b)))
  if (hasPronouns) {
    formattingSafety -= 5
    failing.push({
      issue: 'First-person pronouns found (e.g., "I", "me", "my", "we")',
      fix: 'Rewrite sentences to omit personal pronouns. Instead of "I managed a team", write "Managed a team of..."',
    })
  } else {
    passing.push('Pronoun-free professional style')
  }

  // 3c. Missing standard sections
  const hasStandardSections = completenessChecks.experience && completenessChecks.education && completenessChecks.skills
  if (!hasStandardSections) {
    formattingSafety -= 5
    failing.push({
      issue: 'Missing key professional headings',
      fix: 'Ensure your resume explicitly contains sections named "Experience", "Education", and "Skills".',
    })
  }

  // 3d. Date formatting inconsistencies
  let dateConsistencyIssue = false
  const allDates: string[] = []
  resume.experience.forEach((exp) => {
    if (exp.startDate) allDates.push(exp.startDate)
    if (exp.endDate) allDates.push(exp.endDate)
  })
  resume.education.forEach((edu) => {
    if (edu.graduationDate) allDates.push(edu.graduationDate)
  })

  const formats = allDates.map(detectDateFormat)
  const invalidDates = formats.filter((f) => f === 'Invalid')
  const uniqueFormats = Array.from(new Set(formats.filter((f) => f !== 'Invalid')))

  if (invalidDates.length > 0 || uniqueFormats.length > 1) {
    formattingSafety -= 5
    dateConsistencyIssue = true
    failing.push({
      issue: 'Inconsistent or invalid date formatting',
      fix: 'Format all dates uniformly as MM/YYYY (e.g. "05/2021") or Month YYYY (e.g. "May 2021"). Avoid mixing styles.',
    })
  }

  // 4. Action Verbs (Max 10 pts)
  let actionVerbs = 0
  let totalBullets = 0
  let goodBullets = 0

  resume.experience.forEach((exp) => {
    exp.bullets.forEach((b) => {
      totalBullets++
      const cleanBullet = b.trim().replace(/^[^\w]+/, '') // strip leading bullet symbols
      const firstWord = cleanBullet.split(/\s+/)[0]?.toLowerCase()
      if (firstWord && STRONG_VERBS.has(firstWord)) {
        goodBullets++
      }
    })
  })

  if (totalBullets > 0) {
    actionVerbs = Math.round((goodBullets / totalBullets) * 10)
    if (actionVerbs >= 8) {
      passing.push('Strong action-oriented phrasing')
    } else {
      failing.push({
        issue: `Weak action verbs in bullet points (${goodBullets}/${totalBullets} pass)`,
        fix: 'Start every bullet point in your work experience with a strong action verb (e.g. "Engineered", "Optimized", "Led").',
      })
    }
  } else if (completenessChecks.experience) {
    failing.push({
      issue: 'No bullet points in work experience',
      fix: 'Add descriptive bullet points to your work experience roles starting with action verbs.',
    })
  }

  // 5. Quantified Results (Max 10 pts)
  let quantifiedResults = 0
  let quantifiedBullets = 0

  resume.experience.forEach((exp) => {
    exp.bullets.forEach((b) => {
      // Regex detects numbers, %, $, metrics
      if (/\b\d+\b|%|\$|million|billion|thousand/i.test(b)) {
        quantifiedBullets++
      }
    })
  })

  if (totalBullets > 0) {
    quantifiedResults = Math.round((quantifiedBullets / totalBullets) * 10)
    if (quantifiedResults >= 5) {
      passing.push('Quantified achievements present')
    } else {
      failing.push({
        issue: `Achievements lack metrics or numbers (${quantifiedBullets}/${totalBullets} quantified)`,
        fix: 'Add metrics (%, $, numbers, timelines) to show the concrete impact of your work (e.g. "Increased revenue by 15%").',
      })
    }
  }

  // 6. Contact Info (Max 5 pts)
  let contactInfo = 0
  if (resume.contact) {
    if (resume.contact.fullName?.trim()) contactInfo += 1
    if (resume.contact.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.contact.email)) contactInfo += 1
    if (resume.contact.phone?.trim()) contactInfo += 1
    if (resume.contact.linkedin?.trim()) contactInfo += 1
    if (resume.contact.location?.trim()) contactInfo += 1
  }

  if (contactInfo === 5) {
    passing.push('Contact info complete')
  } else {
    const missing = []
    if (!resume.contact?.fullName?.trim()) missing.push('name')
    if (!resume.contact?.email?.trim()) missing.push('email')
    if (!resume.contact?.phone?.trim()) missing.push('phone')
    if (!resume.contact?.linkedin?.trim()) missing.push('LinkedIn')
    if (!resume.contact?.location?.trim()) missing.push('location')

    failing.push({
      issue: `Incomplete contact information`,
      fix: `Provide your: ${missing.join(', ')}. Contact details are essential for hiring managers.`,
    })
  }

  // 7. Date Consistency (Max 5 pts)
  let dateConsistency = 5
  if (dateConsistencyIssue) {
    dateConsistency = 0
  } else if (allDates.length > 0) {
    passing.push('Consistent date formats throughout')
  }

  // 8. Length Appropriateness (Max 5 pts)
  let lengthAppropriateness = 5
  // Simple word count helper
  const wordCount = lowerResume.split(/\s+/).filter((w) => w.length > 0).length

  // Deduce years of experience (estimate based on experience entries, or assume standard)
  const estimatedYears = resume.experience.length * 2 // simple approximation
  
  if (estimatedYears <= 5) {
    // 1 page expected: 300 to 700 words
    if (wordCount < 250) {
      lengthAppropriateness = 2
      failing.push({
        issue: `Resume length is too short (${wordCount} words)`,
        fix: 'Expand your experience and project descriptions to reach at least 300-400 words to give enough context.',
      })
    } else if (wordCount > 750) {
      lengthAppropriateness = 3
      failing.push({
        issue: `Resume is too long for your experience (${wordCount} words)`,
        fix: 'Condense your bullet points. Keep your resume to exactly 1 page (under 700 words) for 0-5 years of experience.',
      })
    } else {
      passing.push('Optimal resume length (1 page)')
    }
  } else {
    // 5+ years expected: 1-2 pages: 500 to 1200 words
    if (wordCount < 400) {
      lengthAppropriateness = 3
      failing.push({
        issue: `Resume is too brief for senior experience (${wordCount} words)`,
        fix: 'Detail your achievements and leadership roles. Aim for 600-1000 words.',
      })
    } else if (wordCount > 1300) {
      lengthAppropriateness = 2
      failing.push({
        issue: `Resume is excessively long (${wordCount} words)`,
        fix: 'Trim bullet points and remove outdated experience. Keep your resume under 1200 words (max 2 pages).',
      })
    } else {
      passing.push('Optimal resume length (1-2 pages)')
    }
  }

  // Total Score (Max 100)
  const total = sectionCompleteness + keywordMatch + formattingSafety + actionVerbs + quantifiedResults + contactInfo + dateConsistency + lengthAppropriateness

  // Grade Mapping
  let grade = 'F'
  if (total >= 90) grade = 'Excellent (A)'
  else if (total >= 70) grade = 'Good (B)'
  else if (total >= 50) grade = 'Needs Work (C)'
  else grade = 'Poor (F)'

  return {
    total,
    grade,
    sections: {
      sectionCompleteness,
      keywordMatch,
      formattingSafety,
      actionVerbs,
      quantifiedResults,
      contactInfo,
      dateConsistency,
      lengthAppropriateness,
    },
    passing,
    failing,
  }
}
