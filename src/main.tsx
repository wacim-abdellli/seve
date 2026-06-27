import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ResumeProvider } from './context/ResumeContext'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './context/AuthContext'
import { AiProvider } from './context/AiContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <ResumeProvider>
          <AiProvider>
            <App />
          </AiProvider>
        </ResumeProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)

