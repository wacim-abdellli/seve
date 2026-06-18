import { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import PrivacyPage from './pages/PrivacyPage'
import EditorPage from './pages/EditorPage'
import EditorLayout from './layouts/EditorLayout'

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-zinc-400 mb-6">An unexpected error occurred. Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm font-medium transition-colors">
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'brand' | 'analyzing' | 'done'>('brand')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('analyzing'), 600)
    const t2 = setTimeout(() => {
      setPhase('done')
      setTimeout(() => onDone(), 400)
    }, 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950">
      <motion.div animate={{ scale: phase === 'done' ? 1.05 : 1 }} transition={{ duration: 0.3 }} className="flex flex-col items-center gap-6">
        <div className="relative">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-2xl shadow-rose-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          </motion.div>
          <motion.div animate={{ opacity: phase === 'done' ? 0 : [0, 0.3, 0], scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: phase === 'done' ? 0 : Infinity, ease: 'easeInOut' }} className="absolute inset-0 rounded-2xl border-2 border-rose-500/40" />
        </div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-white">Seve</h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Resume Builder</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-2">
          {phase === 'brand' && (
            <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 rounded-full border-2 border-rose-500/30 border-t-rose-400" /><span className="text-[11px] text-zinc-500">Initializing workspace...</span></>
          )}
          {phase === 'analyzing' && (
            <><motion.div className="flex gap-0.5">{[0, 1, 2].map((i) => (<motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} className="w-1 h-1 rounded-full bg-rose-400" />))}</motion.div><span className="text-[11px] text-zinc-500">Analyzing your setup...</span></>
          )}
          {phase === 'done' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-emerald-400 font-medium">Ready ✓</motion.span>}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div style={{ display: showSplash ? 'none' : 'block', height: '100vh' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route element={<EditorLayout />}>
            <Route path="/editor" element={<EditorPage />} />
          </Route>
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
