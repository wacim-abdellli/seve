import { useState, useCallback, type ReactNode } from 'react'
import type { AiConfig } from '../services/aiService'
import { AiContext } from './aiContextDef'

const AI_CONFIG_KEY = 'seve_ai_config'

function loadConfig(): AiConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.provider && parsed?.apiKey) return parsed as AiConfig
    return null
  } catch {
    return null
  }
}

export function AiProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AiConfig | null>(loadConfig)
  const [isLoading] = useState(false)

  const saveConfig = useCallback((newConfig: AiConfig) => {
    try {
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(newConfig))
    } catch { /* ignore storage errors */ }
    setConfig(newConfig)
  }, [])

  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(AI_CONFIG_KEY)
    } catch { /* ignore */ }
    setConfig(null)
  }, [])

  return (
    <AiContext.Provider
      value={{
        config,
        isConfigured: config !== null && !!config.apiKey,
        isLoading,
        saveConfig,
        clearConfig,
      }}
    >
      {children}
    </AiContext.Provider>
  )
}

// Expose setter so aiService callers can toggle loading state
export { useState as _useLoadingState }
