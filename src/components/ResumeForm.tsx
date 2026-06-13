import { useState } from 'react'
import type { ResumeData } from '../types/resume'
import ContactForm from './form/ContactForm'
import SummaryForm from './form/SummaryForm'
import ExperienceForm from './form/ExperienceForm'
import EducationForm from './form/EducationForm'
import SkillsForm from './form/SkillsForm'
import ProjectsForm from './form/ProjectsForm'

interface ResumeFormProps {
  resumeData: ResumeData
  apiKey: string
  onChange: (updated: ResumeData) => void
}

type Tab = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects'

export default function ResumeForm({ resumeData, apiKey, onChange }: ResumeFormProps) {
  const [activeSubTab, setActiveSubTab] = useState<Tab>('contact')

  const updateSection = <K extends keyof ResumeData>(section: K, value: ResumeData[K]) => {
    onChange({
      ...resumeData,
      [section]: value,
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'contact', label: 'Contact' },
    { id: 'summary', label: 'Summary' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
  ]

  return (
    <div className="space-y-6">
      {/* Sub tabs nav bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-700 pb-1.5 no-print">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === tab.id
                ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render active subtab */}
      <div className="bg-slate-800/20 rounded-xl p-2">
        {activeSubTab === 'contact' && (
          <ContactForm
            contact={resumeData.contact}
            onChange={(updated) => updateSection('contact', updated)}
          />
        )}
        
        {activeSubTab === 'summary' && (
          <SummaryForm
            summary={resumeData.summary}
            apiKey={apiKey}
            onChange={(updated) => updateSection('summary', updated)}
          />
        )}

        {activeSubTab === 'experience' && (
          <ExperienceForm
            experience={resumeData.experience}
            apiKey={apiKey}
            onChange={(updated) => updateSection('experience', updated)}
          />
        )}

        {activeSubTab === 'education' && (
          <EducationForm
            education={resumeData.education}
            onChange={(updated) => updateSection('education', updated)}
          />
        )}

        {activeSubTab === 'skills' && (
          <SkillsForm
            skills={resumeData.skills}
            jobTitle={resumeData.experience[0]?.jobTitle || ''}
            onChange={(updated) => updateSection('skills', updated)}
          />
        )}

        {activeSubTab === 'projects' && (
          <ProjectsForm
            projects={resumeData.projects || []}
            onChange={(updated) => updateSection('projects', updated)}
          />
        )}
      </div>
    </div>
  )
}
