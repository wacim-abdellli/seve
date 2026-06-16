import { useState } from 'react'
import type { ResumeData } from '../types/resume'
import ContactForm from './form/ContactForm'
import SummaryForm from './form/SummaryForm'
import ExperienceForm from './form/ExperienceForm'
import EducationForm from './form/EducationForm'
import SkillsForm from './form/SkillsForm'
import LanguagesForm from './form/LanguagesForm'
import ProjectsForm from './form/ProjectsForm'
import AwardsForm from './form/AwardsForm'
import CertificationsForm from './form/CertificationsForm'
import InterestsForm from './form/InterestsForm'
import PublicationsForm from './form/PublicationsForm'
import ReferencesForm from './form/ReferencesForm'
import VolunteerForm from './form/VolunteerForm'
import { User, FileText, Briefcase, GraduationCap, Wrench, Globe, FolderGit, Trophy, Award, Heart, BookOpen, Phone, HandHeart } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface ResumeFormProps {
  resumeData: ResumeData
  apiKey: string
  onChange: (updated: ResumeData) => void
  activeSection?: Tab
}

type Tab = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'awards' | 'certifications' | 'interests' | 'publications' | 'references' | 'volunteer'

export default function ResumeForm({ resumeData, apiKey, onChange, activeSection }: ResumeFormProps) {
  const [localActiveSubTab, setLocalActiveSubTab] = useState<Tab>('contact')
  const activeSubTab = activeSection || localActiveSubTab
  const isControlled = activeSection !== undefined

  const updateSection = <K extends keyof ResumeData>(section: K, value: ResumeData[K]) => {
    onChange({
      ...resumeData,
      [section]: value,
    })
  }

  const isSectionComplete = (tabId: Tab): boolean => {
    switch (tabId) {
      case 'contact':
        return !!(
          resumeData.contact.fullName?.trim() && 
          resumeData.contact.email?.trim() && 
          resumeData.contact.phone?.trim() &&
          resumeData.contact.linkedin?.trim() &&
          resumeData.contact.location?.trim()
        )
      case 'summary':
        return !!resumeData.summary.trim()
      case 'experience':
        return resumeData.experience.length > 0 && !!resumeData.experience[0].jobTitle.trim()
      case 'education':
        return resumeData.education.length > 0 && !!resumeData.education[0].school.trim()
      case 'skills':
        return resumeData.skills.length >= 3
      case 'languages':
        return !!(resumeData.languages && resumeData.languages.length > 0 && resumeData.languages[0].name.trim())
      case 'projects':
        return !!(resumeData.projects && resumeData.projects.length > 0 && resumeData.projects[0].name.trim())
      case 'awards':
        return !!(resumeData.awards && resumeData.awards.length > 0 && resumeData.awards[0].title.trim())
      case 'certifications':
        return !!(resumeData.certifications && resumeData.certifications.length > 0 && resumeData.certifications[0].title.trim())
      case 'interests':
        return !!(resumeData.interests && resumeData.interests.length > 0 && resumeData.interests[0].name.trim())
      case 'publications':
        return !!(resumeData.publications && resumeData.publications.length > 0 && resumeData.publications[0].title.trim())
      case 'references':
        return !!(resumeData.references && resumeData.references.length > 0 && resumeData.references[0].name.trim())
      case 'volunteer':
        return !!(resumeData.volunteer && resumeData.volunteer.length > 0 && resumeData.volunteer[0].organization.trim())
      default:
        return false
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Wrench },
    { id: 'languages', label: 'Languages', icon: Globe },
    { id: 'projects', label: 'Projects', icon: FolderGit },
    { id: 'awards', label: 'Awards', icon: Trophy },
    { id: 'certifications', label: 'Certs', icon: Award },
    { id: 'interests', label: 'Interests', icon: Heart },
    { id: 'publications', label: 'Publications', icon: BookOpen },
    { id: 'references', label: 'References', icon: Phone },
    { id: 'volunteer', label: 'Volunteer', icon: HandHeart },
  ]

  const sectionMeta = {
    contact: { title: 'Contact Info', subtitle: 'Provide your professional contact details', icon: User },
    summary: { title: 'Profile Summary', subtitle: 'Describe your career background and skills', icon: FileText },
    experience: { title: 'Work Experience', subtitle: 'Detail your professional employment history', icon: Briefcase },
    education: { title: 'Education History', subtitle: 'List your academic credentials and details', icon: GraduationCap },
    skills: { title: 'Skills & Tech Stack', subtitle: 'Catalog your core and technical skills', icon: Wrench },
    languages: { title: 'Languages', subtitle: 'List the languages you speak and your proficiency', icon: Globe },
    projects: { title: 'Key Projects', subtitle: 'Showcase your independent or team projects', icon: FolderGit },
    awards: { title: 'Awards & Honors', subtitle: 'List awards and honors you have received', icon: Trophy },
    certifications: { title: 'Certifications', subtitle: 'Professional certifications and licenses', icon: Award },
    interests: { title: 'Interests', subtitle: 'Personal interests and hobbies', icon: Heart },
    publications: { title: 'Publications', subtitle: 'Articles, papers, or books you have published', icon: BookOpen },
    references: { title: 'References', subtitle: 'Professional references or available upon request', icon: Phone },
    volunteer: { title: 'Volunteer', subtitle: 'Volunteer work and community involvement', icon: HandHeart },
  }[activeSubTab]

  const completed = isSectionComplete(activeSubTab)

  const formContent = (
    <Card className="border-zinc-800 bg-card/50 shadow-md overflow-hidden flex flex-col">
      {/* Redesigned Section Header (Rule 1) */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/40 bg-zinc-950/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="text-[13px] font-semibold text-white">{sectionMeta.title}</span>
        </div>
        <span className={`text-[11px] font-medium transition-colors ${completed ? 'text-emerald-400' : 'text-zinc-500'}`}>
          ● {completed ? 'Done' : 'Edit'}
        </span>
      </div>

      {/* Form Content body (Rule 9) */}
      <div className="p-5 overflow-y-auto flex-1 max-h-[calc(100vh-210px)] form-panel">
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

        {activeSubTab === 'languages' && (
          <LanguagesForm
            languages={resumeData.languages || []}
            onChange={(updated) => updateSection('languages', updated)}
          />
        )}
        {activeSubTab === 'projects' && (
          <ProjectsForm
            projects={resumeData.projects || []}
            onChange={(updated) => updateSection('projects', updated)}
          />
        )}
        {activeSubTab === 'awards' && (
          <AwardsForm
            awards={resumeData.awards || []}
            onChange={(updated) => updateSection('awards', updated)}
          />
        )}
        {activeSubTab === 'certifications' && (
          <CertificationsForm
            certifications={resumeData.certifications || []}
            onChange={(updated) => updateSection('certifications', updated)}
          />
        )}
        {activeSubTab === 'interests' && (
          <InterestsForm
            interests={resumeData.interests || []}
            onChange={(updated) => updateSection('interests', updated)}
          />
        )}
        {activeSubTab === 'publications' && (
          <PublicationsForm
            publications={resumeData.publications || []}
            onChange={(updated) => updateSection('publications', updated)}
          />
        )}
        {activeSubTab === 'references' && (
          <ReferencesForm
            references={resumeData.references || []}
            onChange={(updated) => updateSection('references', updated)}
          />
        )}
        {activeSubTab === 'volunteer' && (
          <VolunteerForm
            volunteer={resumeData.volunteer || []}
            onChange={(updated) => updateSection('volunteer', updated)}
          />
        )}
      </div>
    </Card>
  )

  if (isControlled) {
    return (
      <div className="w-full h-full overflow-y-auto pr-1">
        {formContent}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full m-0">
      {/* Visual Navigation Sub-tabs */}
      <div className="md:col-span-3 flex flex-col gap-1 border-r border-border pr-4 select-none no-print">
        <div className="flex md:flex-col overflow-x-auto w-full gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isTabComplete = isSectionComplete(tab.id)
            const isActive = activeSubTab === tab.id
            
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLocalActiveSubTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-colors text-xs font-bold ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:bg-zinc-900 hover:text-white'
                }`}
                style={{ minWidth: '120px' }}
              >
                <div className="relative flex items-center">
                  <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-500'} />
                  {isTabComplete && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-zinc-950 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
                  )}
                </div>
                <span className="hidden md:inline truncate">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Render active subform panel */}
      <div className="md:col-span-9 flex-1 pl-5">
        {formContent}
      </div>
    </div>
  )
}
