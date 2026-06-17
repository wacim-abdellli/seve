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
        className="px-6 py-4 no-print" 
        style={{ 
          zIndex: 20, 
          position: 'sticky', 
          top: 0, 
          borderBottom: '1px solid var(--bulma-border)', 
          background: 'rgba(7, 7, 8, 0.8)', 
          backdropFilter: 'blur(20px)' 
        }}
      >
        <div className="container is-flex is-align-items-center is-justify-content-between">
          <div className="is-flex is-align-items-center" style={{ gap: '1rem' }}>
            <button
              onClick={() => navigate('/')}
              className="button is-small is-text p-0 h-auto"
              style={{ 
                color: 'var(--bulma-text-weak)', 
                fontWeight: 600, 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <ArrowLeft size={14} />
              Back to Landing
            </button>
            
            <div style={{ width: 1, height: 20, background: 'var(--bulma-border)' }} />

            <div className="is-flex is-align-items-center" style={{ gap: '0.5rem', userSelect: 'none' }}>
              <div className="is-flex is-align-items-center">
                <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff', lineHeight: 1, position: 'relative' }}>
                  S
                  <span style={{ position: 'absolute', top: 0, right: '-6px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e11d48' }} />
                </span>
                <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff', lineHeight: 1, paddingLeft: '6px' }}>
                  eve
                </span>
              </div>
              <span className="tag is-small is-success is-light" style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Privacy
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="section flex-1" style={{ zIndex: 10, position: 'relative' }}>
        <div className="container" style={{ maxWidth: '768px' }}>
          
          {/* Intro */}
          <div className="has-text-centered mb-6" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <div 
              className="is-flex is-align-items-center is-justify-content-center"
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
            <h2 className="title is-3" style={{ color: '#ffffff', fontWeight: 900 }}>
              Privacy Notice
            </h2>
            <p className="subtitle is-6 mt-2" style={{ color: 'var(--bulma-text-weak)', fontWeight: 300, maxWidth: '500px', margin: '0 auto' }}>
              Seve was built under a strict pledge: <strong>no tracking, no subscriptions, and absolute data ownership</strong>. Here is exactly how your data is handled.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="columns is-multiline pt-4">
            {/* Pillar 1 */}
            <div className="column is-6">
              <div className="box tm-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', margin: 0 }}>
                <div className="is-flex is-align-items-center" style={{ gap: '0.75rem' }}>
                  <div 
                    className="is-flex is-align-items-center is-justify-content-center"
                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                  >
                    <Database size={20} />
                  </div>
                  <h3 className="title is-6" style={{ margin: 0, color: '#ffffff', fontWeight: 700 }}>100% Local-First</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--bulma-text-weak)', lineHeight: '1.5', fontWeight: 300, margin: 0 }}>
                  Your resumes, target job descriptions, settings, and layout preferences are saved directly to your browser's <code style={{ color: '#fb7185', background: 'rgba(244, 63, 94, 0.05)', padding: '2px 4px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>localStorage</code>. We never run databases or storage servers to collect your records.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="column is-6">
              <div className="box tm-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', margin: 0 }}>
                <div className="is-flex is-align-items-center" style={{ gap: '0.75rem' }}>
                  <div 
                    className="is-flex is-align-items-center is-justify-content-center"
                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                  >
                    <Globe size={20} />
                  </div>
                  <h3 className="title is-6" style={{ margin: 0, color: '#ffffff', fontWeight: 700 }}>Zero Analytics & Ads</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--bulma-text-weak)', lineHeight: '1.5', fontWeight: 300, margin: 0 }}>
                  Seve does not load Google Analytics, telemetry packages, marketing trackers, or cookies. We have no way of knowing how many resumes you construct or who you are.
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="column is-6">
              <div className="box tm-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', margin: 0 }}>
                <div className="is-flex is-align-items-center" style={{ gap: '0.75rem' }}>
                  <div 
                    className="is-flex is-align-items-center is-justify-content-center"
                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                  >
                    <Eye size={20} />
                  </div>
                  <h3 className="title is-6" style={{ margin: 0, color: '#ffffff', fontWeight: 700 }}>Total Transparency</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--bulma-text-weak)', lineHeight: '1.5', fontWeight: 300, margin: 0 }}>
                  The entire source code is fully open-source. Anyone can audit the network requests and verify that the application operates entirely within your browser sandboxes.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Section */}
          <div className="box mt-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bulma-border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 className="title is-5 mb-0 pb-3" style={{ color: '#ffffff', fontWeight: 700, borderBottom: '1px solid var(--bulma-border)' }}>
              Technical Details & Data Handling
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.75rem', color: 'var(--bulma-text-weak)', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ fontWeight: 'bold', color: 'var(--bulma-text-strong)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
                  Local Browser Storage Keys
                </h4>
                <p style={{ margin: 0 }}>
                  The following specific localStorage keys are used to retain your data between sessions:
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                   <li><strong style={{ color: 'var(--bulma-text-strong)' }}>seve_state:</strong> Stores your resume data fields, target job description, and chat history.</li>
                  <li><strong style={{ color: 'var(--bulma-text-strong)' }}>seve_workspace_layout:</strong> Stores your active pane layout preference (split, studio, focus).</li>
                  <li><strong style={{ color: 'var(--bulma-text-strong)' }}>seve_score_history:</strong> Stores the history of your resume ATS scores for progress tracking.</li>
                  <li><strong style={{ color: 'var(--bulma-text-strong)' }}>seve_section_order:</strong> Stores the order of your resume sections if custom-sorted.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem' }}>
                <h4 style={{ fontWeight: 'bold', color: 'var(--bulma-text-strong)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
                  Importing & Exporting
                </h4>
                <p style={{ margin: 0 }}>
                  Because everything lives in browser storage, you can download a full backup file using the "Export Data (JSON)" button in settings, or upload a previously exported file to migrate your work to a different machine or browser.
                </p>
              </div>
            </div>
          </div>

          {/* Back CTA */}
          <div className="has-text-centered mt-6">
            <button
              onClick={() => navigate('/')}
              className="button is-primary is-medium"
              style={{ fontWeight: 700 }}
            >
              I Understand, Let's Build
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer 
        className="footer py-6 no-print"
        style={{ 
          zIndex: 10, 
          position: 'relative', 
          borderTop: '1px solid var(--bulma-border)', 
          background: 'var(--bg-void)',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--bulma-text-weak)' }}>
          © {new Date().getFullYear()} Seve. Free and open source.
        </div>
      </footer>
    </div>
  )
}
