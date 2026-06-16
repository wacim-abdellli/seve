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

export type Template = 'classic' | 'modern' | 'executive' | 'minimalist' | 'creative'

export interface Message {
  id: string
  role: 'agent' | 'user'
  content: string
  timestamp: Date
}

export interface ResumeProfile {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  resumeData: ResumeData
  selectedTemplate: Template
  jobDescription: string
  agentMessages: Message[]
}

export interface AppState {
  resumes: Record<string, ResumeProfile>
  selectedResumeId: string
  apiKey: string
}

