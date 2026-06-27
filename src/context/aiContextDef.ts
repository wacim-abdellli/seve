import type { AiConfig } from '../services/aiService'

export interface AiContextType {
  /** null means user has not configured a key yet */
  config: AiConfig | null
  /** shorthand — true if a key is configured */
  isConfigured: boolean
  /** true while any AI request is in flight */
  isLoading: boolean
  /** saves config to localStorage and state */
  saveConfig: (config: AiConfig) => void
  /** removes config from localStorage and state */
  clearConfig: () => void
}

import { createContext, useContext } from 'react'

export const AiContext = createContext<AiContextType | null>(null)

export function useAiContext(): AiContextType {
  const ctx = useContext(AiContext)
  if (!ctx) {
    throw new Error('useAiContext must be used inside <AiProvider>')
  }
  return ctx
}
