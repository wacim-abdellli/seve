import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Code2, 
  Globe, 
  FolderOpen, 
  Trophy, 
  Award, 
  Heart, 
  BookOpen, 
  PhoneCall, 
  HeartHandshake,
  Lightbulb
} from 'lucide-react'
import { useResume } from '../hooks/useResume'
import type { SectionType } from './SectionSidebar'
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

interface SectionDrawerProps {
  section: SectionType
  onClose: () => void
}

const sectionTips: Record<string, string[]> = {
  contact: ['Use a professional email (name@gmail.com or name@domain)', 'Include LinkedIn + portfolio/website links', 'Keep location to city, state'],
  summary: ['3-4 sentences max — current role + top achievements + goal', 'No "I", "my", or personal pronouns', 'Lead with your strongest metric'],
  experience: ['Reverse chronological order — most recent first', 'Start every bullet with a strong action verb', 'Add numbers: %, $, time saved, scale handled'],
  education: ['Add GPA only if 3.5+', 'Include relevant coursework if entry-level', 'Mention honors, scholarships, or dean\'s list'],
  skills: ['Group by category (Languages / Frameworks / Tools)', '6-8 core terms that match your target JD', 'Spell exactly as the job description does for ATS'],
  languages: ['Proficiency: Native / Fluent / Professional / Conversational', 'Include if relevant to the role or company'],
  projects: ['1-2 major projects with your specific tech stack', 'Focus on what problem you solved + measurable outcome'],
  awards: ['Mention selectivity (e.g. "top 1% of 500")', 'Include who awarded it + why'],
  certifications: ['Include cert ID and issuance date', 'Prioritize active/current certifications'],
  interests: ['2-3 genuine hobbies — optional but humanizing', 'Choose ones that show discipline or teamwork'],
  publications: ['Include publication venue + date + link', 'Co-authors optional if space is tight'],
  references: ['Name, title, company, email, and your relationship', 'Ask permission before listing someone'],
  volunteer: ['Organization + role + time period', 'Highlight measurable impact if possible'],
}

const sectionMeta: Record<string, { title: string; icon: any; example: string }> = {
  contact: { title: 'Contact Info', icon: User, example: 'Jane Doe · New York, NY · jane.doe@email.com · linkedin.com/in/janedoe' },
  summary: { title: 'Profile Summary', icon: FileText, example: 'Senior Engineer with 8+ years leading cross-functional teams. Expert in React, Node.js, AWS. Boosted platform performance by 40%, reduced costs by 15%.' },
  experience: { title: 'Work Experience', icon: Briefcase, example: 'Led 4 engineers building a real-time messaging pipeline handling 10M+ daily requests. Reduced deploy times by 40% with automated CI/CD.' },
  education: { title: 'Education History', icon: GraduationCap, example: 'M.S. Computer Science · Stanford · GPA 3.8 · Distributed Systems & AI focus' },
  skills: { title: 'Skills & Stack', icon: Code2, example: 'Languages: JS, TS, Python · Frameworks: React, Next.js, Node.js · Tools: Docker, AWS, PostgreSQL' },
  languages: { title: 'Languages', icon: Globe, example: 'English (Native) · Spanish (Fluent) · French (Conversational)' },
  projects: { title: 'Projects', icon: FolderOpen, example: 'Seve · Open-source React resume builder with ATS parsing · 1.2k+ GitHub stars' },
  awards: { title: 'Awards & Honors', icon: Trophy, example: 'Outstanding Engineer of the Year (2024) — saved $120k+ in SLA penalties' },
  certifications: { title: 'Certifications', icon: Award, example: 'AWS Solutions Architect — Professional · CKA certified' },
  interests: { title: 'Interests', icon: Heart, example: 'Long-Distance Running (2 marathons) · Chess (FIDE rated)' },
  publications: { title: 'Publications', icon: BookOpen, example: 'Optimizing Distributed Databases · IEEE Cloud Computing (2023)' },
  references: { title: 'References', icon: PhoneCall, example: 'Sarah Jenkins · Engineering Director @ Google · sjenkins@google.com · Direct Manager 3 yrs' },
  volunteer: { title: 'Volunteer', icon: HeartHandshake, example: 'Instructor @ Girls Who Code (2022-2024) · Taught web dev to 40+ students' },
}

export default function SectionDrawer({
  section,
  onClose,
}: SectionDrawerProps) {
  const { resumeData, updateResumeData: onChange } = useResume()
  // Escape key support (non-negotiable UX)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const meta = sectionMeta[section] || { 
    title: 'Section Editor', 
    icon: Lightbulb, 
    example: '' 
  }

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
        
        {/* Compact tips card */}
        {sectionTips[section] && (
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-3.5 py-3 no-print select-none">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <Lightbulb className="w-3 h-3" />
              Tips
            </div>
            <ul className="space-y-1">
              {sectionTips[section].map((tip, i) => (
                <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-2">
                  <span className="text-rose-400/60 mt-0.5 shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
            <div className="mt-2.5 pt-2 border-t border-zinc-800/30">
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Example</span>
              <p className="text-[10px] text-zinc-500 font-mono leading-relaxed select-text">
                {meta.example}
              </p>
            </div>
          </div>
        )}
        {section === 'contact' && (
          <ContactForm
            contact={resumeData.contact}
            onChange={(updated) => onChange({ ...resumeData, contact: updated })}
          />
        )}
        {section === 'summary' && (
          <SummaryForm
            summary={resumeData.summary}
            onChange={(updated) => onChange({ ...resumeData, summary: updated })}
          />
        )}
        {section === 'experience' && (
          <ExperienceForm
            experience={resumeData.experience}
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
        {section === 'languages' && (
          <LanguagesForm
            languages={resumeData.languages || []}
            onChange={(updated) => onChange({ ...resumeData, languages: updated })}
          />
        )}
        {section === 'projects' && (
          <ProjectsForm
            projects={resumeData.projects || []}
            onChange={(updated) => onChange({ ...resumeData, projects: updated })}
          />
        )}
        {section === 'awards' && (
          <AwardsForm
            awards={resumeData.awards || []}
            onChange={(updated) => onChange({ ...resumeData, awards: updated })}
          />
        )}
        {section === 'certifications' && (
          <CertificationsForm
            certifications={resumeData.certifications || []}
            onChange={(updated) => onChange({ ...resumeData, certifications: updated })}
          />
        )}
        {section === 'interests' && (
          <InterestsForm
            interests={resumeData.interests || []}
            onChange={(updated) => onChange({ ...resumeData, interests: updated })}
          />
        )}
        {section === 'publications' && (
          <PublicationsForm
            publications={resumeData.publications || []}
            onChange={(updated) => onChange({ ...resumeData, publications: updated })}
          />
        )}
        {section === 'references' && (
          <ReferencesForm
            references={resumeData.references || []}
            onChange={(updated) => onChange({ ...resumeData, references: updated })}
          />
        )}
        {section === 'volunteer' && (
          <VolunteerForm
            volunteer={resumeData.volunteer || []}
            onChange={(updated) => onChange({ ...resumeData, volunteer: updated })}
          />
        )}
      </div>
    </motion.div>
  )
}
