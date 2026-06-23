export interface ContactInfo {
  fullName: string
  email: string
  phone: string
  linkedin: string
  location: string
  website?: string
}

export interface Experience {
  id: string
  jobTitle: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface Education {
  id: string
  degree: string
  school: string
  location: string
  graduationDate: string
  gpa?: string
}

export interface Language {
  id: string
  name: string
  proficiency: string
}

export interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
  link?: string
  startDate?: string
  endDate?: string
  date?: string
}

export interface Award {
  id: string
  title: string
  awarder: string
  date: string
  description: string
}

export interface Certification {
  id: string
  title: string
  issuer: string
  date: string
  description: string
}

export interface Interest {
  id: string
  name: string
  keywords: string[]
}

export interface Publication {
  id: string
  title: string
  publisher: string
  date: string
  description: string
}

export interface Reference {
  id: string
  name: string
  position: string
  phone: string
  description: string
}

export interface Volunteer {
  id: string
  organization: string
  location: string
  period: string
  description: string
  startDate?: string
  endDate?: string
}

export interface ResumeData {
  contact: ContactInfo
  summary: string
  experience: Experience[]
  education: Education[]
  skills: string[]
  languages?: Language[]
  projects?: Project[]
  awards?: Award[]
  certifications?: Certification[]
  interests?: Interest[]
  publications?: Publication[]
  references?: Reference[]
  volunteer?: Volunteer[]
}

export interface AtsScore {
  total: number
  grade: string
  sections: {
    sectionCompleteness: number
    keywordMatch: number
    formattingSafety: number
    actionVerbs: number
    quantifiedResults: number
    contactInfo: number
    dateConsistency: number
    lengthAppropriateness: number
  }
  passing: string[]
  failing: { issue: string; fix: string; section?: string }[]
}

export interface ResumeStylePreferences {
  headingFont: string
  bodyFont: string
  lineHeight: number
  letterSpacing: string
  headingCase: 'uppercase' | 'capitalize' | 'normal'
  pagePadding: number
  sectionSpacing: number
  itemSpacing: number
  bulletIndent: number
  bodyTextColor: string
  headingColor: string
  dividerStyle: 'none' | 'solid' | 'dashed' | 'dotted'
  dividerWidth: number
  highContrastPrint: boolean
  atsOptimizedFont: boolean
  dividerColor: string
  sectionCutStyle: 'none' | 'bottom-line' | 'left-accent' | 'card' | 'stripe'
  sectionBgColor: string
  sectionBorderColor: string
}

export const DEFAULT_STYLE_PREFS: ResumeStylePreferences = {
  headingFont: '',
  bodyFont: '',
  lineHeight: 1.25,
  letterSpacing: 'normal',
  headingCase: 'uppercase',
  pagePadding: 16,
  sectionSpacing: 12,
  itemSpacing: 8,
  bulletIndent: 16,
  bodyTextColor: '#334155',
  headingColor: '#0f172a',
  dividerStyle: 'solid',
  dividerWidth: 1,
  highContrastPrint: false,
  atsOptimizedFont: false,
  dividerColor: 'theme',
  sectionCutStyle: 'none',
  sectionBgColor: '#f8fafc',
  sectionBorderColor: '#e2e8f0',
}

export type Template = 'classic' | 'modern' | 'executive' | 'minimalist' | 'creative' | 'compact' | 'professional' | 'technical' | 'academic' | 'clean'

export interface ResumeProfile {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  resumeData: ResumeData
  selectedTemplate: Template
  jobDescription: string
  sectionOrder: string[]
  themeColor?: string
  templateFontSize?: number
  templateFontWeight?: number
  stylePrefs?: ResumeStylePreferences
  revision: number
}

export interface AppState {
  resumes: Record<string, ResumeProfile>
  selectedResumeId: string
}

export interface SkillsMatrixItem {
  subject: string
  candidate: number
  required: number
  matched: string[]
  missing: string[]
}

/* ─── Phase 1: ATS Report Types ─── */

export type SectionTier = 'core' | 'expected' | 'optional' | 'hidden'

export interface AtsIssue {
  id: string
  type: 'critical' | 'warning' | 'suggestion' | 'info'
  category: 'completeness' | 'keywords' | 'formatting' | 'style' | 'structure' | 'semantic'
  issue: string
  fix: string
  section?: string
  bulletIndex?: number
  details?: string[]
  severityScore: number
  autoFixable: boolean
  learnMore?: string
}

export interface AtsCategoryScore {
  key: string
  label: string
  score: number
  max: number
  weight: number
  issues: AtsIssue[]
}

export interface AtsReport {
  total: number
  previousScore?: number
  trend: 'up' | 'down' | 'stable'
  grade: string
  gradeLabel: string
  categories: AtsCategoryScore[]
  critical: AtsIssue[]
  warnings: AtsIssue[]
  suggestions: AtsIssue[]
  passing: string[]
  skillsMatrix: SkillsMatrixItem[]
  language: 'en' | 'fr'
  semanticScore: number
  wordCount: number
  sectionCount: number
  estimatedReadTime: number
  atsParseability: number
  readingLevel: number
  timeline: { date: number; score: number; label: string }[]
  engineVersion: number
  resumeDomain?: string
  jdDomain?: string
  breakdown: { key: string; label: string; score: number; max: number }[]
}

export type AtsRating = 'safe' | 'warning' | 'danger'

export interface AtsRatingResult {
  rating: AtsRating
  feedback?: string
  issues: AtsIssue[]
}

/* ─── Phase 2: Industry Profiles ─── */

export interface IndustryProfile {
  id: string
  name: string
  expectedSections: string[]
  preferredOrder: string[]
  synonymOverrides: Record<string, string[]>
  lengthExpectation: 'short' | 'standard' | 'long'
  verbPreference: 'technical' | 'leadership' | 'creative'
  weightAdjustments: Partial<Record<string, number>>
}
