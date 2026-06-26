import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Database, Globe, Eye, Code, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function PrivacyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) {
      setIsAdmin(false)
      return
    }
    const db = supabase

    const checkAdmin = async () => {
      try {
        const { data, error } = await db.rpc('is_admin')
        if (!error && data) {
          setIsAdmin(true)
        }
      } catch (err) {
        console.error('Error checking admin status:', err)
      }
    }

    checkAdmin()
  }, [user])

  return (
    <div className="select-text min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Cinematic Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-500/5 filter blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-800/3 filter blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-emerald-500/[0.02] filter blur-[100px] pointer-events-none z-0" />

      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="mx-auto w-full max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              Back to Home
            </button>
            
            <div className="h-4 w-px bg-zinc-800" />

            <div className="flex items-center gap-2 select-none">
              <div className="flex items-center">
                <span className="font-serif text-xl font-black text-white leading-none relative" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  S
                  <span className="absolute top-0 -right-1.5 w-1.5 h-1.5 rounded-full bg-[#b91c1c] shadow-[0_0_8px_#b91c1c]" />
                </span>
                <span className="font-serif text-xl font-black text-white leading-none pl-1.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  eve
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 ml-1">
                Privacy Policy
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 py-16 md:py-24">
        <div className="mx-auto w-full max-w-4xl px-6">
          
          {/* Intro Section */}
          <div className="text-center flex flex-col items-center gap-4 mb-16 animate-fade-in">
            <div className="flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-display">
              Privacy Notice
            </h1>
            <p className="text-zinc-400 text-sm md:text-base font-light max-w-2xl mx-auto leading-relaxed">
              Seve was built under a strict pledge: <strong className="text-white font-medium">no subscriptions, no gimmicks, and clear data ownership</strong>. Here is exactly how your data is handled.
            </p>
          </div>

          {/* Pillars Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* Pillar 1 */}
            <div className="flex flex-col gap-4 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/60 hover:bg-zinc-900/60 transition-all duration-300 rounded-2xl p-6 relative group backdrop-blur-xl shadow-xl hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Database size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Local-First Editing</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light mt-2">
                Your resumes, job descriptions, settings, and layout preferences are saved directly to your browser's <code className="text-rose-400 bg-rose-500/5 px-1.5 py-0.5 rounded font-mono text-[10px] border border-rose-900/30">localStorage</code>. When you sign in with Google, Seve syncs your resume profiles to Supabase for cloud backup and cross-device access.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col gap-4 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/60 hover:bg-zinc-900/60 transition-all duration-300 rounded-2xl p-6 relative group backdrop-blur-xl shadow-xl hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Globe size={20} />
                </div>
                <h3 className="text-base font-bold text-white">No Trackers</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light mt-2">
                Seve does not load Google Analytics, telemetry packages, marketing trackers, or cookies. An anonymous page-view count is recorded through Supabase to measure aggregate usage — storing only a random visitor ID, path, and date; it never reads your resumes.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col gap-4 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/60 hover:bg-zinc-900/60 transition-all duration-300 rounded-2xl p-6 relative group backdrop-blur-xl shadow-xl hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Eye size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Total Transparency</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light mt-2">
                The resume editor runs locally in your browser. The only network requests are: anonymous page-view counts sent to Supabase, and — if you sign in — cloud sync of your resume data. All network activity is fully auditable through your browser's developer tools.
              </p>
            </div>

          </div>

          {/* Technical Details */}
          <div className="bg-zinc-900/20 border border-zinc-850/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl relative overflow-hidden group mb-12">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-rose-700" />
            
            <h3 className="text-lg font-bold text-white pb-4 border-b border-zinc-900 flex items-center gap-2">
              Technical Details & Data Handling
            </h3>

            <div className="mt-6 flex flex-col gap-6 text-xs text-zinc-400 leading-relaxed">
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-500" />
                  Local Browser Storage Keys
                </h4>
                <p className="m-0 pl-2.5">
                  The following specific localStorage keys are used to retain your data between sessions:
                </p>
                <div className="grid grid-cols-1 gap-2.5 pl-2.5">
                  {[
                    { key: 'seve_state', desc: 'Stores resume profiles, selected resume, templates, style preferences, target job descriptions, and section order.' },
                    { key: 'sv_visitor_id', desc: 'Stores a random anonymous visitor ID for aggregate page-view counting.' },
                    { key: 'seve_ai_onboarded / seve_visited', desc: 'Stores whether intro screens have already been shown.' },
                    { key: 'seve_theme_color', desc: 'Stores the last selected theme color.' },
                    { key: 'ats-score-history', desc: 'Stores local ATS score history used for progress timeline features.' },
                    { key: 'resumeai_state / resumeai_section_order', desc: 'Legacy migration keys read for compatibility with older local data.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-1.5 border-b border-zinc-900 last:border-0">
                      <code className="text-rose-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 font-mono text-[10px] shrink-0 font-medium">
                        {item.key}
                      </code>
                      <span className="text-[11px] text-zinc-400 leading-normal">
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-zinc-900/50">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-500" />
                  Supabase & Cloud Sync
                </h4>
                <p className="m-0 pl-2.5">
                  Seve uses Supabase for two purposes: (1) anonymous page-view counting — a random visitor ID is stored in localStorage and a page-view event is sent on each page load, with aggregate counts fetched via an RPC function; (2) cloud sync — when you sign in with Google, your resume data is synced to Supabase for backup and cross-device access. After sign-in, local edits are saved locally first; you push updates to the cloud using the Save button or Ctrl+S.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-zinc-900/50">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-500" />
                  Importing & Exporting
                </h4>
                <p className="m-0 pl-2.5">
                  Because everything lives in browser storage, you can download a full backup file using the "Export Data (JSON)" button in settings, or upload a previously exported file to migrate your work to a different machine or browser.
                </p>
              </div>
            </div>
          </div>

          {/* Action Callout */}
          <div className="flex flex-col items-center gap-4 pt-4 text-center">
            <button
              onClick={() => navigate('/editor')}
              className="font-bold px-8 py-3.5 bg-gradient-to-r from-[#b91c1c] to-[#7f1d1d] hover:opacity-95 hover:scale-[1.02] shadow-[0_0_30px_rgba(185,28,28,0.2)] hover:shadow-[0_0_30px_rgba(185,28,28,0.35)] border border-[#b91c1c]/35 rounded-xl text-white text-sm transition-all duration-300 cursor-pointer flex items-center gap-2"
            >
              I Understand, Let's Build
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </main>

      {/* Hardened Matching Footer */}
      <footer className="py-12 border-t border-zinc-900 bg-zinc-950 z-10 relative no-print">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} Seve. Open-source initiative by{' '}
            <a 
              href="https://github.com/wacim-abdellli" 
              target="_blank" 
              rel="noreferrer" 
              className="text-zinc-300 hover:text-red-400 font-bold transition-colors"
            >
              Wacim Abdelli
            </a>.
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/')} 
              className="hover:text-white transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              Home Page
            </button>

            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')} 
                className="hover:text-white transition-colors flex items-center gap-1.5 font-semibold text-rose-500 cursor-pointer"
              >
                <ShieldCheck size={14} className="text-rose-500 animate-pulse" />
                Admin Space
              </button>
            )}

            <a 
              href="https://github.com/wacim-abdellli/seve" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Code size={14} />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
