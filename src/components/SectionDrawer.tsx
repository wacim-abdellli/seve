import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ResumeData } from '../types/resume'
import type { SectionType } from './SectionSidebar'
import ContactForm from './form/ContactForm'
import SummaryForm from './form/SummaryForm'
import ExperienceForm from './form/ExperienceForm'
import EducationForm from './form/EducationForm'
import SkillsForm from './form/SkillsForm'
import ProjectsForm from './form/ProjectsForm'

interface SectionDrawerProps {
  section: SectionType
  resumeData: ResumeData
  apiKey: string
  onChange: (updated: ResumeData) => void
  onClose: () => void
}

const sectionMeta = {
  contact: { title: 'Contact Info' },
  summary: { title: 'Profile Summary' },
  experience: { title: 'Work Experience' },
  education: { title: 'Education History' },
  skills: { title: 'Skills & Stack' },
  projects: { title: 'Projects' },
}

export default function SectionDrawer({
  section,
  resumeData,
  apiKey,
  onChange,
  onClose,
}: SectionDrawerProps) {
  // Escape key support (non-negotiable UX)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const meta = sectionMeta[section] || { title: 'Section Editor' }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed right-0 top-0 h-screen w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] z-40 flex flex-col no-print select-text"
    >
      {/* Drawer Header — Title + X only (Fix 1) */}
      <div className="flex items-center justify-between px-5 h-12 border-b border-zinc-800/60 flex-shrink-0">
        <span className="text-[15px] font-semibold text-white">
          {meta.title}
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          type="button"
          title="Close Editor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-none">
        {section === 'contact' && (
          <ContactForm
            contact={resumeData.contact}
            onChange={(updated) => onChange({ ...resumeData, contact: updated })}
          />
        )}
        {section === 'summary' && (
          <SummaryForm
            summary={resumeData.summary}
            apiKey={apiKey}
            onChange={(updated) => onChange({ ...resumeData, summary: updated })}
          />
        )}
        {section === 'experience' && (
          <ExperienceForm
            experience={resumeData.experience}
            apiKey={apiKey}
            onChange={(updated) => onChange({ ...resumeData, experience: updated })}
          />
        )}
        {section === 'education' && (
          <EducationForm
            education={resumeData.education}
            onChange={(updated) => onChange({ ...resumeData, education: updated })}
          />
        )}
        {section === 'skills' && (
          <SkillsForm
            skills={resumeData.skills}
            jobTitle={resumeData.experience[0]?.jobTitle || ''}
            onChange={(updated) => onChange({ ...resumeData, skills: updated })}
          />
        )}
        {section === 'projects' && (
          <ProjectsForm
            projects={resumeData.projects || []}
            onChange={(updated) => onChange({ ...resumeData, projects: updated })}
          />
        )}
      </div>
    </motion.div>
  )
}
