import type { ResumeData, SkillsMatrixItem, AtsIssue } from '../types/resume'
import { extractResumeText, detectLanguage } from './atsUtils'
import { expandResumeSkills } from './atsKeywords'

interface SkillCategoryConfig {
  subject: string
  keywords: string[]
}

export function getSkillCategoriesConfig(lang: 'en' | 'fr'): SkillCategoryConfig[] {
  return [
    {
      subject: lang === 'fr' ? 'Langages & Algorithmique' : 'Languages & Core Tech',
      keywords: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'html', 'css', 'sql', 'bash', 'shell', 'r', 'c']
    },
    {
      subject: lang === 'fr' ? 'Frameworks & Libs' : 'Frameworks & Libs',
      keywords: ['react', 'angular', 'vue', 'svelte', 'nextjs', 'next.js', 'nuxt', 'django', 'flask', 'fastapi', 'express', 'nestjs', 'rails', 'spring', 'springboot', 'laravel', 'tailwind', 'bootstrap', 'redux', 'graphql', 'jquery']
    },
    {
      subject: lang === 'fr' ? 'Bases de Données & Architecture' : 'Databases & Systems',
      keywords: ['postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'nosql', 'dynamodb', 'cassandra', 'elasticsearch', 'mariadb', 'microservices', 'rest', 'api', 'apis', 'grpc', 'rabbitmq', 'kafka', 'graphql', 'system design', 'architecture']
    },
    {
      subject: lang === 'fr' ? 'DevOps & Cloud' : 'DevOps & Cloud',
      keywords: ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'git', 'github', 'gitlab', 'terraform', 'ansible', 'jenkins', 'linux', 'cloudflare', 'prometheus', 'grafana', 'travis']
    },
    {
      subject: lang === 'fr' ? 'Méthodologies & Soft Skills' : 'Methodology & Soft Skills',
      keywords: ['agile', 'scrum', 'kanban', 'leadership', 'management', 'communication', 'collaboration', 'product management', 'project management', 'mentoring', 'coaching', 'teamwork', 'problem solving', 'creative', 'organization']
    }
  ]
}

export function calculateSkillsMatrix(resume: ResumeData, jobDescription: string): SkillsMatrixItem[] {
  const raw = extractResumeText(resume) as string
  const lowerResume = raw.toLowerCase()
  const lowerJd = jobDescription.toLowerCase()
  const lang = detectLanguage(raw)

  const SKILL_CATEGORIES_CONFIG = getSkillCategoriesConfig(lang)

  const checkPresence = (sourceText: string, keyword: string): boolean => {
    if (/[^a-z0-9\u00c0-\u00ff]/i.test(keyword)) {
      return sourceText.includes(keyword.toLowerCase())
    }
    const regex = new RegExp(`\\b${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i')
    return regex.test(sourceText)
  }

  const allConfigKeywords = SKILL_CATEGORIES_CONFIG.reduce((acc, cat) => {
    return acc.concat(cat.keywords)
  }, [] as string[])

  const directResumeKeywords = new Set(
    allConfigKeywords.filter(kw => checkPresence(lowerResume, kw))
  )

  const expandedResumeKeywords = expandResumeSkills(directResumeKeywords)

  return SKILL_CATEGORIES_CONFIG.map(cat => {
    // Find which words in this category are in JD
    const jdWords = cat.keywords.filter(kw => checkPresence(lowerJd, kw))
    
    // Find which words in this category are in Resume
    const resumeWords = cat.keywords.filter(kw => checkPresence(lowerResume, kw) || expandedResumeKeywords.has(kw))

    let candidateScore
    let requiredScore
    let matched: string[]
    let missing: string[]

    if (jdWords.length > 0) {
      // Required level is determined by intensity in the JD
      requiredScore = Math.min(100, 50 + jdWords.length * 10)
      
      // Matched are words that exist in both
      matched = jdWords.filter(w => resumeWords.includes(w))
      missing = jdWords.filter(w => !resumeWords.includes(w))
      
      // Cap candidate score at requiredScore (since we compare them)
      candidateScore = Math.min(100, Math.round((matched.length / jdWords.length) * 100))
    } else {
      // Fallback standard when JD has no keywords in this category
      requiredScore = 40 // baseline
      matched = resumeWords
      missing = []
      
      // Standard score compared to common tech base in this category (up to 4 items is considered 100%)
      const maxExpectedCommon = 4
      candidateScore = Math.min(100, Math.round((resumeWords.length / maxExpectedCommon) * 100))
    }

    // Format capitalizations nicely for presentation
    const formatWord = (w: string) => {
      if (w === 'javascript') return 'JavaScript'
      if (w === 'typescript') return 'TypeScript'
      if (w === 'html') return 'HTML'
      if (w === 'css') return 'CSS'
      if (w === 'sql') return 'SQL'
      if (w === 'nextjs' || w === 'next.js') return 'Next.js'
      if (w === 'vue') return 'Vue.js'
      if (w === 'nestjs') return 'NestJS'
      if (w === 'springboot') return 'Spring Boot'
      if (w === 'gcp') return 'Google Cloud (GCP)'
      if (w === 'aws') return 'AWS'
      if (w === 'ci/cd') return 'CI/CD'
      if (w === 'postgres' || w === 'postgresql') return 'PostgreSQL'
      if (w === 'nosql') return 'NoSQL'
      if (w === 'dynamodb') return 'DynamoDB'
      if (w === 'mongodb') return 'MongoDB'
      if (w === 'elasticsearch') return 'Elasticsearch'
      if (w === 'microservices') return 'Microservices'
      if (w === 'system design') return 'System Design'
      if (w === 'project management') return 'Project Management'
      if (w === 'product management') return 'Product Management'
      if (w === 'problem solving') return 'Problem Solving'
      return w.charAt(0).toUpperCase() + w.slice(1)
    }

    return {
      subject: cat.subject,
      candidate: candidateScore,
      required: requiredScore,
      matched: matched.map(formatWord),
      missing: missing.map(formatWord)
    }
  })
}

export function evaluateSkillsQuality(resume: ResumeData): AtsIssue[] {
  const issues: AtsIssue[] = []
  const skills = resume.skills || []
  const skillsRawText = skills.join(' ')
  if (skills.length > 8 && !skillsRawText.includes(':')) {
    issues.push({
      id: 'skills-ungrouped',
      type: 'suggestion',
      category: 'structure',
      issue: `${skills.length} skills listed without categories — harder for ATS to classify.`,
      fix: 'Group skills by category: "Frontend: React, TypeScript | Backend: Node.js | Infra: AWS, Docker"',
      section: 'skills',
      severityScore: 4,
      autoFixable: false,
    })
  }
  return issues
}
