import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message, ResumeData } from '../types/resume'
import { generateContent } from '../utils/aiService'
import { industryKeywords } from '../utils/keywords'
import { Send, HelpCircle, Bot, Zap, Plus, FileText, Check } from 'lucide-react'

interface AgentChatProps {
  messages: Message[]
  onSendMessage: (role: 'agent' | 'user', content: string) => void
  resumeData: ResumeData
  onUpdateResumeData: (updated: ResumeData) => void
  onUpdateJobDescription: (jd: string) => void
  apiKey: string
}

// Simple Helper to format markdown bold and lists in JSX
function formatAgentMessage(content: string) {
  const lines = content.split('\n')
  return lines.map((line, idx) => {
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')
    const cleanLine = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : line

    // Parse **bold** parts
    const parts = cleanLine.split(/(\*\*.*?\*\*)/g)
    const formatted = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-extrabold text-white">{part.slice(2, -2)}</strong>
      }
      return part
    })

    if (isBullet) {
      return (
        <li key={idx} className="ml-4 pl-1 mb-1 text-[11.5px] text-zinc-400 leading-relaxed list-disc">
          {formatted}
        </li>
      )
    }
    return (
      <p key={idx} className="mb-2 text-[11.5px] text-zinc-300 leading-relaxed margin-0">
        {formatted}
      </p>
    )
  })
}

interface TypewriterMessageProps {
  content: string
  shouldAnimate: boolean
  onComplete: () => void
}

function TypewriterMessage({ content, shouldAnimate, onComplete }: TypewriterMessageProps) {
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : content)

  useEffect(() => {
    if (!shouldAnimate) {
      queueMicrotask(() => setDisplayedText(content))
      return
    }

    queueMicrotask(() => setDisplayedText(''))
    let currentIdx = 0
    const interval = setInterval(() => {
      if (currentIdx < content.length) {
        setDisplayedText(content.slice(0, currentIdx + 1))
        currentIdx++
      } else {
        clearInterval(interval)
        onComplete()
      }
    }, 10)

    return () => clearInterval(interval)
  }, [content, shouldAnimate, onComplete])

  return <>{formatAgentMessage(displayedText)}</>
}

export default function AgentChat({
  messages,
  onSendMessage,
  resumeData,
  onUpdateResumeData,
  onUpdateJobDescription,
  apiKey,
}: AgentChatProps) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [completedAnimationIds, setCompletedAnimationIds] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text) return

    onSendMessage('user', text)
    setInputValue('')
    setIsTyping(true)

    setTimeout(async () => {
      await processAgentResponse(text)
      setIsTyping(false)
    }, 800)
  }

  const handleQuickReply = async (text: string) => {
    onSendMessage('user', text)
    setIsTyping(true)
    setTimeout(async () => {
      await processAgentResponse(text)
      setIsTyping(false)
    }, 800)
  }

  const processAgentResponse = async (input: string) => {
    const clean = input.trim()
    const lower = clean.toLowerCase()

    // 1. COMMAND DETECTIONS
    if (lower === 'help' || lower === 'commands' || lower === '/help') {
      onSendMessage(
        'agent',
        `Here are the commands you can use to control me:
        • **help** - Show these commands.
        • **suggest summary** - Write a custom summary based on your profile.
        • **suggest skills** - Suggest skills for your target role.
        • **reset** - Clear the current resume data.
        • **ats check** - Display advice on your ATS score.
        • **add experience** - Guide you to add work experience.
        • **update name [your name]** - Update your name directly.`
      )
      return
    }

    if (lower === 'reset' || lower === '/reset') {
      if (window.confirm('Clear all resume data?')) {
        onUpdateResumeData({
          contact: { fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' },
          summary: '',
          experience: [],
          education: [],
          skills: [],
          projects: [],
        })
        onSendMessage('agent', "I have reset all resume data. Let's start fresh! What is your full name?")
      } else {
        onSendMessage('agent', 'Reset cancelled. We are ready to continue!')
      }
      return
    }

    if (lower === 'ats check' || lower === 'score' || lower === 'audit') {
      onSendMessage(
        'agent',
        `Checking ATS metrics... 
        Your current score is **${evaluateResumeScore()}**. 
        Go to the **ATS Check** tab to see the full audit checklist or run **One-Click Auto-Fix** to instantly repair date formats and pronouns!`
      )
      return
    }

    if (lower.startsWith('tailor to ') || lower.startsWith('job description:')) {
      const jd = clean.replace(/^(tailor to|job description:)\s+/i, '')
      onUpdateJobDescription(jd)
      onSendMessage(
        'agent',
        `I have updated your target job description! You can now view missing keywords in the **Tailor JD** tab or ask me to write optimized sections.`
      )
      return
    }

    // 2. CONVERSATIONAL AUTONOMY (WITH GEMINI API KEY)
    if (apiKey && apiKey.trim() !== '') {
      try {
        const agentPrompt = `
        The user is interacting with you to build their resume.
        Current Resume JSON:
        ${JSON.stringify(resumeData)}
        
        User input: "${clean}"
        
        Task:
        1. If the user is providing information (e.g. contact info, experience details, education details, skills, projects), update the Resume JSON accordingly. Keep existing fields unless they are specifically changing them.
        2. Format your response exactly like this:
        
        ---UPDATED_RESUME_DATA---
        [Valid JSON representing the updated ResumeData state. Only output valid JSON structure matching: {contact: {fullName, email, phone, linkedin, location, website}, summary: string, experience: [{id, jobTitle, company, location, startDate, endDate, current, bullets: [string]}], education: [{id, degree, school, location, graduationDate, gpa}], skills: [string], projects: [{id, name, description, technologies: [string], link}]}]
        ---UPDATED_RESUME_DATA---
        
        [Your friendly response message to the user explaining what you updated, or answering their question, or giving resume coach advice. Use bold **text** and lists for formatting.]
        
        Do not output markdown code blocks (\`\`\`json) inside the updated resume data block. Keep the JSON strictly valid.
        `
        const responseText = await generateContent(agentPrompt, apiKey, 'improve')
        
        const jsonMatch = responseText.match(/---UPDATED_RESUME_DATA---([\s\S]*?)---UPDATED_RESUME_DATA---/)
        if (jsonMatch && jsonMatch[1]) {
          try {
            const updatedJson = JSON.parse(jsonMatch[1].trim())
            onUpdateResumeData(updatedJson)
            
            const userMsg = responseText.replace(/---UPDATED_RESUME_DATA---[\s\S]*?---UPDATED_RESUME_DATA---/, '').trim()
            onSendMessage('agent', userMsg || 'I have updated your resume data accordingly!')
            return
          } catch (jsonErr) {
            console.error('Failed to parse updated JSON from Gemini response', jsonErr)
          }
        }
        
        onSendMessage('agent', responseText.replace(/---UPDATED_RESUME_DATA---[\s\S]*?---UPDATED_RESUME_DATA---/g, '').trim())
        return
      } catch (err) {
        console.error('Autonomous agent failed, falling back to local guidance', err)
      }
    }

    // 3. LOCAL ASSISTANT HEURISTICS (FALLBACK)
    await processLocalHeuristics(clean)
  }

  const evaluateResumeScore = (): number => {
    let score = 0
    if (resumeData.contact.fullName) score += 10
    if (resumeData.contact.email) score += 5
    if (resumeData.contact.phone) score += 5
    if (resumeData.summary) score += 20
    if (resumeData.experience.length > 0) score += 25
    if (resumeData.education.length > 0) score += 15
    if (resumeData.skills.length > 0) score += 20
    return score
  }

  const processLocalHeuristics = async (input: string) => {
    const clean = input.trim()
    const lower = clean.toLowerCase()
    
    // Heuristic 1: Name Extraction
    if (lower.startsWith('update name') || lower.startsWith('my name is')) {
      const name = clean.replace(/^(update name|my name is)\s+/i, '')
      onUpdateResumeData({
        ...resumeData,
        contact: { ...resumeData.contact, fullName: name }
      })
      onSendMessage('agent', `I've updated your name to **${name}**! What is your email address?`)
      return
    }

    // Heuristic 2: Email Extraction
    if (lower.includes('@') && (lower.includes('.com') || lower.includes('.org') || lower.includes('.net'))) {
      const email = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || clean
      onUpdateResumeData({
        ...resumeData,
        contact: { ...resumeData.contact, email }
      })
      onSendMessage('agent', `I've saved your email as **${email}**! What is your phone number?`)
      return
    }

    // Heuristic 3: Suggest Summary
    if (lower.includes('suggest summary') || lower.includes('write summary')) {
      onSendMessage('agent', 'Generating an ATS-optimized professional summary locally...')
      const targetRole = resumeData.experience[0]?.jobTitle || 'Professional'
      const summary = await generateContent(`Write a resume summary for a ${targetRole}`, apiKey, 'summary')
      onUpdateResumeData({
        ...resumeData,
        summary
      })
      onSendMessage('agent', `I've generated and applied this summary to your resume:\n\n"${summary}"`)
      return
    }

    // Heuristic 4: Suggest Skills
    if (lower.includes('suggest skills') || lower.includes('recommend skills')) {
      const targetRole = (resumeData.experience[0]?.jobTitle || '').toLowerCase()
      let category: keyof typeof industryKeywords = 'management'
      
      if (/developer|engineer|software|tech|coder|programmer|web/i.test(targetRole)) {
        category = 'softwareTech'
      } else if (/designer|design|ui|ux|graphic|creative/i.test(targetRole)) {
        category = 'design'
      } else if (/marketing|seo|sem|brand|content|social/i.test(targetRole)) {
        category = 'marketing'
      } else if (/finance|account|audit|budget|financial/i.test(targetRole)) {
        category = 'finance'
      } else if (/patient|nurse|health|medical|clinical|care/i.test(targetRole)) {
        category = 'healthcare'
      } else if (/sales|sell|b2b|b2c|retail/i.test(targetRole)) {
        category = 'sales'
      } else if (/manager|lead|pmp|scrum|director|vp|head|strategic/i.test(targetRole)) {
        category = 'management'
      }
      
      const mockSkills = industryKeywords[category].slice(0, 8)
      onUpdateResumeData({
        ...resumeData,
        skills: Array.from(new Set([...resumeData.skills, ...mockSkills]))
      })
      onSendMessage('agent', `Based on your target role, I have recommended and added several key skills: ${mockSkills.join(', ')}. Check the **Skills** tab to edit them!`)
      return
    }

    // Heuristic 5: Add experience flow
    if (lower.includes('add experience') || lower.includes('add a job') || lower.includes('add job')) {
      const newJob = {
        id: crypto.randomUUID(),
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: []
      }
      onUpdateResumeData({
        ...resumeData,
        experience: [...resumeData.experience, newJob]
      })
      onSendMessage('agent', "I've appended a blank job card to your Work Experience! Open the Form Editor to fill it out.")
      return
    }

    // Heuristic 6: Default fallback guide
    onSendMessage(
      'agent',
      `I've noted that. As your Seve Coach, I suggest keeping your resume structured:
      • Complete your **Contact Info** (FullName, Email, LinkedIn).
      • Write a brief **Summary** statement.
      • Fill in your **Work Experience** and **Education**.
      
      Paste your Gemini API key in **Settings** to unlock full conversational resume construction! Or type **help** to see all commands.`
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      
      {/* Coach Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border no-print select-none flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-violet-600 shadow-[0_0_12px_rgba(239, 68, 68,0.25)] text-white">
              <Bot className="w-5 h-5 text-zinc-100" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-950" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-1">
              AI Resume Coach
              {apiKey && <Zap className="w-3.5 h-3.5 text-red-400" />}
            </h2>
            <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block mt-0.5">
              {apiKey ? 'Google Gemini Engine' : 'Local Heuristic Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 mb-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {(messages.length > 0 ? messages : [
            {
              id: 'fallback-welcome',
              role: 'agent' as const,
              content: "Hello! I am Aria, your AI Career Coach. Let's get started on building a market-disrupting resume. Tell me about your target job title, or copy-paste the job description here!",
              timestamp: new Date()
            }
          ]).map((msg, _, arr) => {
            const isLatestAgent = msg.id === arr[arr.length - 1]?.id && msg.role === 'agent'
            const shouldAnimate = isLatestAgent && !completedAnimationIds[msg.id]

            return (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 12, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
                className={`p-4 rounded-2xl flex flex-col shadow-sm max-w-[85%] border ${
                  msg.role === 'agent'
                    ? 'self-start bg-zinc-900 border-border text-zinc-350 mr-auto'
                    : 'self-end bg-red-500/10 border-red-500/25 text-white ml-auto'
                }`}
              >
                <div className="text-xs leading-relaxed">
                  {msg.role === 'agent' ? (
                    <TypewriterMessage
                      content={msg.content}
                      shouldAnimate={shouldAnimate}
                      onComplete={() => {
                        setCompletedAnimationIds((prev) => ({ ...prev, [msg.id]: true }))
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-line font-medium">{msg.content}</p>
                  )}
                </div>
                <span className="text-[9px] font-mono text-right mt-2 text-zinc-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Shimmering Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 bg-zinc-900 border border-border px-4 py-2.5 rounded-xl self-start w-[64px]"
          >
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick Reply Recommendation Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3 no-print select-none flex-shrink-0">
        <button
          onClick={() => handleQuickReply('suggest summary')}
          className="px-2.5 py-1.5 bg-zinc-900 border border-border hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <FileText className="w-3 h-3 text-red-400" /> Write Summary
        </button>
        <button
          onClick={() => handleQuickReply('ats check')}
          className="px-2.5 py-1.5 bg-zinc-900 border border-border hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <Zap className="w-3 h-3 text-red-400" /> ATS Score Audit
        </button>
        <button
          onClick={() => handleQuickReply('add experience')}
          className="px-2.5 py-1.5 bg-zinc-900 border border-border hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3 text-red-400" /> Add Job Card
        </button>
        <button
          onClick={() => handleQuickReply('suggest skills')}
          className="px-2.5 py-1.5 bg-zinc-900 border border-border hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <Check className="w-3 h-3 text-red-400" /> Suggest Skills
        </button>
        <button
          onClick={() => handleQuickReply('help')}
          className="px-2.5 py-1.5 bg-zinc-900 border border-border hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3 h-3 text-red-400" /> Commands
        </button>
      </div>

      {/* Input box form */}
      <form onSubmit={handleSend} className="flex border-t border-border pt-3 gap-2 no-print select-none flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isTyping ? 'Coach is thinking...' : 'Ask tips or type commands...'}
          disabled={isTyping}
          className="h-9 rounded-lg border border-border bg-zinc-950 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-1"
        />
        <button
          type="submit"
          disabled={isTyping || !inputValue.trim()}
          className="h-9 w-9 bg-red-950/20 hover:bg-red-900/30 disabled:opacity-50 disabled:pointer-events-none text-red-400 hover:text-red-300 border border-red-900/40 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(224, 49, 79,0.05)] transition-all cursor-pointer active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}
