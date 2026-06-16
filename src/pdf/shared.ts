import type { ResumeData, Template } from '../types/resume'

export type SectionId = 'summary' | 'experience' | 'projects' | 'education' | 'skills'

export const SANS = 'Inter'
export const SERIF = 'EB Garamond'

export interface TemplateTheme {
  fontFamily: string
  primaryColor: string
  headingColor: string
  textColor: string
  mutedColor: string
}

export function t(base: number, scale: number): number {
  return base * scale
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean.length >= 6
        ? clean.slice(0, 6)
        : '000000'
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ME'
  )
}

export function boldStyle(family: string) {
  return { fontFamily: family, fontWeight: 700 as const }
}

export function italicStyle(family: string) {
  if (family === SERIF) {
    return { fontFamily: family, fontStyle: 'italic' as const }
  }
  return { fontFamily: family, fontWeight: 400 as const, color: '#64748b' }
}

export function getTemplateTheme(template: Template, themeColor?: string): TemplateTheme {
  const accent = themeColor || '#e11d48'

  switch (template) {
    case 'classic':
      return {
        fontFamily: SERIF,
        primaryColor: accent,
        headingColor: '#0f172a',
        textColor: '#334155',
        mutedColor: '#64748b',
      }
    case 'minimalist':
      return {
        fontFamily: SERIF,
        primaryColor: accent,
        headingColor: '#111111',
        textColor: '#27272a',
        mutedColor: '#71717a',
      }
    case 'modern':
      return {
        fontFamily: SANS,
        primaryColor: accent,
        headingColor: '#0f172a',
        textColor: '#334155',
        mutedColor: '#64748b',
      }
    case 'executive':
      return {
        fontFamily: SANS,
        primaryColor: accent,
        headingColor: '#0f172a',
        textColor: '#334155',
        mutedColor: '#64748b',
      }
    case 'creative':
      return {
        fontFamily: SANS,
        primaryColor: accent,
        headingColor: '#0f172a',
        textColor: '#334155',
        mutedColor: '#64748b',
      }
    default:
      return {
        fontFamily: SERIF,
        primaryColor: accent,
        headingColor: '#0f172a',
        textColor: '#334155',
        mutedColor: '#64748b',
      }
  }
}

export function filterResumeData(data: ResumeData) {
  return {
    experience: (data.experience || []).filter((exp) => exp.jobTitle?.trim() && exp.company?.trim()),
    education: (data.education || []).filter((edu) => edu.school?.trim() && edu.degree?.trim()),
    projects: (data.projects || []).filter((proj) => proj.name?.trim()),
    skills: (data.skills || []).filter((skill) => skill?.trim()),
  }
}

export function parseSkill(skill: string) {
  const parts = skill.split(':')
  const hasCategory = parts.length > 1 && parts[0].trim().length < 30
  return {
    hasCategory,
    category: hasCategory ? parts[0].trim() : '',
    value: hasCategory ? parts.slice(1).join(':') : skill,
  }
}

export function stripLinkedIn(url: string): string {
  return url.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '')
}

export function stripWebsite(url: string): string {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '')
}
