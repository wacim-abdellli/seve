import { useState, useEffect } from 'react'
import type { AppState, ResumeData, AtsScore, Template, Message } from './types/resume'
import { evaluateResume } from './utils/atsEvaluator'
import AgentChat from './components/AgentChat'
import ResumeForm from './components/ResumeForm'
import ResumePreview from './components/ResumePreview'
import AtsDashboard from './components/AtsDashboard'
import SettingsModal from './components/SettingsModal'
import JobTailor from './components/JobTailor'

const INITIAL_RESUME_DATA: ResumeData = {
  contact: {
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    location: '',
    website: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
}

const INITIAL_ATS_SCORE: AtsScore = {
  total: 0,
  grade: 'F',
  sections: {
    sectionCompleteness: 0,
    keywordMatch: 0,
    formattingSafety: 0,
    actionVerbs: 0,
    quantifiedResults: 0,
    contactInfo: 0,
    dateConsistency: 0,
    lengthAppropriateness: 0,
  },
  passing: [],
  failing: [],
}

const LOCAL_STORAGE_KEY = 'resumeai_state'

function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.agentMessages) {
          parsed.agentMessages = parsed.agentMessages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        }
        return parsed
      } catch (e) {
        console.error('Failed to parse saved state, resetting', e)
      }
    }
    return {
      resumeData: INITIAL_RESUME_DATA,
      atsScore: INITIAL_ATS_SCORE,
      selectedTemplate: 'classic',
      jobDescription: '',
      apiKey: '',
      agentMessages: [
        {
          id: 'welcome',
          role: 'agent',
          content: "Hello! I am Seve, your expert resume builder and career coach. Let's start building your resume. What is your target job title?",
          timestamp: new Date(),
        },
      ],
    }
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'tailor'>('edit')
  const [isSaving, setIsSaving] = useState(false)

  // Autosave state to localStorage with a 500ms debounce
  useEffect(() => {
    setIsSaving(true)
    const handler = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
      setIsSaving(false)
    }, 500)

    return () => clearTimeout(handler)
  }, [state])

  // Recalculate ATS Score whenever resumeData or jobDescription changes
  useEffect(() => {
    const newScore = evaluateResume(state.resumeData, state.jobDescription)
    setState((prev) => ({
      ...prev,
      atsScore: newScore,
    }))
  }, [state.resumeData, state.jobDescription])

  const handleSendMessage = (role: 'agent' | 'user', content: string) => {
    const newMsg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    }
    setState((prev) => ({
      ...prev,
      agentMessages: [...prev.agentMessages, newMsg],
    }))
  }

  const updateResumeData = (updated: ResumeData) => {
    setState((prev) => ({
      ...prev,
      resumeData: updated,
    }))
  }

  const handleImportResume = (imported: ResumeData) => {
    setState((prev) => ({
      ...prev,
      resumeData: imported,
    }))
  }

  const handlePrint = () => {
    if (!state.resumeData.contact.fullName.trim() && !state.resumeData.experience.length) {
      const confirmPrint = window.confirm('Your resume is currently empty. Are you sure you want to print?')
      if (!confirmPrint) return
    }
    window.print()
  }

  const resetResume = () => {
    if (window.confirm('Are you sure you want to reset your resume? All your current data will be lost.')) {
      setState((prev) => ({
        ...prev,
        resumeData: INITIAL_RESUME_DATA,
        atsScore: INITIAL_ATS_SCORE,
        agentMessages: [
          {
            id: 'welcome_reset',
            role: 'agent',
            content: "Welcome back! Let's start building. What is your target job title?",
            timestamp: new Date(),
          },
        ],
      }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="bg-slate-800/80 border-b border-slate-700/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 no-print z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            SV
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-none">Seve</h1>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">ATS Optimizer</span>
          </div>
          <div className="flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-full bg-slate-900/40 border border-slate-700/50">
            <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {isSaving ? 'Saving' : 'Saved'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Template:</span>
            <select
              value={state.selectedTemplate}
              onChange={(e) => setState(prev => ({ ...prev, selectedTemplate: e.target.value as Template }))}
              className="bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="classic">Classic (Serif)</option>
              <option value="modern">Modern (Sans Accents)</option>
              <option value="executive">Executive (Dividers)</option>
            </select>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 rounded-lg px-3 py-1.5 text-xs transition-all font-semibold"
          >
            Settings
          </button>
          
          <button
            onClick={resetResume}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg px-3 py-1.5 text-xs transition-all"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main Column Layout */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Left Column: Chat Agent (320px) */}
        <section className="w-full lg:w-[320px] shrink-0 bg-slate-800/60 rounded-xl p-4 border border-slate-700/80 flex flex-col h-[400px] lg:h-[calc(100vh-130px)] no-print">
          <AgentChat
            messages={state.agentMessages}
            onSendMessage={handleSendMessage}
            resumeData={state.resumeData}
            onUpdateResumeData={updateResumeData}
            onUpdateJobDescription={(jd) => setState(prev => ({ ...prev, jobDescription: jd }))}
            apiKey={state.apiKey}
          />
        </section>

        {/* Center Column: Form Editor & Preview Tabs */}
        <section className="flex-1 bg-slate-800/60 rounded-xl border border-slate-700/80 flex flex-col h-[calc(100vh-130px)] overflow-hidden">
          <div className="bg-slate-800/40 border-b border-slate-700/80 px-4 py-2 flex items-center justify-between shrink-0 no-print">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Form Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Live Preview
              </button>
              <button
                onClick={() => setActiveTab('tailor')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'tailor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Tailor JD
              </button>
            </div>
            {activeTab === 'preview' && (
              <button
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
              >
                Print PDF
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'edit' && (
              <ResumeForm
                resumeData={state.resumeData}
                apiKey={state.apiKey}
                onChange={updateResumeData}
              />
            )}
            {activeTab === 'preview' && (
              <ResumePreview
                resumeData={state.resumeData}
                selectedTemplate={state.selectedTemplate}
              />
            )}
            {activeTab === 'tailor' && (
              <JobTailor
                resumeData={state.resumeData}
                jobDescription={state.jobDescription}
                onUpdateJobDescription={(jd) => setState(prev => ({ ...prev, jobDescription: jd }))}
                onUpdateResumeData={updateResumeData}
                apiKey={state.apiKey}
              />
            )}
          </div>
        </section>

        {/* Right Column: ATS Dashboard (320px) */}
        <section className="w-full lg:w-[320px] shrink-0 bg-slate-800/60 rounded-xl p-4 border border-slate-700/80 flex flex-col h-[calc(100vh-130px)] no-print">
          <AtsDashboard
            atsScore={state.atsScore}
            resumeData={state.resumeData}
            onFix={updateResumeData}
          />
        </section>
      </main>

      {/* Settings Modal Component */}
      {isSettingsOpen && (
        <SettingsModal
          apiKey={state.apiKey}
          onUpdateApiKey={(key) => setState(prev => ({ ...prev, apiKey: key }))}
          selectedTemplate={state.selectedTemplate}
          onUpdateTemplate={(template) => setState(prev => ({ ...prev, selectedTemplate: template }))}
          resumeData={state.resumeData}
          onImportResume={handleImportResume}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default App
