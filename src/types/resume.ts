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

export interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
  link?: string
}

export interface ResumeData {
  contact: ContactInfo
  summary: string
  experience: Experience[]
  education: Education[]
  skills: string[]
  projects?: Project[]
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
  failing: { issue: string; fix: string }[]
}

export type Template = 'classic' | 'modern' | 'executive' | 'minimalist' | 'creative'

export interface Message {
  id: string
  role: 'agent' | 'user'
  content: string
  timestamp: Date
}

export interface AppState {
  resumeData: ResumeData
  atsScore: AtsScore
  selectedTemplate: Template
  jobDescription: string
  apiKey: string
  agentMessages: Message[]
}
