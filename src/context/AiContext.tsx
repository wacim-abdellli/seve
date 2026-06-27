import { useState, useCallback, type ReactNode } from 'react'
import type { AiConfig } from '../services/aiService'
import { AiContext } from './aiContextDef'

const AI_CONFIG_KEY = 'seve_ai_config'

// Default app-level config — uses Supabase Edge Function proxy (no key needed)
const APP_DEFAULT_CONFIG: AiConfig = {
  provider: 'app',
  apiKey: '__app__', // sentinel value — not actually used for auth
  model: 'llama-3.3-70b-versatile',
}

function loadConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (!raw) return APP_DEFAULT_CONFIG
    const parsed = JSON.parse(raw)
    if (parsed?.provider && parsed?.apiKey) return parsed as AiConfig
    return APP_DEFAULT_CONFIG
  } catch {
    return APP_DEFAULT_CONFIG
  }
}

export function AiProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AiConfig>(loadConfig)
  const [isLoading] = useState(false)

  const isUsingAppKey = config.provider === 'app'

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
    // Fall back to app default instead of null
    setConfig(APP_DEFAULT_CONFIG)
  }, [])

  return (
    <AiContext.Provider
      value={{
        config,
        isConfigured: true, // always true — app key is always available
        isUsingAppKey,
        isLoading,
        saveConfig,
        clearConfig,
      }}
    >
      {children}
    </AiContext.Provider>
  )
}
