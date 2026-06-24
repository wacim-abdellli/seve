import type { ResumeData } from '../../types/resume'
import { CheckCircle2, Target, FileText, Zap, TrendingUp, Briefcase, AlertTriangle, FileCode, Shield } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function getCategoryTheme(id: string) {
  const common = {
    border: 'border-zinc-800',
    borderHover: 'hover:border-zinc-700',
    iconBg: 'bg-zinc-950 border border-zinc-800',
    glow: ''
  }

  if (id.startsWith('completeness') || id.startsWith('depth')) {
    return {
      ...common,
      label: 'Core Structure',
      text: 'text-indigo-400',
      leftAccent: 'border-l-4 border-l-indigo-500',
      bg: 'bg-indigo-500/5',
      icon: CheckCircle2 as LucideIcon
    }
  }
  if (id.startsWith('semantic') || id.startsWith('domain') || id.startsWith('keywords')) {
    return {
      ...common,
      label: 'Keyword Match',
      text: 'text-emerald-400',
      leftAccent: 'border-l-4 border-l-emerald-500',
      bg: 'bg-emerald-500/5',
      icon: Target as LucideIcon
    }
  }
  if (id.startsWith('formatting') || id.startsWith('projects') || id.startsWith('skills-')) {
    return {
      ...common,
      label: 'Parser Formatting',
      text: 'text-cyan-400',
      leftAccent: 'border-l-4 border-l-cyan-500',
      bg: 'bg-cyan-500/5',
      icon: FileText as LucideIcon
    }
  }
  if (id.startsWith('verbs')) {
    return {
      ...common,
      label: 'Action Verbs',
      text: 'text-violet-400',
      leftAccent: 'border-l-4 border-l-violet-500',
      bg: 'bg-violet-500/5',
      icon: Zap as LucideIcon
    }
  }
  if (id.startsWith('metrics')) {
    return {
      ...common,
      label: 'Metrics & Data',
      text: 'text-pink-400',
      leftAccent: 'border-l-4 border-l-pink-500',
      bg: 'bg-pink-500/5',
      icon: TrendingUp as LucideIcon
    }
  }
  if (id.startsWith('contact')) {
    return {
      ...common,
      label: 'Contact Info',
      text: 'text-blue-400',
      leftAccent: 'border-l-4 border-l-blue-500',
      bg: 'bg-blue-500/5',
      icon: Briefcase as LucideIcon
    }
  }
  if (id.startsWith('dates')) {
    return {
      ...common,
      label: 'Date Consistency',
      text: 'text-amber-400',
      leftAccent: 'border-l-4 border-l-amber-500',
      bg: 'bg-amber-500/5',
      icon: AlertTriangle as LucideIcon
    }
  }
  if (id.startsWith('length') || id.startsWith('page2')) {
    return {
      ...common,
      label: 'Optimal Length',
      text: 'text-orange-400',
      leftAccent: 'border-l-4 border-l-orange-500',
      bg: 'bg-orange-500/5',
      icon: FileCode as LucideIcon
    }
  }
  return {
    ...common,
    label: 'General Audit',
    text: 'text-indigo-400',
    leftAccent: 'border-l-4 border-l-indigo-500',
    bg: 'bg-indigo-500/5',
    icon: Shield as LucideIcon
  }
}

export function getResumeHash(data: ResumeData): string {
  try {
    const str = JSON.stringify(data)
    let hash = 2166136261
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = (hash * 16777619) >>> 0
    }
    return hash.toString(36)
  } catch {
    return ''
  }
}

export const SECTION_LABELS: Record<string, string> = {
  completeness: 'Core Structure',
  keywords: 'Keyword Match',
  formatting: 'Parser Formatting',
  actionVerbs: 'Action Verbs',
  quantifiedResults: 'Metrics & Data',
  contactInfo: 'Contact Info',
  dateConsistency: 'Date Consistency',
  length: 'Optimal Length',
}

export const BAR_COLORS: Record<string, string> = {
  completeness: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
  keywords: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
  formatting: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
  actionVerbs: 'bg-gradient-to-r from-violet-600 to-violet-400',
  quantifiedResults: 'bg-gradient-to-r from-pink-600 to-pink-400',
  contactInfo: 'bg-gradient-to-r from-blue-600 to-blue-400',
  dateConsistency: 'bg-gradient-to-r from-amber-600 to-amber-400',
  length: 'bg-gradient-to-r from-orange-600 to-orange-400',
}

export const SCAN_STAGES = [
  { label: 'Parsing document tree', pct: 8, log: 'reading DOM layout... 6 blocks mapped' },
  { label: 'Indexing contact metadata', pct: 16, log: 'extracted name, email, phone, linkedin' },
  { label: 'Extracting section boundaries', pct: 24, log: 'detected 5 core sections + 4 optional' },
  { label: 'Tokenizing bullet content', pct: 34, log: 'parsed 183 tokens across 12 entries' },
  { label: 'Cross-referencing skill taxonomy', pct: 44, log: 'matched 47 terms against role profile' },
  { label: 'Computing semantic density', pct: 54, log: 'weighting keyword clusters... 62 synonyms applied' },
  { label: 'Validating date consistency', pct: 62, log: 'checked 8 date fields — all ISO compliant' },
  { label: 'Scanning formatting safety', pct: 70, log: 'pronoun check passed • encoding clean' },
  { label: 'Rating bullet impact', pct: 80, log: 'scoring action verbs: 6 strong, 3 weak' },
  { label: 'Measuring section coverage', pct: 88, log: 'benchmarking vs 90th percentile profiles' },
  { label: 'Compiling dimension weights', pct: 95, log: 'applying 8 weighted metrics → composite score' },
  { label: 'Finalizing audit report', pct: 100, log: 'generating insights & recommendations...' },
]
