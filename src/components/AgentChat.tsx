import React, { useState, useEffect, useRef } from 'react'
import type { Message, ResumeData } from '../types/resume'
import { generateContent } from '../utils/aiService'

interface AgentChatProps {
  messages: Message[]
  onSendMessage: (role: 'agent' | 'user', content: string) => void
  resumeData: ResumeData
  onUpdateResumeData: (updated: ResumeData) => void
  onUpdateJobDescription: (jd: string) => void
  apiKey: string
}

type FlowStep =
  | 'job_title'
  | 'industry'
  | 'experience_years'
  | 'job_desc'
  | 'name'
  | 'email'
  | 'phone'
  | 'linkedin'
  | 'location'
  | 'summary'
  | 'exp_title'
  | 'exp_company'
  | 'exp_dates'
  | 'exp_bullets'
  | 'education'
  | 'final'

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
  const [currentStep, setCurrentStep] = useState<FlowStep>('job_title')
  const [targetJob, setTargetJob] = useState('')
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages list changes or typing state changes
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text) return

    // Add user message
    onSendMessage('user', text)
    setInputValue('')
    setIsTyping(true)

    // Simulate AI typing delay
    setTimeout(async () => {
      await processStepResponse(text)
      setIsTyping(false)
    }, 1200)
  }

  const processStepResponse = async (input: string) => {
    let reply = ''
    const clean = input.trim()

    switch (currentStep) {
      case 'job_title':
        setTargetJob(clean)
        reply = `Excellent! A ${clean} role is exciting. What industry is this position in?`
        setCurrentStep('industry')
        break

      case 'industry':
        reply = `Got it. The ${clean} space has great growth. How many years of experience do you have?`
        setCurrentStep('experience_years')
        break

      case 'experience_years':
        reply = `Understood. Do you have a specific job description you want to tailor this resume for? Paste it now, or type 'no' to skip.`
        setCurrentStep('job_desc')
        break

      case 'job_desc':
        if (clean.toLowerCase() !== 'no') {
          onUpdateJobDescription(clean)
          reply = `Wonderful! I have saved that job description. Let's start building your resume. What is your full name?`
        } else {
          reply = `No problem, we'll build a general ATS resume! Let's start building. What is your full name?`
        }
        setCurrentStep('name')
        break

      case 'name':
        onUpdateResumeData({
          ...resumeData,
          contact: { ...resumeData.contact, fullName: clean },
        })
        reply = `Nice to meet you, ${clean}! What is your email address?`
        setCurrentStep('email')
        break

      case 'email':
        onUpdateResumeData({
          ...resumeData,
          contact: { ...resumeData.contact, email: clean },
        })
        reply = `Perfect. What is your phone number?`
        setCurrentStep('phone')
        break

      case 'phone':
        onUpdateResumeData({
          ...resumeData,
          contact: { ...resumeData.contact, phone: clean },
        })
        reply = `Got it. Please enter your LinkedIn profile link.`
        setCurrentStep('linkedin')
        break

      case 'linkedin':
        onUpdateResumeData({
          ...resumeData,
          contact: { ...resumeData.contact, linkedin: clean },
        })
        reply = `Great! What city and state are you located in (e.g. San Francisco, CA)?`
        setCurrentStep('location')
        break

      case 'location':
        onUpdateResumeData({
          ...resumeData,
          contact: { ...resumeData.contact, location: clean },
        })
        reply = `Excellent. Now, let's write your summary. Type 'suggest' to let me generate an ATS-optimized draft for a ${targetJob} role, or paste your own summary.`
        setCurrentStep('summary')
        break

      case 'summary':
        let finalSummary = clean
        if (clean.toLowerCase() === 'suggest') {
          reply = 'Generating your professional summary...'
          finalSummary = await generateContent(`Write a 3-sentence professional summary for a ${targetJob} resume.`, apiKey, 'summary')
        }
        onUpdateResumeData({
          ...resumeData,
          summary: finalSummary,
        })
        reply = `I've added the summary to your resume. Let's add your work history. What is your job title at your current or most recent company?`
        setCurrentStep('exp_title')
        break

      case 'exp_title':
        const newExp = {
          id: crypto.randomUUID(),
          jobTitle: clean,
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: true,
          bullets: [''],
        }
        onUpdateResumeData({
          ...resumeData,
          experience: [newExp],
        })
        reply = `Great. What is the company name for your role as a ${clean}?`
        setCurrentStep('exp_company')
        break

      case 'exp_company':
        const updatedExpList = [...resumeData.experience]
        if (updatedExpList.length) {
          updatedExpList[0].company = clean
          onUpdateResumeData({ ...resumeData, experience: updatedExpList })
        }
        reply = `Got it. What are the start and end dates (e.g., '05/2021 - Present')?`
        setCurrentStep('exp_dates')
        break

      case 'exp_dates':
        const expListDates = [...resumeData.experience]
        if (expListDates.length) {
          const parts = clean.split('-')
          expListDates[0].startDate = parts[0]?.trim() || '01/2021'
          expListDates[0].endDate = parts[1]?.trim() || 'Present'
          expListDates[0].current = /present/i.test(parts[1] || '')
          onUpdateResumeData({ ...resumeData, experience: expListDates })
        }
        reply = `Excellent. Tell me 1 or 2 accomplishments you did there, and I will format them into action-verb ATS bullets.`
        setCurrentStep('exp_bullets')
        break

      case 'exp_bullets':
        const expListBullets = [...resumeData.experience]
        if (expListBullets.length) {
          reply = 'Refining achievements into strong action-verb bullets...'
          const bulletsText = await generateContent(
            `Write 3 strong ATS-optimized bullet points for a ${expListBullets[0].jobTitle} role based on these accomplishments: "${clean}".`,
            apiKey,
            'bullet'
          )
          const parsed = bulletsText
            .split('\n')
            .map((b) => b.trim().replace(/^•|-|\*|\d+\.\s*/, '').trim())
            .filter((b) => b.length > 0)
          
          expListBullets[0].bullets = parsed
          onUpdateResumeData({ ...resumeData, experience: expListBullets })
        }
        reply = `Added those achievements! Next, let's add your education. What degree did you earn and from what school?`
        setCurrentStep('education')
        break

      case 'education':
        const partsEdu = clean.split(/from/i)
        const degree = partsEdu[0]?.trim() || 'B.S. Computer Science'
        const school = partsEdu[1]?.trim() || 'University'
        onUpdateResumeData({
          ...resumeData,
          education: [
            {
              id: crypto.randomUUID(),
              degree,
              school,
              location: '',
              graduationDate: '05/2021',
            },
          ],
        })
        reply = `Perfect. I have also recommended relevant skills for you based on your target job title. Check out the "Skills" tab to review. We've built your resume's foundation! You can review and print it now, or ask me tips to fix your ATS score.`
        setCurrentStep('final')
        break

      case 'final':
        reply = await generateContent(`The user is asking: "${clean}". Answer encouragingly and professionally as their resume coach.`, apiKey, 'improve')
        break
    }

    onSendMessage('agent', reply)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4 select-text">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] rounded-xl p-3 text-xs leading-relaxed transition-all animate-fade-in ${
              msg.role === 'agent'
                ? 'bg-slate-700/50 text-slate-200 self-start border border-slate-700'
                : 'bg-indigo-600 text-white self-end ml-auto'
            }`}
          >
            <p className="whitespace-pre-line">{msg.content}</p>
            <span className="text-[9px] text-slate-400 mt-1 self-end">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="bg-slate-700/50 text-slate-200 border border-slate-700 rounded-xl p-3.5 self-start flex items-center gap-1 w-16">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input box form */}
      <form onSubmit={handleSend} className="border-t border-slate-700 pt-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isTyping ? 'Seve is thinking...' : 'Type a message...'}
          disabled={isTyping}
          className="flex-1 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isTyping || !inputValue.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg px-3 py-2 text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
        >
          Send
        </button>
      </form>
    </div>
  )
}
