import { useState, useCallback, useRef, useEffect } from 'react'

const MAX_HISTORY = 30

export function useUndoRedo<T>(initialState: T) {
  const [state, setStateInternal] = useState<T>(initialState)
  const historyRef = useRef<T[]>([initialState])
  const indexRef = useRef(0)
  const isUndoRedoRef = useRef(false)

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setStateInternal(prev => {
      const resolved = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prev)
        : newState

      if (!isUndoRedoRef.current) {
        historyRef.current = historyRef.current.slice(0, indexRef.current + 1)
        historyRef.current.push(resolved)
        if (historyRef.current.length > MAX_HISTORY) {
          historyRef.current.shift()
        } else {
          indexRef.current++
        }
      }

      return resolved
    })
  }, [])

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current--
      isUndoRedoRef.current = true
      setStateInternal(historyRef.current[indexRef.current])
      isUndoRedoRef.current = false
    }
  }, [])

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++
      isUndoRedoRef.current = true
      setStateInternal(historyRef.current[indexRef.current])
      isUndoRedoRef.current = false
    }
  }, [])

  const canUndo = indexRef.current > 0
  const canRedo = indexRef.current < historyRef.current.length - 1

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  const reset = useCallback((newInitialState: T) => {
    historyRef.current = [newInitialState]
    indexRef.current = 0
    isUndoRedoRef.current = true
    setStateInternal(newInitialState)
    isUndoRedoRef.current = false
  }, [])

  return { state, setState, undo, redo, canUndo, canRedo, reset }
}
