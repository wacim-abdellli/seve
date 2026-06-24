import { createContext, useContext } from 'react'

export type SectionKey = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer'

interface SectionReorderContextType {
  moveSection: (sectionId: SectionKey, direction: 'up' | 'down') => void
}

const SectionReorderContext = createContext<SectionReorderContextType | null>(null)

export function useSectionReorder() {
  return useContext(SectionReorderContext)
}

export const SectionReorderProvider = SectionReorderContext.Provider

export function isSectionKey(id: string): id is SectionKey {
  const VALID_KEYS: SectionKey[] = ['contact', 'summary', 'experience', 'education', 'skills', 'languages', 'projects', 'awards', 'certifications', 'interests', 'publications', 'references', 'volunteer']
  return VALID_KEYS.includes(id as SectionKey)
}
