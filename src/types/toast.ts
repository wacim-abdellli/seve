export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}
