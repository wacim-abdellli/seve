import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-6">
      <div className="relative mb-6">
        <span className="text-8xl font-black text-zinc-800 select-none">404</span>
        <span className="absolute inset-0 flex items-center justify-center text-8xl font-black text-transparent bg-gradient-to-r from-red-500 to-red-700 bg-clip-text opacity-40 blur-sm">404</span>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-sm text-zinc-400 mb-8 max-w-md">
        The page you're looking for doesn't exist. Let's get you back to building your resume.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          Home
        </button>
        <button
          onClick={() => navigate('/editor')}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-500 transition-colors"
        >
          Open Editor
        </button>
      </div>
    </div>
  )
}
