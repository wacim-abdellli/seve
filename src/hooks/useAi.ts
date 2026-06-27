import { useAiContext } from '../context/aiContextDef'
import type { AiContextType } from '../context/aiContextDef'

/**
 * Hook to access the AI config and helpers.
 * Must be used inside <AiProvider>.
 *
 * Usage:
 *   const { isConfigured, config } = useAi()
 */
export function useAi(): AiContextType {
  return useAiContext()
}
