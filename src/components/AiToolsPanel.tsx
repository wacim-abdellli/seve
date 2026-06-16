import { useState } from 'react'
import type { Message, ResumeData } from '../types/resume'
import AgentChat from './AgentChat'
import CoverLetterPanel from './CoverLetterPanel'
import JobTailor from './JobTailor'
import { MessageSquareText, Mail, Sparkles, Key, Zap, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface AiToolsPanelProps {
  resumeData: ResumeData
  onUpdateResumeData: (updated: ResumeData) => void
  agentMessages: Message[]
  onSendMessage: (role: 'agent' | 'user', content: string) => void
  jobDescription: string
  onUpdateJobDescription: (jd: string) => void
  apiKey: string
  onUpdateApiKey: (key: string) => void
}

export default function AiToolsPanel({
  resumeData,
  onUpdateResumeData,
  agentMessages,
  onSendMessage,
  jobDescription,
  onUpdateJobDescription,
  apiKey,
  onUpdateApiKey,
}: AiToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<'coach' | 'letter' | 'tailor'>('coach')
  const [inputKey, setInputKey] = useState(apiKey)

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateApiKey(inputKey.trim())
  }

  // If no API key is configured, show setup screen
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-6 flex-1 bg-background no-print">
        <Card className="max-w-[420px] w-full border-border bg-card p-8 text-center shadow-xl relative">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
            <Key className="w-5 h-5 animate-pulse" />
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">
              Gemini API Key Required
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-light">
              Optional AI tools (Aria Coach, Cover Letters, and Job Tailoring suggestions) require a Google Gemini API Key.
            </p>
          </div>

          <form onSubmit={handleSaveKey} className="mb-4">
            <div className="flex flex-col gap-2 text-left mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Configure API Key
              </label>
              <Input
                type="password"
                placeholder="AI Studio API Key (AIzaSy...)"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="font-mono text-center h-9 text-xs"
              />
            </div>
            <Button type="submit" className="w-full font-bold text-xs h-9 text-red-400 bg-red-950/10 border border-red-900/40 hover:bg-red-900/20 hover:text-red-300 shadow-[0_0_12px_rgba(224, 49, 79,0.05)] transition-all">
              Activate AI Tools
            </Button>
          </form>

          <div className="pt-4 border-t border-border/60">
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              Get a free API key at Google AI Studio
            </a>
            <p className="text-[10px] text-zinc-500 italic mt-3 leading-normal font-light">
              Note: Your API key is stored locally in your browser and never sent to any third-party server besides Google's official Gemini endpoint.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Dashboard Tabbed Panel
  return (
    <div className="flex flex-col h-full flex-1 bg-background overflow-hidden no-print">
      {/* Header bar with tabs */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-border bg-zinc-950 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-red-400 animate-spin" style={{ animationDuration: '8s' }} />
            AI Career Assistant
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-light">Gemini-powered coaching and writing pipeline</p>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center bg-zinc-900 border border-border rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('coach')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'coach' 
                ? 'bg-primary text-primary-foreground shadow' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            AI Coach
          </button>
          <button
            onClick={() => setActiveTab('letter')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'letter' 
                ? 'bg-primary text-primary-foreground shadow' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab('tailor')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'tailor' 
                ? 'bg-primary text-primary-foreground shadow' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Tailoring
          </button>
        </div>
      </div>

      {/* Main panel displays */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'coach' && (
          <div className="grid grid-cols-1 md:grid-cols-12 h-full gap-0">
            {/* Coach Chat */}
            <div className="md:col-span-7 lg:col-span-8 h-full flex flex-col border-r border-border bg-zinc-950/20">
              <AgentChat
                messages={agentMessages}
                onSendMessage={onSendMessage}
                resumeData={resumeData}
                onUpdateResumeData={onUpdateResumeData}
                onUpdateJobDescription={onUpdateJobDescription}
                apiKey={apiKey}
              />
            </div>

            {/* Context Panel */}
            <div className="hidden md:flex md:col-span-5 lg:col-span-4 flex-col bg-background overflow-y-auto p-5 gap-4 custom-scrollbar">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-red-400" />
                  Context Reference
                </span>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded">
                  <Zap className="w-2.5 h-2.5 fill-current" /> Active
                </Badge>
              </div>

              <Card className="p-4 bg-zinc-900/40 border-border">
                <div className="text-xs font-bold text-white mb-0.5">{resumeData.contact.fullName || '—'}</div>
                <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{resumeData.experience[0]?.jobTitle || 'No Job Title Added'}</div>
                
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/60">
                  {resumeData.skills.slice(0, 8).map((sk, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[9px] uppercase tracking-wider font-bold py-0.5 px-2 bg-red-500/5 border-red-500/10 text-red-400 rounded"
                    >
                      {sk}
                    </Badge>
                  ))}
                  {resumeData.skills.length === 0 && (
                    <span className="text-[10px] text-zinc-600 italic">No skills added yet</span>
                  )}
                </div>
              </Card>

              <div className="flex flex-col gap-3">
                {resumeData.experience.slice(0, 3).map((exp, i) => (
                  <Card key={i} className="p-3 bg-zinc-900/40 border-border flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-200">{exp.jobTitle || 'Role Title'}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{exp.startDate}–{exp.endDate}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-light">{exp.company || 'Company Name'}</div>
                    {exp.bullets[0] && (
                      <p className="text-[10.5px] text-zinc-400 italic pt-2 border-t border-border/40 leading-relaxed font-light">
                        • {exp.bullets[0]}
                      </p>
                    )}
                  </Card>
                ))}
                {resumeData.experience.length === 0 && (
                  <div className="text-xs text-zinc-600 italic text-center py-6 font-light">
                    Add experience in Edit mode to refer here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'letter' && (
          <div className="grid grid-cols-1 md:grid-cols-12 h-full gap-0">
            <div className="md:col-span-7 lg:col-span-8 h-full overflow-y-auto p-6 border-r border-border bg-zinc-950/20 custom-scrollbar">
              <CoverLetterPanel
                resumeData={resumeData}
                jobDescription={jobDescription}
                apiKey={apiKey}
                onUpdateJobDescription={onUpdateJobDescription}
              />
            </div>

            <div className="hidden md:flex md:col-span-5 lg:col-span-4 flex-col bg-background overflow-y-auto p-5 gap-4 custom-scrollbar">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-red-400" />
                Resume Context
              </div>
              <Card className="p-4 bg-zinc-900/40 border-border">
                <div className="text-xs font-bold text-white mb-0.5">{resumeData.contact.fullName || '—'}</div>
                <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{resumeData.experience[0]?.jobTitle || 'Target Role'}</div>
              </Card>
              <div className="flex flex-col gap-3">
                {resumeData.experience.slice(0, 3).map((exp, i) => (
                  <Card key={i} className="p-3 bg-zinc-900/40 border-border flex flex-col gap-1">
                    <div className="text-xs font-bold text-zinc-200">{exp.jobTitle || 'Role'}</div>
                    <div className="text-[10px] text-muted-foreground font-light">{exp.company}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tailor' && (
          <div className="h-full overflow-y-auto p-6 bg-zinc-950/20 custom-scrollbar">
            <div className="max-w-[840px] mx-auto">
              <JobTailor
                resumeData={resumeData}
                jobDescription={jobDescription}
                onUpdateJobDescription={onUpdateJobDescription}
                onUpdateResumeData={onUpdateResumeData}
                apiKey={apiKey}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
