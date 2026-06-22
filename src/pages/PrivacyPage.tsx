import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Database, Globe, Eye } from 'lucide-react'

export default function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <div className="select-text" style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      {/* Decorative ambient blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.02)', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.02)', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header 
        className="px-6 py-4 no-print sticky top-0 z-20" 
        style={{ 
          borderBottom: '1px solid var(--bg-border)', 
          background: 'rgba(7, 7, 8, 0.8)', 
          backdropFilter: 'blur(20px)' 
        }}
      >
        <div className="mx-auto w-full max-w-5xl px-6 flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '1rem' }}>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 p-0 h-auto"
              style={{ 
                color: '#a1a1aa', 
                fontWeight: 600, 
                textDecoration: 'none',
                fontSize: 'inherit',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} />
              Back to Landing
            </button>
            
            <div style={{ width: 1, height: 20, background: 'var(--bg-border)' }} />

            <div className="flex items-center gap-2 select-none">
              <div className="flex items-center">
                <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff', lineHeight: 1, position: 'relative' }}>
                  S
                  <span style={{ position: 'absolute', top: 0, right: '-6px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e11d48' }} />
                </span>
                <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff', lineHeight: 1, paddingLeft: '6px' }}>
                  eve
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                Privacy
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10" style={{ padding: '3rem 0' }}>
        <div className="mx-auto w-full max-w-3xl px-6">
          
          {/* Intro */}
          <div className="text-center flex flex-col items-center gap-3 mb-6">
            <div 
              className="flex items-center justify-center"
              style={{
                padding: '0.75rem',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                marginBottom: '0.5rem',
                width: '3.25rem',
                height: '3.25rem'
              }}
            >
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-white">
              Privacy Notice
            </h2>
            <p className="text-zinc-400 font-light max-w-lg mx-auto" style={{ fontWeight: 300 }}>
              Seve was built under a strict pledge: <strong className="text-white">no subscriptions, no gimmicks, and clear data ownership</strong>. Here is exactly how your data is handled.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Pillar 1 */}
            <div className="flex flex-col gap-3 h-full" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-border)' }}>
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center justify-center"
                  style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                >
                  <Database size={20} />
                </div>
                <h3 className="text-base font-bold text-white m-0">Local-First Editing</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light m-0">
                Your resumes, target job descriptions, settings, and layout preferences are saved directly to your browser's <code className="text-rose-400 bg-rose-500/5 px-1 py-0.5 rounded" style={{ fontFamily: 'var(--font-mono)' }}>localStorage</code>. When you sign in with Google, Seve syncs your resume profiles to Supabase for cloud backup and cross-device access. After sign-in, local changes are saved locally first; you can use the cloud Save button or Ctrl+S to push later edits.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col gap-3 h-full" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-border)' }}>
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center justify-center"
                  style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                >
                  <Globe size={20} />
                </div>
                <h3 className="text-base font-bold text-white m-0">No Marketing Trackers</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light m-0">
                Seve does not load Google Analytics, telemetry packages, marketing trackers, or cookies. An anonymous page-view count is recorded through Supabase to measure aggregate usage — no personal data, IPs, or browsing history are associated with this count.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col gap-3 h-full" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-border)' }}>
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center justify-center"
                  style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                >
                  <Eye size={20} />
                </div>
                <h3 className="text-base font-bold text-white m-0">Total Transparency</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light m-0">
                The resume editor runs locally in your browser. The only network requests are: anonymous page-view counts sent to Supabase, and — if you sign in — cloud sync of your resume data. All network activity is auditable through your browser's developer tools.
              </p>
            </div>
          </div>

          {/* Detailed Section */}
          <div className="mt-6 flex flex-col gap-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
            <h3 className="text-lg font-bold text-white m-0 pb-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              Technical Details & Data Handling
            </h3>

            <div className="flex flex-col gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">
                  Local Browser Storage Keys
                </h4>
                <p className="m-0">
                  The following specific localStorage keys are used to retain your data between sessions:
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li><strong className="text-white">seve_state:</strong> Stores resume profiles, selected resume, templates, style preferences, target job descriptions, and section order.</li>
                  <li><strong className="text-white">sv_visitor_id:</strong> Stores a random anonymous visitor ID for aggregate page-view counting.</li>
                  <li><strong className="text-white">seve_ai_onboarded / seve_visited:</strong> Stores whether intro screens have already been shown.</li>
                  <li><strong className="text-white">seve_theme_color:</strong> Stores the last selected theme color.</li>
                  <li><strong className="text-white">ats-score-history:</strong> Stores local ATS score history used for progress timeline features.</li>
                  <li><strong className="text-white">resumeai_state / resumeai_section_order / seve_section_order:</strong> Legacy migration keys read for compatibility with older local data.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">
                  Supabase & Cloud Sync
                </h4>
                <p className="m-0">
                  Seve uses Supabase for two purposes: (1) anonymous page-view counting — a random visitor ID is stored in localStorage and a page-view event is sent on each page load, with aggregate counts fetched via an RPC function; (2) cloud sync — when you sign in with Google, your resume data is synced to Supabase for backup and cross-device access. After sign-in, local edits are saved locally first; you push updates to the cloud using the Save button or Ctrl+S.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">
                  Importing & Exporting
                </h4>
                <p className="m-0">
                  Because everything lives in browser storage, you can download a full backup file using the "Export Data (JSON)" button in settings, or upload a previously exported file to migrate your work to a different machine or browser.
                </p>
              </div>
            </div>
          </div>

          {/* Back CTA */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="font-bold px-6 py-3 rounded-xl text-white cursor-pointer transition-all"
              style={{ background: 'var(--brand-primary)', fontWeight: 700, border: 'none', fontSize: 'inherit' }}
            >
              I Understand, Let's Build
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer 
        className="py-6 no-print relative z-10 text-center"
        style={{ 
          borderTop: '1px solid var(--bg-border)', 
          background: 'var(--bg-void)'
        }}
      >
        <div className="text-xs text-zinc-400">
          © {new Date().getFullYear()} Seve. Free and local-first.
        </div>
      </footer>
    </div>
  )
}
