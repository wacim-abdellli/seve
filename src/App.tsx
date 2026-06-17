import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppState, ResumeData, Message, ResumeProfile } from './types/resume'
import { evaluateResume } from './utils/atsEvaluator'
import ResumePreview from './components/ResumePreview'
import AtsDashboard from './components/AtsDashboard'
import SettingsModal from './components/SettingsModal'
import LandingPage from './pages/LandingPage'
import PrivacyPage from './pages/PrivacyPage'
import ModeRail from './components/ModeRail'
import SectionSidebar from './components/SectionSidebar'
import type { SectionType } from './components/SectionSidebar'
import AiToolsPanel from './components/AiToolsPanel'
import { supabase } from './utils/supabaseClient'
import type { User } from '@supabase/supabase-js'
import SectionDrawer from './components/SectionDrawer'
import { createPortal } from 'react-dom'
import ClassicTemplate from './components/templates/ClassicTemplate'
import ModernTemplate from './components/templates/ModernTemplate'
import ExecutiveTemplate from './components/templates/ExecutiveTemplate'
import MinimalistTemplate from './components/templates/MinimalistTemplate'
import CreativeTemplate from './components/templates/CreativeTemplate'
import { calculateCompletion, getSectionStatus } from './utils/completionHelper'
import ResumeManager from './components/ResumeManager'
import ResumeImportModal from './components/ResumeImportModal'

import { 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  Activity,
  Eye,
  Settings,
  ChevronRight,
  User as UserIcon,
  FileText as FileTextIcon,
  Briefcase as BriefcaseIcon,
  GraduationCap as GraduationCapIcon,
  Code2,
  Globe,
  FolderOpen,
  Trophy,
  Award,
  Heart,
  BookOpen,
  Phone,
  HandHeart
} from 'lucide-react'

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
  languages: [],
  projects: [],
}

const LOCAL_STORAGE_KEY = 'seve_state'



const overviewSections = [
  { id: 'contact' as const, title: 'Contact Info', icon: UserIcon, colorClass: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/15 group-hover:text-blue-300' },
  { id: 'summary' as const, title: 'Profile Summary', icon: FileTextIcon, colorClass: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/15 group-hover:text-purple-300' },
  { id: 'experience' as const, title: 'Work Experience', icon: BriefcaseIcon, colorClass: 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/15 group-hover:text-rose-300' },
  { id: 'education' as const, title: 'Education History', icon: GraduationCapIcon, colorClass: 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/15 group-hover:text-amber-300' },
  { id: 'skills' as const, title: 'Skills & Stack', icon: Code2, colorClass: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15 group-hover:text-emerald-300' },
  { id: 'languages' as const, title: 'Languages', icon: Globe, colorClass: 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/15 group-hover:text-indigo-300' },
  { id: 'projects' as const, title: 'Projects', icon: FolderOpen, colorClass: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/15 group-hover:text-cyan-300' },
  { id: 'awards' as const, title: 'Awards & Honors', icon: Trophy, colorClass: 'bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/15 group-hover:text-yellow-300' },
  { id: 'certifications' as const, title: 'Certifications', icon: Award, colorClass: 'bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/15 group-hover:text-sky-300' },
  { id: 'interests' as const, title: 'Interests', icon: Heart, colorClass: 'bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/15 group-hover:text-pink-300' },
  { id: 'publications' as const, title: 'Publications', icon: BookOpen, colorClass: 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/15 group-hover:text-orange-300' },
  { id: 'references' as const, title: 'References', icon: Phone, colorClass: 'bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/15 group-hover:text-teal-300' },
  { id: 'volunteer' as const, title: 'Volunteer', icon: HandHeart, colorClass: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/15 group-hover:text-violet-300' },
]

const truncateText = (str: string, max: number) => {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '...' : str
}

const getSectionPreview = (section: string, data: ResumeData): string => {
  switch (section) {
    case 'contact':
      return data.contact.email || 'Add your details'
    case 'summary':
      return truncateText(data.summary, 60) || 'Write a summary'
    case 'experience':
      return data.experience.length === 0
        ? 'No positions added yet'
        : `${data.experience[0].jobTitle || 'Untitled'} at ${data.experience[0].company || 'No Company'}` +
          (data.experience.length > 1 ? ` +${data.experience.length - 1} more` : '')
    case 'education':
      return data.education.length === 0
        ? 'No institutions added yet'
        : `${data.education.length} institution(s) added`
    case 'skills':
      return data.skills.length === 0
        ? 'No skills added yet'
        : data.skills.slice(0, 4).join(', ') + (data.skills.length > 4 ? '...' : '')
    case 'languages': {
      const langList = data.languages || []
      return langList.length === 0
        ? 'No languages added'
        : langList.map(l => l.name).join(', ') + (langList.length > 3 ? '...' : '')
    }
    case 'projects':
      const projList = data.projects || []
      return projList.length === 0
        ? 'No projects added'
        : `${projList.length} project(s)`
    case 'awards': {
      const list = data.awards || []
      return list.length === 0 ? 'No awards added' : list.map(x => x.title).filter(Boolean).join(', ')
    }
    case 'certifications': {
      const list = data.certifications || []
      return list.length === 0 ? 'No certifications added' : list.map(x => x.title).filter(Boolean).join(', ')
    }
    case 'interests': {
      const list = data.interests || []
      return list.length === 0 ? 'No interests added' : list.map(x => x.name).filter(Boolean).join(', ')
    }
    case 'publications': {
      const list = data.publications || []
      return list.length === 0 ? 'No publications added' : list.map(x => x.title).filter(Boolean).join(', ')
    }
    case 'references': {
      const list = data.references || []
      return list.length === 0 ? 'No references added' : list.map(x => x.name).filter(Boolean).join(', ')
    }
    case 'volunteer': {
      const list = data.volunteer || []
      return list.length === 0 ? 'No volunteer experience added' : list.map(x => x.organization).filter(Boolean).join(', ')
    }
    default:
      return ''
  }
}

interface ExportWarningModalProps {
  warnings: string[]
  onClose: () => void
  onExportAnyway: () => void
}

interface PrintSettingsModalProps {
  onClose: () => void
  onContinue: () => void
}

function PrintSettingsModal({ onClose, onContinue }: PrintSettingsModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-[480px] max-w-full shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 text-blue-500 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 5.13-.251m-5.13.251a41.146 41.146 0 0 0-3.613.691m11.744-1.089a41.146 41.146 0 0 1 3.614.691m-11.744-1.09A41.975 41.975 0 0 1 12 12.75c2.025 0 4.248.168 6.23.42M15 8.25V6.75A2.25 2.25 0 0 0 12.75 4.5h-1.5A2.25 2.25 0 0 0 9 6.75v1.5m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">Print Settings</h3>
            <p className="text-[11px] text-zinc-400">Adjust your browser print settings for best results</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-[12px] leading-relaxed">
            <span className="text-emerald-400 shrink-0 font-bold">1.</span>
            <div>
              <p className="text-white font-semibold text-[13px]">Set Margins to <span className="text-amber-400">None</span></p>
              <p className="text-zinc-400 mt-0.5">In the print dialog, go to <strong>More settings → Margins → None</strong></p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-[12px] leading-relaxed">
            <span className="text-emerald-400 shrink-0 font-bold">2.</span>
            <div>
              <p className="text-white font-semibold text-[13px]">Enable Background Graphics</p>
              <p className="text-zinc-400 mt-0.5">Check <strong>More settings → Background graphics</strong></p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-[12px] leading-relaxed">
            <span className="text-emerald-400 shrink-0 font-bold">3.</span>
            <div>
              <p className="text-white font-semibold text-[13px]">Select A4 Paper Size</p>
              <p className="text-zinc-400 mt-0.5">Choose <strong>A4</strong> under <strong>Paper size</strong> (or your local standard)</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 h-10 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs shadow-lg shadow-blue-500/10 transition-colors cursor-pointer"
          >
            Continue to Print
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}


function ExportWarningModal({ warnings, onClose, onExportAnyway }: ExportWarningModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-[480px] max-w-full shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">Export Review</h3>
            <p className="text-[11px] text-zinc-400">Please review these warnings before exporting</p>
          </div>
        </div>
        
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto mb-6 pr-2">
          {warnings.map((warning, index) => (
            <div key={index} className="flex gap-2.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-[12px] text-zinc-350 leading-relaxed font-light font-sans">
              <span className="text-amber-500 shrink-0 select-none font-bold">•</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Fix Issues
          </button>
          <button
            onClick={onExportAnyway}
            className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/10 transition-colors cursor-pointer"
          >
            Export Anyway
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}


function App() {
  const [view, setView] = useState<'landing' | 'workspace' | 'privacy'>('landing')
  
  const [state, setState] = useState<AppState>(() => {
    let saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!saved) {
      saved = localStorage.getItem('resumeai_state')
    }
    const defaultResumeId = 'default-resume'
    const createDefaultResume = (): ResumeProfile => ({
      id: defaultResumeId,
      title: 'My Resume',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resumeData: INITIAL_RESUME_DATA,
      selectedTemplate: 'classic',
      jobDescription: '',
      agentMessages: [
        {
          id: 'welcome',
          role: 'agent',
          content: "Hello! I am Aria, your AI Career Coach. Let's get started on building a market-disrupting resume. Tell me about your target job title, or copy-paste the job description here!",
          timestamp: new Date(),
        },
      ],
    })

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Detect new format vs old format
        if (parsed.resumes && parsed.selectedResumeId) {
          // New format: reconstruct Dates for agentMessages
          const resumes: Record<string, ResumeProfile> = {}
          for (const key in parsed.resumes) {
            const profile = parsed.resumes[key]
            resumes[key] = {
              ...profile,
              agentMessages: (profile.agentMessages || []).map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            }
          }
          return {
            resumes,
            selectedResumeId: parsed.selectedResumeId,
            apiKey: parsed.apiKey || '',
          }
        } else if (parsed.resumeData) {
          // Old format: migrate to new format
          const migratedProfile: ResumeProfile = {
            id: defaultResumeId,
            title: 'My Resume',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resumeData: parsed.resumeData,
            selectedTemplate: parsed.selectedTemplate || 'classic',
            jobDescription: parsed.jobDescription || '',
            agentMessages: (parsed.agentMessages || []).map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }
          return {
            resumes: {
              [defaultResumeId]: migratedProfile,
            },
            selectedResumeId: defaultResumeId,
            apiKey: parsed.apiKey || '',
          }
        }
      } catch (e) {
        console.error('Failed to parse saved state, resetting', e)
      }
    }

    return {
      resumes: {
        [defaultResumeId]: createDefaultResume(),
      },
      selectedResumeId: defaultResumeId,
      apiKey: '',
    }
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isResumeManagerOpen, setIsResumeManagerOpen] = useState(false)
  const [isResumeImportOpen, setIsResumeImportOpen] = useState(false)

  const activeResumeId = state.selectedResumeId
  const activeResume = state.resumes[activeResumeId] || Object.values(state.resumes)[0]

  const resumeData = activeResume?.resumeData || INITIAL_RESUME_DATA
  const selectedTemplate = activeResume?.selectedTemplate || 'classic'
  const jobDescription = activeResume?.jobDescription || ''
  const agentMessages = activeResume?.agentMessages || []

  const updateActiveResume = (updater: (prev: ResumeProfile) => ResumeProfile) => {
    setState((prev) => {
      const active = prev.resumes[prev.selectedResumeId] || Object.values(prev.resumes)[0]
      if (!active) return prev
      const updatedProfile = updater(active)
      return {
        ...prev,
        resumes: {
          ...prev.resumes,
          [updatedProfile.id]: {
            ...updatedProfile,
            updatedAt: new Date().toISOString()
          }
        }
      }
    })
  }

  const handleSelectResume = (id: string) => {
    setState((prev) => ({
      ...prev,
      selectedResumeId: id,
    }))
  }

  const handleCreateResume = (title: string) => {
    const newId = crypto.randomUUID()
    const newProfile: ResumeProfile = {
      id: newId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resumeData: INITIAL_RESUME_DATA,
      selectedTemplate: 'classic',
      jobDescription: '',
      agentMessages: [
        {
          id: 'welcome',
          role: 'agent',
          content: `Hello! I am Aria, your AI Career Coach. I've created your new resume "${title}". Let's get started on building a market-disrupting resume. Tell me about your target job title, or copy-paste the job description here!`,
          timestamp: new Date(),
        },
      ],
    }
    setState((prev) => ({
      ...prev,
      resumes: {
        ...prev.resumes,
        [newId]: newProfile,
      },
      selectedResumeId: newId,
    }))
  }

  const handleDuplicateResume = (id: string) => {
    const source = state.resumes[id]
    if (!source) return
    const newId = crypto.randomUUID()
    const duplicatedProfile: ResumeProfile = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agentMessages: (source.agentMessages || []).map(m => ({ ...m, id: crypto.randomUUID() }))
    }
    setState((prev) => ({
      ...prev,
      resumes: {
        ...prev.resumes,
        [newId]: duplicatedProfile,
      },
      selectedResumeId: newId,
    }))
  }

  const handleRenameResume = (id: string, newTitle: string) => {
    setState((prev) => {
      const target = prev.resumes[id]
      if (!target) return prev
      return {
        ...prev,
        resumes: {
          ...prev.resumes,
          [id]: {
            ...target,
            title: newTitle,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    })
  }

  const handleDeleteResume = (id: string) => {
    setState((prev) => {
      const nextResumes = { ...prev.resumes }
      delete nextResumes[id]
      
      let nextSelectedId = prev.selectedResumeId
      if (nextSelectedId === id) {
        nextSelectedId = Object.keys(nextResumes)[0] || ''
      }
      
      return {
        ...prev,
        resumes: nextResumes,
        selectedResumeId: nextSelectedId,
      }
    })
  }

  const handleImportParsedResume = (title: string, data: ResumeData) => {
    const newId = crypto.randomUUID()
    const newProfile: ResumeProfile = {
      id: newId,
      title: title || 'Imported Resume',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resumeData: data,
      selectedTemplate: 'classic',
      jobDescription: '',
      agentMessages: [
        {
          id: 'welcome_imported',
          role: 'agent',
          content: `Hello! I have successfully parsed and imported your resume "${title}". You can now optimize it, tailor it to job descriptions, or edit details directly!`,
          timestamp: new Date()
        }
      ]
    }
    setState(prev => ({
      ...prev,
      resumes: {
        ...prev.resumes,
        [newId]: newProfile
      },
      selectedResumeId: newId
    }))
    setActiveMode('studio')
  }

  const [activeMode, setActiveMode] = useState<'studio' | 'preview' | 'analyze' | 'ai'>('studio')
  const [activeStudioSection, setActiveStudioSection] = useState<SectionType | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [templateFontSize, setTemplateFontSize] = useState(10)
  const [activeWarnings, setActiveWarnings] = useState<string[] | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<('summary' | 'experience' | 'projects' | 'education' | 'skills' | 'languages' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer')[]>(() => {
    let saved = localStorage.getItem('seve_section_order')
    if (!saved) {
      saved = localStorage.getItem('resumeai_section_order')
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as any
        }
      } catch {}
    }
    return ['summary', 'experience', 'projects', 'education', 'languages', 'skills', 'awards', 'certifications', 'publications', 'volunteer', 'interests', 'references']
  })
  
  const openDrawer = (sec: SectionType) => {
    setActiveStudioSection(sec)
  }
  const closeDrawer = () => {
    setActiveStudioSection(null)
  }

  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  const [themeColor, setThemeColor] = useState<string>(() => {
    const saved = localStorage.getItem('seve_theme_color')
    return saved || '#e11d48'
  })

  useEffect(() => {
    localStorage.setItem('seve_theme_color', themeColor)
  }, [themeColor])



  // Autosave state to localStorage with a 500ms debounce
  useEffect(() => {
    queueMicrotask(() => setIsSaving(true))
    const handler = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
      setIsSaving(false)
    }, 500)

    return () => clearTimeout(handler)
  }, [state])

  // 1. Supabase Auth state listener
  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Fetch remote resume from Supabase on successful user login
  useEffect(() => {
    const client = supabase
    if (!user || !client) return

    const fetchUserResume = async () => {
      try {
        const { data, error } = await client
          .from('resumes')
          .select('resume_data, selected_template, updated_at')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          let loadedState: Partial<AppState> = {}
          const resumeDataVal = data.resume_data
          if (resumeDataVal && resumeDataVal.resumes && resumeDataVal.selectedResumeId) {
            // New database format
            const resumes: Record<string, ResumeProfile> = {}
            for (const key in resumeDataVal.resumes) {
              const profile = resumeDataVal.resumes[key]
              resumes[key] = {
                ...profile,
                agentMessages: (profile.agentMessages || []).map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp),
                })),
              }
            }
            loadedState = {
              resumes,
              selectedResumeId: resumeDataVal.selectedResumeId,
            }
          } else if (resumeDataVal && resumeDataVal.contact) {
            // Old database format: migrate
            const defaultId = 'default-resume'
            const migratedProfile: ResumeProfile = {
              id: defaultId,
              title: 'My Resume',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              resumeData: resumeDataVal,
              selectedTemplate: data.selected_template || 'classic',
              jobDescription: '',
              agentMessages: [],
            }
            loadedState = {
              resumes: {
                [defaultId]: migratedProfile,
              },
              selectedResumeId: defaultId,
            }
          }

          if (loadedState.resumes) {
            setState((prev) => ({
              ...prev,
              resumes: loadedState.resumes!,
              selectedResumeId: loadedState.selectedResumeId!,
            }))
          }

          if (data.updated_at) {
            setLastSynced(new Date(data.updated_at).toLocaleString())
          }
        }
      } catch (error) {
        console.error('Failed to fetch user resume from database:', error)
      }
    }

    fetchUserResume()
  }, [user])

  // 3. Auto-sync local resume data changes to Supabase
  useEffect(() => {
    const client = supabase
    if (!user || !client) return

    const syncToDatabase = async () => {
      try {
        setIsSyncing(true)
        const updatedTime = new Date().toISOString()
        const { error } = await client
          .from('resumes')
          .upsert({
            user_id: user.id,
            resume_data: {
              resumes: state.resumes,
              selectedResumeId: state.selectedResumeId,
            },
            selected_template: activeResume?.selectedTemplate || 'classic',
            updated_at: updatedTime
          }, {
            onConflict: 'user_id'
          })

        if (error) throw error
        setLastSynced(new Date(updatedTime).toLocaleString())
      } catch (error) {
        console.error('Failed to sync resume to Supabase:', error)
      } finally {
        setIsSyncing(false)
      }
    }

    const handler = setTimeout(() => {
      syncToDatabase()
    }, 1000)

    return () => clearTimeout(handler)
  }, [state.resumes, state.selectedResumeId, user])

  // Recalculate ATS Score whenever resumeData or jobDescription changes
  const atsScore = useMemo(() => {
    return evaluateResume(resumeData, jobDescription)
  }, [resumeData, jobDescription])

  const handleSendMessage = (role: 'agent' | 'user', content: string) => {
    const newMsg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    }
    updateActiveResume((prev) => ({
      ...prev,
      agentMessages: [...prev.agentMessages, newMsg],
    }))
  }

  const updateResumeData = (updated: ResumeData) => {
    updateActiveResume((prev) => ({
      ...prev,
      resumeData: updated,
    }))
  }

  const handleImportResume = (imported: ResumeData) => {
    updateActiveResume((prev) => ({
      ...prev,
      resumeData: imported,
    }))
  }

  const handlePrint = () => {
    const warnings: string[] = []
    
    // 1. Duplicate bullets
    const experience = resumeData.experience || []
    let hasDuplicateBullets = false
    for (const exp of experience) {
      const bullets = exp.bullets || []
      const seen = new Set()
      for (const b of bullets) {
        const trimmed = b.trim()
        if (trimmed && seen.has(trimmed)) {
          hasDuplicateBullets = true
          break
        }
        seen.add(trimmed)
      }
    }
    if (hasDuplicateBullets) {
      warnings.push("Work Experience contains duplicate bullet points.")
    }

    // 2. Page Count > 1
    if (pageCount > 1) {
      warnings.push(`Resume is currently ${pageCount} pages. A 1-page layout is recommended.`)
    }

    // 3. Short summary
    const summary = resumeData.summary || ""
    if (summary.trim() && summary.trim().length < 50) {
      warnings.push("Professional summary is very short (under 50 characters).")
    }

    // 4. Incomplete education entries
    const education = resumeData.education || []
    let hasIncompleteEdu = false
    for (const edu of education) {
      const hasSchool = !!edu.school?.trim()
      const hasDegree = !!edu.degree?.trim()
      if ((hasSchool && !hasDegree) || (!hasSchool && hasDegree)) {
        hasIncompleteEdu = true
        break
      }
    }
    if (hasIncompleteEdu) {
      warnings.push("Education history has incomplete entries (missing School or Degree).")
    }

    if (warnings.length > 0) {
      setActiveWarnings(warnings)
      return
    }

    setShowPrintModal(true)
  }

  const triggerNativePrint = () => {
    // Allow React to commit the print portal to DOM before calling print
    setTimeout(() => {
      window.print()
    }, 300)
  }

  const resetResume = () => {
    if (window.confirm('Are you sure you want to reset this resume version? All your current data for this version will be lost.')) {
      updateActiveResume((prev) => ({
        ...prev,
        resumeData: INITIAL_RESUME_DATA,
        agentMessages: [
          {
            id: 'welcome_reset',
            role: 'agent',
            content: "Resume version reset successfully! Let's start fresh. Tell me your target job role.",
            timestamp: new Date(),
          },
        ],
      }))
    }
  }



  if (view === 'landing') {
    return <LandingPage onStartBuild={() => setView('workspace')} onViewPrivacy={() => setView('privacy')} />
  }

  if (view === 'privacy') {
    return <PrivacyPage onBack={() => setView('landing')} />
  }

  return (
    <div className="select-none h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      
      {/* Drifting premium ambient background glows and grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] ambient-glow-1 rounded-full opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[900px] h-[900px] ambient-glow-2 rounded-full opacity-45" />
        <div className="absolute inset-0 premium-grid opacity-30" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      {/* Slim, Premium Header */}
      <header className="relative z-40 flex items-center justify-between px-6 py-3 bg-zinc-950/80 backdrop-blur-md border-b border-border sticky top-0 no-print flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors font-semibold cursor-pointer"
          >
            <ArrowLeft size={14} />
            Landing
          </button>
          
          <div className="w-px h-5 bg-border" />

          <div className="flex items-center gap-2">
            <div className="flex items-center select-none">
              <span className="relative font-serif text-sm font-bold text-white leading-none" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                S
                <span className="absolute top-0 -right-1 w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
              </span>
              <span className="font-serif text-sm font-bold text-white leading-none pl-1.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                eve
              </span>
            </div>
            <div className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-widest rounded">
              Studio v2
            </div>
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Resume Version Switcher Trigger */}
          <button
            onClick={() => setIsResumeManagerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-sm hover:border-zinc-700 max-w-[180px] sm:max-w-[220px]"
          >
            <FolderOpen size={13} className="text-rose-500 shrink-0" />
            <span className="truncate">{activeResume?.title || 'My Resume'}</span>
          </button>
        </div>

        {/* Center: Unified state capsule */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 no-print">
          {pageCount > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/35 text-[9px] font-bold text-amber-400 uppercase tracking-widest animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Multi-page ({pageCount} Pages)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <span 
              className={`w-1.5 h-1.5 rounded-full ${
                isSaving 
                  ? 'bg-amber-500 animate-pulse' 
                  : isSyncing 
                    ? 'bg-blue-500 animate-pulse' 
                    : 'bg-emerald-500'
              }`} 
            />
            <span>
              {isSaving 
                ? 'Saving Changes' 
                : isSyncing 
                  ? 'Cloud Syncing' 
                  : 'Synced to Cloud'}
            </span>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveMode('analyze')}
            className="inline-flex items-center gap-1.5 border border-zinc-800 text-xs font-semibold px-3 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all cursor-pointer"
          >
            <CheckCircle2 size={13} />
            ATS Audit
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer inline-flex items-center justify-center h-8 w-8"
            type="button"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden relative z-10 bg-transparent">
        
        {/* Leftmost Sidebar (Desktop) */}
        <div className="hidden lg:block flex-shrink-0 h-full">
          <SectionSidebar
            activeMode={activeMode}
            onModeChange={setActiveMode}
            resumeCompletion={calculateCompletion(resumeData)}
            resumeData={resumeData}
            onOpenSection={openDrawer}
          />
        </div>

        {/* Mobile Bottom Nav */}
        <ModeRail 
          activeMode={activeMode}
          onChangeMode={(mode) => {
            setActiveMode(mode)
            if (mode === 'studio') {
              setMobileView('edit')
            }
          }}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

        {/* Workspace Display Container */}
        <div className="flex flex-1 flex-row overflow-hidden relative bg-transparent pb-16 lg:pb-0">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
              className="flex-1 flex flex-row overflow-hidden relative bg-transparent"
            >
              {/* 1. STUDIO MODE VIEW */}
              {activeMode === 'studio' && (
                <div className="flex h-full w-full overflow-hidden relative bg-transparent">
                  
                  {/* Main Desktop Editor Form Panel */}
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.995 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.995 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
                    className="hidden lg:flex w-[380px] min-w-[320px] max-w-[420px] border-r border-zinc-800 bg-card/65 backdrop-blur-md flex-col flex-shrink-0 h-full overflow-hidden no-print"
                  >
                    {/* Overview Header */}
                    <div className="px-5 pt-5 pb-3 border-b border-zinc-800/40 flex-shrink-0">
                      <h2 className="text-[16px] font-semibold text-white">
                        Resume Builder
                      </h2>
                      <p className="text-[12px] text-zinc-500 mt-0.5">
                        Click any section to edit
                      </p>
                    </div>

                    {/* Section Cards */}
                    <div className="flex-1 overflow-y-auto form-panel">
                      {overviewSections.map((section) => {
                        const isComplete = getSectionStatus(resumeData)[section.id]
                        const previewText = getSectionPreview(section.id, resumeData)
                        const Icon = section.icon
                        
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => openDrawer(section.id)}
                            className="w-full text-left group flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/40 last:border-0 cursor-pointer"
                          >
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${section.colorClass}`}>
                              <Icon className="w-4 h-4 transition-colors" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-white">
                                {section.title}
                              </p>
                              <p className="text-[12px] text-zinc-500 mt-0.5 truncate">
                                {previewText}
                              </p>
                            </div>

                            {/* Right side */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {isComplete ? (
                                <span className="text-[11px] text-emerald-400">
                                  ● Done
                                </span>
                              ) : (
                                <span className="text-[11px] text-zinc-650">
                                  ○ Edit
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Mobile-only form overlay */}
                  <div className="w-full bg-card/65 backdrop-blur-md flex flex-col h-full overflow-hidden no-print lg:hidden">
                    {/* Overview Header */}
                    <div className="px-5 pt-5 pb-3 border-b border-zinc-800/40 flex-shrink-0 flex items-center justify-between">
                      <div>
                        <h2 className="text-[16px] font-semibold text-white">
                          Resume Builder
                        </h2>
                        <p className="text-[12px] text-zinc-500 mt-0.5">
                          Click any section to edit
                        </p>
                      </div>
                      <button
                        onClick={() => setMobileView('preview')}
                        className="font-bold text-xs h-8 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
                      >
                        View Resume
                      </button>
                    </div>

                    {/* Section Cards */}
                    <div className="flex-1 overflow-y-auto form-panel">
                      {overviewSections.map((section) => {
                        const isComplete = getSectionStatus(resumeData)[section.id]
                        const previewText = getSectionPreview(section.id, resumeData)
                        const Icon = section.icon
                        
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => openDrawer(section.id)}
                            className="w-full text-left group flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/40 last:border-0 cursor-pointer"
                          >
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${section.colorClass}`}>
                              <Icon className="w-4 h-4 transition-colors" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-white">
                                {section.title}
                              </p>
                              <p className="text-[12px] text-zinc-500 mt-0.5 truncate">
                                {previewText}
                              </p>
                            </div>

                            {/* Right side */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {isComplete ? (
                                <span className="text-[11px] text-emerald-400">
                                  ● Done
                                </span>
                              ) : (
                                <span className="text-[11px] text-zinc-650">
                                  ○ Edit
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Live Resume Preview Canvas (Shared for all layouts) */}
                  <div className={`flex-1 h-full bg-zinc-950 overflow-auto p-6 flex items-start justify-center print-block min-w-0 ${mobileView === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="w-full max-w-[858px]">
                      <ResumePreview 
                        resumeData={resumeData}
                        selectedTemplate={selectedTemplate}
                        onChangeTemplate={(t) => updateActiveResume(prev => ({ ...prev, selectedTemplate: t }))}
                        activeSection={activeStudioSection}
                        onEditSection={(section) => {
                          setActiveStudioSection(section)
                          setMobileView('edit')
                        }}
                        onExportPdf={handlePrint}
                        onPageCountChange={setPageCount}
                        sectionOrder={sectionOrder}
                        onSectionOrderChange={setSectionOrder}
                        templateFontSize={templateFontSize}
                        onChangeFontSize={setTemplateFontSize}
                        themeColor={themeColor}
                        onChangeColor={setThemeColor}
                        onTriggerImport={() => setIsResumeImportOpen(true)}
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* 2. PREVIEW MODE VIEW */}
              {activeMode === 'preview' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-card/65 backdrop-blur-md p-5 no-print">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4 flex-shrink-0">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Eye size={16} className="text-red-400" />
                        Document Preview & Export
                      </h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Choose your styling template and preview your resume</p>
                    </div>
                    
                    {/* Template selector */}
                    <div className="flex items-center gap-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Style Template:</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => updateActiveResume(prev => ({ ...prev, selectedTemplate: e.target.value as any }))}
                        className="h-8 rounded-md border border-input bg-zinc-950 px-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="classic">Classic (Serif)</option>
                        <option value="modern">Modern (Tech/Sans)</option>
                        <option value="executive">Executive (Leadership)</option>
                        <option value="minimalist">Minimalist (Clean)</option>
                        <option value="creative">Creative (Accented)</option>
                      </select>
                      
                      <button
                        onClick={handlePrint}
                        className="font-bold text-xs text-rose-400 bg-rose-950/10 border border-rose-900/40 hover:bg-rose-900/20 hover:text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.05)] transition-all h-8 px-3 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={13} />
                        Export PDF
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-6 flex justify-center items-start min-w-0">
                    <div className="w-full max-w-[858px]">
                      <ResumePreview 
                        resumeData={resumeData}
                        selectedTemplate={selectedTemplate}
                        onChangeTemplate={(t) => updateActiveResume(prev => ({ ...prev, selectedTemplate: t }))}
                        activeSection={activeStudioSection}
                        onEditSection={(section) => {
                          setActiveStudioSection(section)
                          setActiveMode('studio')
                        }}
                        onExportPdf={handlePrint}
                        onPageCountChange={setPageCount}
                        sectionOrder={sectionOrder}
                        onSectionOrderChange={setSectionOrder}
                        templateFontSize={templateFontSize}
                        onChangeFontSize={setTemplateFontSize}
                        themeColor={themeColor}
                        onChangeColor={setThemeColor}
                        onTriggerImport={() => setIsResumeImportOpen(true)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ATS CHECK MODE VIEW */}
              {activeMode === 'analyze' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-card/65 backdrop-blur-md p-6 no-print">
                  <div className="flex items-center justify-between border-b border-border pb-4 mb-6 flex-shrink-0">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                        <Activity size={18} className="text-red-400" />
                        Smart ATS Checker
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Optimize your resume against ATS and format requirements</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[880px] mx-auto">
                      <AtsDashboard
                        atsScore={atsScore}
                        resumeData={resumeData}
                        onFix={updateResumeData}
                        jobDescription={jobDescription}
                        onUpdateJobDescription={(jd) => updateActiveResume(prev => ({ ...prev, jobDescription: jd }))}
                        onOpenSection={(sec) => {
                          setActiveMode('studio')
                          setActiveStudioSection(sec)
                        }}
                        apiKey={state.apiKey}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. AI TOOLS MODE VIEW */}
              {activeMode === 'ai' && (
                <AiToolsPanel
                  resumeData={resumeData}
                  onUpdateResumeData={updateResumeData}
                  agentMessages={agentMessages}
                  onSendMessage={handleSendMessage}
                  jobDescription={jobDescription}
                  onUpdateJobDescription={(jd) => updateActiveResume(prev => ({ ...prev, jobDescription: jd }))}
                  apiKey={state.apiKey}
                  onUpdateApiKey={(key) => setState(prev => ({ ...prev, apiKey: key }))}
                />
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* Slide-out Drawer & Backdrop Overlay */}
      <AnimatePresence>
        {activeStudioSection && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] pointer-events-auto no-print"
            />

            {/* Drawer */}
            <SectionDrawer
              section={activeStudioSection}
              resumeData={resumeData}
              apiKey={state.apiKey}
              onChange={updateResumeData}
              onClose={closeDrawer}
            />
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal Component */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            key="settings-modal"
            apiKey={state.apiKey}
            onUpdateApiKey={(key) => setState(prev => ({ ...prev, apiKey: key }))}
            selectedTemplate={selectedTemplate}
            onUpdateTemplate={(template) => updateActiveResume(prev => ({ ...prev, selectedTemplate: template }))}
            resumeData={resumeData}
            onImportResume={handleImportResume}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            isSyncing={isSyncing}
            lastSynced={lastSynced}
            onResetSpace={resetResume}
          />
        )}
      </AnimatePresence>

      {/* Resume Manager Modal Component */}
      <AnimatePresence>
        {isResumeManagerOpen && (
          <ResumeManager
            resumes={state.resumes}
            selectedResumeId={state.selectedResumeId}
            onSelect={handleSelectResume}
            onCreate={handleCreateResume}
            onDuplicate={handleDuplicateResume}
            onRename={handleRenameResume}
            onDelete={handleDeleteResume}
            onClose={() => setIsResumeManagerOpen(false)}
            onTriggerImport={() => setIsResumeImportOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Resume Import Modal Component */}
      <AnimatePresence>
        {isResumeImportOpen && (
          <ResumeImportModal
            isOpen={isResumeImportOpen}
            onClose={() => setIsResumeImportOpen(false)}
            onImport={handleImportParsedResume}
            apiKey={state.apiKey}
            onUpdateApiKey={(key) => setState(prev => ({ ...prev, apiKey: key }))}
          />
        )}
      </AnimatePresence>

      {/* Print Portal */}
      {createPortal(
        <div className="resume-print-wrapper hidden print:block">
          <div className={`resume-page template-${selectedTemplate}`}>
          <style dangerouslySetInnerHTML={{ __html: `
            .resume-page {
              font-size: ${templateFontSize}pt !important;
            }
            .resume-page .text-\\[10px\\] {
              font-size: ${(templateFontSize / 10) * 10}px !important;
            }
            .resume-page .text-\\[10\\.5px\\] {
              font-size: ${(templateFontSize / 10) * 10.5}px !important;
            }
            .resume-page .text-\\[9\\.5px\\] {
              font-size: ${(templateFontSize / 10) * 9.5}px !important;
            }
            .resume-page .text-\\[9px\\] {
              font-size: ${(templateFontSize / 10) * 9}px !important;
            }
            .resume-page .text-\\[8\\.5px\\] {
              font-size: ${(templateFontSize / 10) * 8.5}px !important;
            }
            .resume-page .text-\\[8px\\] {
              font-size: ${(templateFontSize / 10) * 8}px !important;
            }
            .resume-page .text-2xl {
              font-size: ${(templateFontSize / 10) * 24}px !important;
            }
            .resume-page .text-xl {
              font-size: ${(templateFontSize / 10) * 20}px !important;
            }
            .resume-page .text-lg {
              font-size: ${(templateFontSize / 10) * 18}px !important;
            }
            .resume-page .text-base {
              font-size: ${(templateFontSize / 10) * 16}px !important;
            }
            .resume-page .text-sm {
              font-size: ${(templateFontSize / 10) * 14}px !important;
            }
            .resume-page .text-xs {
              font-size: ${(templateFontSize / 10) * 12}px !important;
            }
          ` }} />
          {selectedTemplate === 'classic' && (
            <ClassicTemplate 
              data={resumeData} 
              sectionOrder={sectionOrder}
              themeColor={themeColor}
            />
          )}
          {selectedTemplate === 'modern' && (
            <ModernTemplate 
              data={resumeData} 
              sectionOrder={sectionOrder}
              themeColor={themeColor}
            />
          )}
          {selectedTemplate === 'executive' && (
            <ExecutiveTemplate 
              data={resumeData} 
              sectionOrder={sectionOrder}
              themeColor={themeColor}
            />
          )}
          {selectedTemplate === 'minimalist' && (
            <MinimalistTemplate 
              data={resumeData} 
              sectionOrder={sectionOrder}
              themeColor={themeColor}
            />
          )}
          {selectedTemplate === 'creative' && (
            <CreativeTemplate 
              data={resumeData} 
              sectionOrder={sectionOrder}
              themeColor={themeColor}
            />
          )}
          </div>
        </div>,
        document.body
      )}

      {/* Warnings Verification Modal */}
      {activeWarnings && (
        <ExportWarningModal
          warnings={activeWarnings}
          onClose={() => setActiveWarnings(null)}
          onExportAnyway={() => {
            setActiveWarnings(null)
            setShowPrintModal(true)
          }}
        />
      )}

      {/* Print Settings Modal */}
      {showPrintModal && (
        <PrintSettingsModal
          onClose={() => setShowPrintModal(false)}
          onContinue={() => {
            setShowPrintModal(false)
            triggerNativePrint()
          }}
        />
      )}

    </div>
  )
}

export default App
