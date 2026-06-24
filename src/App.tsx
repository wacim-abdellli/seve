import { useState, useEffect, lazy, Suspense, Component, type ErrorInfo, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const EditorPage = lazy(() => import('./pages/EditorPage'))
const EditorLayout = lazy(() => import('./layouts/EditorLayout'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('App crashed:', error, info)
    }
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
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 splash-exit ${phase === 'done' ? 'splash-exit-active' : ''}`}>
      <div className={`flex flex-col items-center gap-6 splash-scale ${phase === 'done' ? 'splash-scale-done' : ''}`}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-2xl shadow-rose-500/20 splash-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className={`absolute inset-0 rounded-2xl border-2 border-rose-500/40 splash-ring ${phase === 'done' ? 'splash-ring-done' : ''}`} />
        </div>
        <div className="splash-text text-center">
          <h1 className="text-2xl font-black tracking-tight text-white">Seve</h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Resume Builder</p>
        </div>
        <div className="splash-status flex items-center gap-2">
          {phase === 'brand' && (
            <><div className="splash-spinner w-3.5 h-3.5 rounded-full border-2 border-rose-500/30 border-t-rose-400" /><span className="text-[11px] text-zinc-500">Initializing workspace...</span></>
          )}
          {phase === 'analyzing' && (
            <><div className="flex gap-0.5 splash-bounce-group">{[0, 1, 2].map((i) => (<div key={i} className="w-1 h-1 rounded-full bg-rose-400 splash-bounce-dot" style={{ animationDelay: `${i * 0.15}s` }} />))}</div><span className="text-[11px] text-zinc-500">Analyzing your setup...</span></>
          )}
          {phase === 'done' && <span className="splash-fade-in text-[11px] text-emerald-400 font-medium">Ready ✓</span>}
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem('seve_visited')
  })

  const handleSplashDone = () => {
    localStorage.setItem('seve_visited', '1')
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <div style={{ display: showSplash ? 'none' : 'block', height: '100vh' }}>
        <Suspense fallback={<div className="flex items-center justify-center h-full bg-zinc-950 text-zinc-400 text-sm">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route element={<EditorLayout />}>
              <Route path="/editor" element={<EditorPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
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
