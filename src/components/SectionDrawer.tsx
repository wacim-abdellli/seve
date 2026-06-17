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

const sectionMeta = {
  contact: { 
    title: 'Contact Info',
    icon: User,
    guide: 'Provide accurate and professional contact details. Use a modern, tech-focused email (e.g. name@gmail.com or name.dev) and links to your personal portfolio/website and LinkedIn profile.',
    example: 'Jane Doe · New York, NY · jane.doe@email.com · +1 (555) 019-2834 · linkedin.com/in/janedoe · janedoe.dev'
  },
  summary: { 
    title: 'Profile Summary',
    icon: FileText,
    guide: 'Write a 3-4 sentence professional summary highlighting your top achievements, core skills, and career objective. Avoid personal pronouns (e.g. "I", "my") and focus on action verbs.',
    example: 'Senior Software Engineer with 8+ years of experience leading cross-functional teams and building high-scale distributed systems. Expert in React, Node.js, and cloud architecture (AWS). Boosted platform performance by 40% and reduced server costs by 15% at previous roles.'
  },
  experience: { 
    title: 'Work Experience',
    icon: Briefcase,
    guide: 'Detail your work history in reverse chronological order. Start bullet points with strong action verbs (e.g., "Engineered", "Optimized", "Led") and quantify your accomplishments with metrics (e.g., "reduced latency by 30%").',
    example: 'Led a team of 4 engineers to design and deploy a real-time messaging pipeline, increasing performance by 25% and handling 10M+ daily active requests. Implemented automated CI/CD workflows reducing deploy times by 40%.'
  },
  education: { 
    title: 'Education History',
    icon: GraduationCap,
    guide: 'Add degrees and academic programs. Include your graduation date and GPA if it is 3.5 or above. You can also mention academic honors, scholarships, or relevant coursework.',
    example: 'M.S. in Computer Science · Stanford University · GPA: 3.8 / 4.0 · Specialized in Distributed Systems and Artificial Intelligence. Recipient of the Merit Graduate Scholarship.'
  },
  skills: { 
    title: 'Skills & Stack',
    icon: Code2,
    guide: 'Group your skills by category (e.g., "Languages", "Frameworks", "Tools") to make it readable. List 6-8 core technical skill terms that match your target job description to pass ATS filters.',
    example: 'Languages: JavaScript, TypeScript, Python, Go · Frameworks: React, Next.js, Node.js, Express, Django · Databases: PostgreSQL, MongoDB, Redis · Cloud: AWS (EC2, S3, Lambda), Docker, Kubernetes'
  },
  languages: { 
    title: 'Languages',
    icon: Globe,
    guide: 'List the languages you speak and your proficiency level (e.g., "Native", "Fluent", "Professional", "Conversational"). This demonstrates global readiness and versatility.',
    example: 'English (Native) · Spanish (Fluent) · French (Conversational)'
  },
  projects: { 
    title: 'Projects',
    icon: FolderOpen,
    guide: 'Highlight 1-2 major side projects or open-source contributions. Mention the specific tech stack used and describe the problem you solved, focusing on metrics, performance, and scalability.',
    example: 'Seve (Resume Builder): Open-source client-side React app with local ATS compatibility parsing, gaining 1.2k+ GitHub stars.'
  },
  awards: { 
    title: 'Awards & Honors',
    icon: Trophy,
    guide: 'List prestigious recognitions, promotions, or competition wins. For impact, mention the selectivity or criteria (e.g., "Awarded to top 1% of performers out of 500 applicants").',
    example: 'Outstanding Engineer of the Year (2024) · Awarded by Google Tech Committee for resolving critical high-severity production incidents, saving $120k+ in potential SLA breach penalties.'
  },
  certifications: { 
    title: 'Certifications',
    icon: Award,
    guide: 'List relevant professional credentials, licenses, or course certificates (e.g., AWS Solutions Architect, Certified Scrum Master) to validate your technical expertise.',
    example: 'AWS Certified Solutions Architect – Professional (ID: AWS-10293, Issued: 2024) · Certified Kubernetes Administrator (CKA)'
  },
  interests: { 
    title: 'Interests',
    icon: Heart,
    guide: 'Optionally list 2-3 genuine personal interests or hobbies. Choose interests that demonstrate teamwork, leadership, continuous learning, or problem-solving (e.g. running marathons, chess).',
    example: 'Long-Distance Running (completed 2 marathons) · Competitive Chess (FIDE rated) · Open Source Contributor'
  },
  publications: { 
    title: 'Publications',
    icon: BookOpen,
    guide: 'List published research papers, journal articles, books, patents, or industry white papers you have authored or co-authored, including citation links and dates.',
    example: 'Optimizing Large Scale Distributed Databases · Published in IEEE Transactions on Cloud Computing (2023) · Authored research on optimizing database queries, reducing average latency by 18%.'
  },
  references: { 
    title: 'References',
    icon: PhoneCall,
    guide: 'Add professional references (managers, colleagues, clients) who can vouch for your work ethic, technical skills, and achievements.',
    example: 'Sarah Jenkins (Director of Engineering at Google) · Email: sjenkins@google.com · Relationship: Direct Manager for 3 years.'
  },
  volunteer: { 
    title: 'Volunteer',
    icon: HeartHandshake,
    guide: 'Highlight volunteer work or non-profit engagement. Volunteer experience shows leadership, community care, and is highly valued by modern employers.',
    example: 'Volunteer Instructor at Girls Who Code (2022–2024) · Taught introductory web development (HTML/CSS/JS) to 40+ high school students, facilitating projects and career mentorship.'
  },
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
    guide: '', 
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
        
        {/* Real Guide Card */}
        {meta.guide && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 no-print select-none">
            <div className="flex items-center gap-2 text-rose-450 font-bold text-[11px] uppercase tracking-wider">
              {meta.icon ? <meta.icon className="w-3.5 h-3.5 text-rose-400" /> : <Lightbulb className="w-3.5 h-3.5 text-rose-400" />}
              <span className="text-zinc-200">{meta.title} Guide</span>
            </div>
            <p className="text-[12px] text-zinc-400 leading-relaxed font-light font-sans">
              {meta.guide}
            </p>
            {meta.example && (
              <div className="pt-2 border-t border-zinc-800/60 mt-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Realistic Example:</span>
                <p className="text-[11px] text-zinc-350 font-mono bg-zinc-950/40 p-2 rounded-lg leading-relaxed select-text border border-zinc-900/50">
                  {meta.example}
                </p>
              </div>
            )}
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
