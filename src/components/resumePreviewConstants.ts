import type { Template } from '../types/resume'

export const templatesList: { id: Template; label: string; colorDot: string }[] = [
  { id: 'classic', label: 'Classic', colorDot: 'bg-zinc-400' },
  { id: 'modern', label: 'Modern', colorDot: 'bg-blue-500' },
  { id: 'executive', label: 'Executive', colorDot: 'bg-amber-500' },
  { id: 'minimalist', label: 'Minimalist', colorDot: 'bg-teal-500' },
  { id: 'creative', label: 'Creative', colorDot: 'bg-rose-500' },
  { id: 'compact', label: 'Compact', colorDot: 'bg-sky-500' },
  { id: 'professional', label: 'Professional', colorDot: 'bg-slate-600' },
  { id: 'technical', label: 'Technical', colorDot: 'bg-emerald-500' },
  { id: 'academic', label: 'Academic', colorDot: 'bg-violet-500' },
  { id: 'clean', label: 'Clean', colorDot: 'bg-teal-400' },
]

export const themeColors = [
  { value: '#b91c1c', label: 'Crimson', bgClass: 'bg-rose-500' },
  { value: '#7c3aed', label: 'Violet', bgClass: 'bg-violet-500' },
  { value: '#2563eb', label: 'Royal Blue', bgClass: 'bg-blue-600' },
  { value: '#0f766e', label: 'Teal/Emerald', bgClass: 'bg-teal-700' },
  { value: '#b45309', label: 'Bronze/Amber', bgClass: 'bg-amber-700' },
  { value: '#334155', label: 'Graphite', bgClass: 'bg-slate-600' },
]
