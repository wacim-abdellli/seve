import type { AiConfig } from '../services/aiService'

export interface AiContextType {
  /** Current AI config — always set (defaults to app proxy) */
  config: AiConfig
  /** Always true — app key is always available as fallback */
  isConfigured: boolean
  /** true when using Seve's built-in AI (no user key set) */
  isUsingAppKey: boolean
  /** true while any AI request is in flight */
  isLoading: boolean
  /** saves config to localStorage and state */
  saveConfig: (config: AiConfig) => void
  /** removes user key and resets to app default */
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
