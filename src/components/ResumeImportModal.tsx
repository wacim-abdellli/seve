import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Briefcase, 
  GraduationCap, 
  Code2, 
  Globe, 
  FolderOpen,
  ArrowRight,
  ShieldAlert
} from 'lucide-react'
import type { ResumeData } from '../types/resume'
import { extractTextFromFile, parseResumeTextWithAi } from '../utils/resumeParser'

interface ResumeImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (title: string, parsedData: ResumeData) => void
  apiKey: string
  onUpdateApiKey: (key: string) => void
}

type Step = 'upload' | 'parsing' | 'review' | 'error'

export default function ResumeImportModal({
  isOpen,
  onClose,
  onImport,
  apiKey,
  onUpdateApiKey
}: ResumeImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [errorMsg, setErrorMsg] = useState('')
  const [parsingStage, setParsingStage] = useState('')
  const [parsedData, setParsedData] = useState<ResumeData | null>(null)
  
  // Review form editing states
  const [versionTitle, setVersionTitle] = useState('')
  const [activeTab, setActiveTab] = useState<'contact' | 'experience' | 'education' | 'skills' | 'projects'>('contact')
  const [localApiKey, setLocalApiKey] = useState(apiKey)
  const [showKeyPrompt, setShowKeyPrompt] = useState(!apiKey)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  if (!isOpen) return null

  const resetState = () => {
    setStep('upload')
    setErrorMsg('')
    setParsingStage('')
    setParsedData(null)
    setVersionTitle('')
    setActiveTab('contact')
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = async (file: File) => {
    // If API key is missing, prompt for it first
    const activeKey = apiKey || localApiKey
    if (!activeKey || !activeKey.trim()) {
      setShowKeyPrompt(true)
      setErrorMsg('Please enter a Gemini API Key to enable AI resume parsing.')
      setStep('error')
      return
    }

    try {
      setStep('parsing')
      setErrorMsg('')
      
      setParsingStage('Extracting text content from document...')
      const rawText = await extractTextFromFile(file)
      
      setParsingStage('Analyzing format and mapping schema via Gemini AI...')
      const structuredData = await parseResumeTextWithAi(rawText, activeKey)
      
      setParsedData(structuredData)
      
      // Default version title: "Imported - [FullName]"
      const candidateName = structuredData.contact?.fullName || 'Resume'
      setVersionTitle(`Imported - ${candidateName}`)
      
      setStep('review')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An unexpected error occurred while parsing your resume.')
      setStep('error')
    }
  }

  // Update local changes to parsed data
  const handleUpdateContact = (field: keyof ResumeData['contact'], value: string) => {
    if (!parsedData) return
    setParsedData({
      ...parsedData,
      contact: {
        ...parsedData.contact,
        [field]: value
      }
    })
  }

  const handleUpdateSummary = (val: string) => {
    if (!parsedData) return
    setParsedData({
      ...parsedData,
      summary: val
    })
  }

  const handleUpdateExperience = (idx: number, field: string, val: any) => {
    if (!parsedData || !parsedData.experience) return
    const updated = [...parsedData.experience]
    updated[idx] = { ...updated[idx], [field]: val }
    setParsedData({ ...parsedData, experience: updated })
  }

  const handleUpdateEducation = (idx: number, field: string, val: any) => {
    if (!parsedData || !parsedData.education) return
    const updated = [...parsedData.education]
    updated[idx] = { ...updated[idx], [field]: val }
    setParsedData({ ...parsedData, education: updated })
  }

  const handleUpdateSkills = (skillsStr: string) => {
    if (!parsedData) return
    const skillsList = skillsStr.split(',').map(s => s.trim()).filter(Boolean)
    setParsedData({ ...parsedData, skills: skillsList })
  }

  const handleUpdateProject = (idx: number, field: string, val: any) => {
    if (!parsedData || !parsedData.projects) return
    const updated = [...parsedData.projects]
    updated[idx] = { ...updated[idx], [field]: val }
    setParsedData({ ...parsedData, projects: updated })
  }

  const saveImport = () => {
    if (!parsedData) return
    
    // Update parent global API Key if they typed it here
    if (localApiKey && localApiKey !== apiKey) {
      onUpdateApiKey(localApiKey)
    }

    onImport(versionTitle.trim() || 'Imported Resume', parsedData)
    onClose()
    resetState()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
      {/* Backdrop area close */}
      <div className="absolute inset-0" onClick={() => {
        if (step !== 'parsing') {
          onClose()
          resetState()
        }
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
        className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-[720px] max-w-full shadow-2xl flex flex-col max-h-[85vh] z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850 bg-zinc-950/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">AI Resume Parser</h3>
              <p className="text-[11px] text-zinc-400">Import your existing PDF or Word resume using Gemini AI</p>
            </div>
          </div>
          {step !== 'parsing' && (
            <button
              type="button"
              onClick={() => {
                onClose()
                resetState()
              }}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 border border-zinc-850 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic Body Panel */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-[#0d0d0f]">
          <AnimatePresence mode="wait">
            
            {/* 1. UPLOAD STEP */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-5 items-center justify-center py-10 flex-1"
              >
                {showKeyPrompt && (
                  <div className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-left">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Gemini API Key Required</h4>
                      <p className="text-[10px] text-zinc-400 leading-normal mt-0.5 font-light">
                        The resume parser uses direct Google Gemini API calls to structure your file contents. Please enter your key below to begin:
                      </p>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={localApiKey}
                        onChange={(e) => {
                          setLocalApiKey(e.target.value)
                          if (e.target.value.trim()) {
                            setShowKeyPrompt(false)
                            setErrorMsg('')
                          }
                        }}
                        className="mt-3 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/60 font-mono"
                      />
                    </div>
                  </div>
                )}

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group relative ${
                    isDragActive 
                      ? 'border-rose-500 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.05)]' 
                      : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className={`w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 mb-4 group-hover:text-rose-400 group-hover:border-rose-500/30 transition-all ${isDragActive ? 'text-rose-400 scale-110 border-rose-500/40' : ''}`}>
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                    Drag & Drop your resume here, or <span className="text-rose-400 underline">browse</span>
                  </span>
                  <span className="text-[10px] text-zinc-550 mt-1 font-light">
                    Supports PDF and Microsoft Word (.docx) formats up to 5MB
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 italic max-w-sm text-center leading-normal">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-zinc-650" />
                  <span>Your resume content is processed locally and sent directly to Google Gemini. We do not store or read your documents.</span>
                </div>
              </motion.div>
            )}

            {/* 2. PARSING STATE */}
            {step === 'parsing' && (
              <motion.div
                key="parsing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-14 flex-1 text-center"
              >
                <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border border-dashed border-rose-500/20 animate-spin [animation-duration:8s]" />
                  <div className="absolute -inset-1 rounded-full border-2 border-transparent border-t-rose-500 animate-spin [animation-duration:1.2s]" />
                  <FileText className="w-6 h-6 text-rose-400 animate-pulse" />
                </div>

                <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Analysis in Progress</h4>
                <p className="text-[11px] text-zinc-400 mt-2 font-mono max-w-md h-8">
                  {parsingStage}
                </p>
              </motion.div>
            )}

            {/* 3. REVIEW STEP */}
            {step === 'review' && parsedData && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col flex-1 gap-4 min-h-0"
              >
                {/* Version Title Input Header */}
                <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-xl flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Import version title</label>
                  <input
                    type="text"
                    value={versionTitle}
                    onChange={(e) => setVersionTitle(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/60"
                    placeholder="e.g. Software Engineer (Parsed)"
                  />
                </div>

                {/* Tabs Selector */}
                <div className="flex border-b border-zinc-850 gap-1.5 flex-shrink-0">
                  {([
                    { id: 'contact', label: 'Contact', icon: Globe },
                    { id: 'experience', label: 'Experience', icon: Briefcase },
                    { id: 'education', label: 'Education', icon: GraduationCap },
                    { id: 'skills', label: 'Skills & Stack', icon: Code2 },
                    { id: 'projects', label: 'Projects', icon: FolderOpen }
                  ] as const).map((tab) => {
                    const TabIcon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                          isActive 
                            ? 'border-rose-500 text-rose-450' 
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-[200px]">
                  
                  {/* TAB: CONTACT */}
                  {activeTab === 'contact' && (
                    <div className="space-y-4 py-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                          <input
                            type="text"
                            value={parsedData.contact.fullName}
                            onChange={(e) => handleUpdateContact('fullName', e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                          <input
                            type="email"
                            value={parsedData.contact.email}
                            onChange={(e) => handleUpdateContact('email', e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Phone Number</label>
                          <input
                            type="text"
                            value={parsedData.contact.phone}
                            onChange={(e) => handleUpdateContact('phone', e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Location</label>
                          <input
                            type="text"
                            value={parsedData.contact.location}
                            onChange={(e) => handleUpdateContact('location', e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">LinkedIn Profile</label>
                          <input
                            type="text"
                            value={parsedData.contact.linkedin}
                            onChange={(e) => handleUpdateContact('linkedin', e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Personal Website</label>
                          <input
                            type="text"
                            value={parsedData.contact.website || ''}
                            onChange={(e) => handleUpdateContact('website', e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 pt-2">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Profile Summary</label>
                        <textarea
                          value={parsedData.summary}
                          onChange={(e) => handleUpdateSummary(e.target.value)}
                          className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 resize-none focus:outline-none focus:border-rose-500/60"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB: EXPERIENCE */}
                  {activeTab === 'experience' && (
                    <div className="space-y-4 py-2">
                      {!parsedData.experience || parsedData.experience.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic text-center py-6">No experience parsed.</p>
                      ) : (
                        parsedData.experience.map((exp, idx) => (
                          <div key={exp.id || idx} className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl space-y-3 relative group">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Job Title</label>
                                <input
                                  type="text"
                                  value={exp.jobTitle}
                                  onChange={(e) => handleUpdateExperience(idx, 'jobTitle', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Company</label>
                                <input
                                  type="text"
                                  value={exp.company}
                                  onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Dates (Start - End)</label>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={exp.startDate}
                                    onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60 flex-1"
                                    placeholder="MM/YYYY"
                                  />
                                  <span className="text-zinc-600 text-xs">-</span>
                                  <input
                                    type="text"
                                    disabled={exp.current}
                                    value={exp.current ? 'Present' : exp.endDate}
                                    onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60 flex-1 disabled:opacity-40"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-4">
                                <input
                                  type="checkbox"
                                  id={`current-${idx}`}
                                  checked={exp.current}
                                  onChange={(e) => handleUpdateExperience(idx, 'current', e.target.checked)}
                                  className="rounded border-zinc-800 text-rose-500 focus:ring-rose-500 bg-zinc-900"
                                />
                                <label htmlFor={`current-${idx}`} className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider cursor-pointer">
                                  Current Job
                                </label>
                              </div>
                            </div>
                            
                            {/* Bullets text block */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Bullet Achievements (one per line)</label>
                              <textarea
                                value={exp.bullets.join('\n')}
                                onChange={(e) => handleUpdateExperience(idx, 'bullets', e.target.value.split('\n'))}
                                className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 font-sans resize-none focus:outline-none focus:border-rose-500/60"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB: EDUCATION */}
                  {activeTab === 'education' && (
                    <div className="space-y-4 py-2">
                      {!parsedData.education || parsedData.education.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic text-center py-6">No education parsed.</p>
                      ) : (
                        parsedData.education.map((edu, idx) => (
                          <div key={edu.id || idx} className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">School / University</label>
                                <input
                                  type="text"
                                  value={edu.school}
                                  onChange={(e) => handleUpdateEducation(idx, 'school', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Degree</label>
                                <input
                                  type="text"
                                  value={edu.degree}
                                  onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                                <input
                                  type="text"
                                  value={edu.location}
                                  onChange={(e) => handleUpdateEducation(idx, 'location', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Graduation Date</label>
                                <input
                                  type="text"
                                  value={edu.graduationDate}
                                  onChange={(e) => handleUpdateEducation(idx, 'graduationDate', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                  placeholder="MM/YYYY"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">GPA</label>
                                <input
                                  type="text"
                                  value={edu.gpa || ''}
                                  onChange={(e) => handleUpdateEducation(idx, 'gpa', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                  placeholder="e.g. 3.8 / 4.0"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB: SKILLS & STACK */}
                  {activeTab === 'skills' && (
                    <div className="space-y-4 py-2">
                      <div className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl flex flex-col gap-2">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Detected Skills (separated by commas)</label>
                        <textarea
                          value={parsedData.skills.join(', ')}
                          onChange={(e) => handleUpdateSkills(e.target.value)}
                          className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 resize-none focus:outline-none focus:border-rose-500/60 font-sans leading-relaxed"
                          placeholder="React, TypeScript, Node.js..."
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {parsedData.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-medium font-sans">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: PROJECTS */}
                  {activeTab === 'projects' && (
                    <div className="space-y-4 py-2">
                      {!parsedData.projects || parsedData.projects.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic text-center py-6">No projects parsed.</p>
                      ) : (
                        parsedData.projects.map((proj, idx) => (
                          <div key={proj.id || idx} className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Project Title</label>
                                <input
                                  type="text"
                                  value={proj.name}
                                  onChange={(e) => handleUpdateProject(idx, 'name', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Project URL / Link</label>
                                <input
                                  type="text"
                                  value={proj.link || ''}
                                  onChange={(e) => handleUpdateProject(idx, 'link', e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                  placeholder="e.g. github.com/..."
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Technologies (comma separated)</label>
                                <input
                                  type="text"
                                  value={proj.technologies.join(', ')}
                                  onChange={(e) => handleUpdateProject(idx, 'technologies', e.target.value.split(',').map((t: string) => t.trim()))}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Project Description</label>
                              <textarea
                                value={proj.description}
                                onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                                className="w-full h-16 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 font-sans resize-none focus:outline-none focus:border-rose-500/60"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* 4. ERROR STEP */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 flex-1 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-4 animate-bounce">
                  <AlertCircle className="w-6 h-6" />
                </div>
                
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Parsing Failed</h4>
                <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
                  {errorMsg}
                </p>

                {showKeyPrompt && (
                  <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 mt-4 text-left">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Enter Gemini API Key</label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/60 font-mono"
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('upload')
                      setErrorMsg('')
                      setShowKeyPrompt(false)
                    }}
                    className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-xs font-semibold text-zinc-350 transition-colors cursor-pointer"
                  >
                    Back to Upload
                  </button>
                  {localApiKey.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setStep('upload')
                        setErrorMsg('')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try Again
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer actions */}
        {step === 'review' && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-850 bg-zinc-950/50 flex-shrink-0">
            <button
              onClick={() => {
                setStep('upload')
                setParsedData(null)
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors font-bold px-3 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={saveImport}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/10 cursor-pointer"
            >
              <span>Import Version</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
