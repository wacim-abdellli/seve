import { createContext } from 'react'
import type { ToastContextType } from '../types/toast'

export const ToastContext = createContext<ToastContextType | undefined>(undefined)
