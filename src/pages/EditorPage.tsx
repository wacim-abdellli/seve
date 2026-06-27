import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getActualSkillsCount } from '../utils/atsUtils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ArrowLeft, Type, ZoomOut, ZoomIn } from 'lucide-react'
import { useResume } from '../hooks/useResume'
import ResumePreview from '../components/ResumePreview'
import { templatesList } from '../components/resumePreviewConstants'
import DesignStylePanel from '../components/DesignStylePanel'
import { getSectionStatus } from '../utils/completionHelper'
import AtsChecker from '../components/AtsChecker'
import AiStatusBadge from '../components/ai/AiStatusBadge'
import AiResumeAdvisor from '../components/ai/AiResumeAdvisor'
import AiChatCopilot from '../components/ai/AiChatCopilot'
import type { EditorContextType } from '../layouts/EditorLayout'
import type { ResumeData } from '../types/resume'
import type { SectionType } from '../components/SectionSidebar'
import {
  User as UserIcon, FileText as FileTextIcon, Briefcase as BriefcaseIcon,
  GraduationCap as GraduationCapIcon, Code2, Globe, FolderOpen,
  Trophy, Award, Heart, BookOpen, Phone, HandHeart,
} from 'lucide-react'

const sectionGroups = [
  {
    label: 'ESSENTIALS',
    sections: [
      { id: 'contact' as const, title: 'Contact Info', icon: UserIcon },
      { id: 'summary' as const, title: 'Profile Summary', icon: FileTextIcon },
      { id: 'experience' as const, title: 'Work Experience', icon: BriefcaseIcon },
      { id: 'education' as const, title: 'Education', icon: GraduationCapIcon },
    ],
  },
  {
    label: 'SKILLS & MORE',
    sections: [
      { id: 'skills' as const, title: 'Skills & Stack', icon: Code2 },
      { id: 'languages' as const, title: 'Languages', icon: Globe },
      { id: 'projects' as const, title: 'Projects', icon: FolderOpen },
    ],
  },
  {
    label: 'OPTIONAL',
    sections: [
      { id: 'awards' as const, title: 'Awards & Honors', icon: Trophy },
      { id: 'certifications' as const, title: 'Certifications', icon: Award },
      { id: 'interests' as const, title: 'Interests', icon: Heart },
      { id: 'publications' as const, title: 'Publications', icon: BookOpen },
      { id: 'references' as const, title: 'References', icon: Phone },
      { id: 'volunteer' as const, title: 'Volunteer', icon: HandHeart },
    ],
  },
]

const TOTAL_SECTIONS = sectionGroups.reduce((acc, g) => acc + g.sections.length, 0)

interface SectionNavListProps {
  isMobile?: boolean
}

function SectionNavList({ isMobile = false }: SectionNavListProps) {
  const { resumeData } = useResume()
  const ctx = useOutletContext<EditorContextType>()
  const { activeStudioSection, openDrawer } = ctx
  const sectionStatus = useMemo(() => getSectionStatus(resumeData), [resumeData])

  return (
    <>
      {sectionGroups.map((group) => (
        <div key={group.label}>
          <div className="px-4 pt-4 pb-1 flex items-center gap-2.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#52525b' }}>
              {group.label}
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          {group.sections.map((section) => {
            const isComplete = sectionStatus[section.id]
            const previewText = getSectionPreview(section.id, resumeData)
            const Icon = section.icon
            const isActive = activeStudioSection === section.id
            const groupStyles = getGroupStyles(group.label, isActive)
            return (
              <button key={section.id} type="button" onClick={() => openDrawer(section.id)} className={`w-full text-left group flex items-center gap-3 px-4 py-[10px] transition-all duration-150 cursor-pointer border-l-2 border-b border-b-zinc-800/25 last:border-b-0 ${isActive ? 'border-l-[var(--accent)] bg-[var(--accent-soft)]' : 'border-l-transparent hover:bg-white/[0.03]'}${isMobile ? ' min-h-[52px] active:bg-white/[0.05]' : ''}`}>
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-150"
                  style={{ 
                    background: groupStyles.bg, 
                    border: groupStyles.border
                  }}>
                  <Icon className={`w-[15px] h-[15px] transition-colors ${groupStyles.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{section.title}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate leading-normal">{previewText}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isComplete ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.4)]" title="Complete" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full border border-zinc-600 bg-transparent shrink-0" title="Incomplete" />
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </>
  )
}

const truncateText = (str: string, max: number) => {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '...' : str
}

const getSectionPreview = (section: string, data?: ResumeData): string => {
  if (!data) return ''
  switch (section) {
    case 'contact': return data.contact?.email || 'Add your details'
    case 'summary': return truncateText(data.summary || '', 45) || 'Write a summary'
    case 'experience': {
      const exp = data.experience || []
      return exp.length === 0 ? 'No positions added yet'
        : `${exp[0]?.jobTitle || 'Untitled'} at ${exp[0]?.company || 'No Company'}` + (exp.length > 1 ? ` +${exp.length - 1} more` : '')
    }
    case 'education': {
      const edu = data.education || []
      return edu.length === 0 ? 'No institutions added yet' : `${edu.length} institution(s) added`
    }
    case 'skills': {
      const sk = data.skills || []
      return getActualSkillsCount(sk) === 0 ? 'No skills added yet' : sk.slice(0, 4).join(', ') + (sk.length > 4 ? '...' : '')
    }
    case 'languages': { const l = data.languages || []; return l.length === 0 ? 'No languages added' : l.map(x => x?.name).filter(Boolean).join(', ') + (l.length > 3 ? '...' : '') }
    case 'projects': { const l = data.projects || []; return l.length === 0 ? 'No projects added' : `${l.length} project(s)` }
    case 'awards': { const l = data.awards || []; return l.length === 0 ? 'No awards added' : l.map(x => x?.title).filter(Boolean).join(', ') }
    case 'certifications': { const l = data.certifications || []; return l.length === 0 ? 'No certifications added' : l.map(x => x?.title).filter(Boolean).join(', ') }
    case 'interests': { const l = data.interests || []; return l.length === 0 ? 'No interests added' : l.map(x => x?.name).filter(Boolean).join(', ') }
    case 'publications': { const l = data.publications || []; return l.length === 0 ? 'No publications added' : l.map(x => x?.title).filter(Boolean).join(', ') }
    case 'references': { const l = data.references || []; return l.length === 0 ? 'No references added' : l.map(x => x?.name).filter(Boolean).join(', ') }
    case 'volunteer': { const l = data.volunteer || []; return l.length === 0 ? 'No volunteer experience added' : l.map(x => x?.organization).filter(Boolean).join(', ') }
    default: return ''
  }
}

const getGroupStyles = (label: string, isActive: boolean) => {
  if (isActive) {
    return {
      bg: 'var(--accent-soft)',
      border: '1px solid var(--accent)',
      icon: 'text-[var(--accent)]',
    }
  }
  switch (label) {
    case 'ESSENTIALS':
      return {
        bg: 'rgba(56, 189, 248, 0.06)',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        icon: 'text-sky-400/90 group-hover:text-sky-300',
      }
    case 'SKILLS & MORE':
      return {
        bg: 'rgba(129, 140, 248, 0.06)',
        border: '1px solid rgba(129, 140, 248, 0.15)',
        icon: 'text-indigo-400/90 group-hover:text-indigo-300',
      }
    case 'OPTIONAL':
    default:
      return {
        bg: 'rgba(251, 1TOTAL_SECTIONS, TOTAL_SECTIONS3, 0.06)',
        border: '1px solid rgba(251, 1TOTAL_SECTIONS, TOTAL_SECTIONS3, 0.15)',
        icon: 'text-rose-400/90 group-hover:text-rose-300',
      }
  }
}

export default function EditorPage() {
  const { resumeData, selectedTemplate, jobDescription, updateActiveResume } = useResume()
  const ctx = useOutletContext<EditorContextType>()

  const { activeMode, setActiveMode, activeStudioSection, setActiveStudioSection, setPageCount, templateFontSize, onChangeFontSize, templateFontWeight, onChangeFontWeight, stylePrefs, updateStylePrefs, sectionOrder, onSectionOrderChange, mobileView, setMobileView, themeColor, setThemeColor, handlePrint, setShowAiGuide } = ctx

  const sectionStatus = useMemo(() => getSectionStatus(resumeData), [resumeData])
  const completedCount = Object.values(sectionStatus).filter(Boolean).length

  const [mobileZoom, setMobileZoom] = useState(85)
  const zoomStep = 10
  const zoomMin = 50
  const zoomMax = 150
  const canZoomOut = mobileZoom > zoomMin
  const canZoomIn = mobileZoom < zoomMax

  const renderDesignControls = () => {
    return (
      <div className="space-y-6">
        {/* Templates */}
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block select-none font-display">Layout Template</label>
          <div className="grid grid-cols-2 gap-2">
            {templatesList.map(t => {
              const isSelected = selectedTemplate === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateActiveResume(prev => ({ ...prev, selectedTemplate: t.id }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm' 
                      : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${t.colorDot} shrink-0`} />
                  <span className="truncate">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Size */}
        <div className="space-y-3 pt-4 border-t border-zinc-800/40">
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block select-none font-display">Base Font Size</label>
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 h-10 w-full justify-between">
            <button 
              onClick={() => onChangeFontSize(Math.max(6, Number((templateFontSize - 0.5).toFixed(1))))}
              className="px-3 text-zinc-400 hover:text-white hover:bg-zinc-900/65 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center font-bold text-xs"
              type="button"
              title="Decrease font size"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 px-2 text-zinc-300 font-mono select-none">
              <Type className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-black">{templateFontSize}pt</span>
            </div>
            <button 
              onClick={() => onChangeFontSize(Math.min(16, Number((templateFontSize + 0.5).toFixed(1))))}
              className="px-3 text-zinc-400 hover:text-white hover:bg-zinc-900/65 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center font-bold text-xs"
              type="button"
              title="Increase font size"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Weight */}
        <div className="space-y-3 pt-4 border-t border-zinc-800/40">
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block select-none font-display">Font Weight</label>
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 h-10 w-full justify-between mb-2.5">
            <button 
              onClick={() => onChangeFontWeight(Math.max(300, templateFontWeight - 100))}
              className="px-3 text-zinc-455 hover:text-white hover:bg-zinc-900/65 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center font-bold text-xs"
              type="button"
              title="Lighter font weight"
            >
              <span className="opacity-60 font-bold">B-</span>
            </button>
            <div className="flex items-center gap-1 px-2 text-[#b91c1c] font-mono select-none">
              <span className="text-xs font-black">{templateFontWeight}</span>
            </div>
            <button 
              onClick={() => onChangeFontWeight(Math.min(900, templateFontWeight + 100))}
              className="px-3 text-zinc-400 hover:text-white hover:bg-zinc-900/65 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center font-bold text-xs"
              type="button"
              title="Bolder font weight"
            >
              <span className="opacity-100 font-bold">B+</span>
            </button>
          </div>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Font weight presets">
            {[300, 400, 500, 600, 700].map((w) => (
              <button
                key={w}
                onClick={() => onChangeFontWeight(w)}
                className={`flex-1 h-7 text-[10px] font-black rounded-lg transition-colors cursor-pointer border ${
                  templateFontWeight === w
                    ? 'bg-[#b91c1c]/15 border-[#b91c1c]/30 text-[#b91c1c]'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                type="button"
                role="radio"
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Design Style Panel */}
        <DesignStylePanel stylePrefs={stylePrefs} updateStylePrefs={updateStylePrefs} themeColor={themeColor} setThemeColor={setThemeColor} />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeMode}
        initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
        className="flex-1 flex flex-row overflow-hidden relative bg-transparent"
      >
        {(activeMode === 'studio' || activeMode === 'design') && (
          <div className="flex h-full w-full overflow-hidden relative bg-transparent">
            {/* Left Sidebar (Desktop) */}
            <div className="hidden lg:flex border-r border-zinc-800/60 flex-col flex-shrink-0 h-full overflow-hidden no-print w-[340px]" style={{ background: 'linear-gradient(180deg, #0f0f12 0%, #0b0b0e 100%)' }}>
              {activeMode === 'studio' ? (
                <>
                  <div className="px-5 pt-5 pb-4 border-b border-zinc-800/40 flex-shrink-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-white">Resume Builder</h2>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {completedCount === TOTAL_SECTIONS ? 'All sections complete ✓' : `${TOTAL_SECTIONS - completedCount} section${TOTAL_SECTIONS - completedCount !== 1 ? 's' : ''} remaining`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <AiStatusBadge />
                        <span className="text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                          {completedCount}/{TOTAL_SECTIONS}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(completedCount / TOTAL_SECTIONS) * 100}%`, backgroundColor: 'var(--accent)' }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto form-panel">
                    <AiChatCopilot />
                    <SectionNavList />
                    <AiResumeAdvisor />
                  </div>
                </>
              ) : (
                <>
                  <div className="px-5 pt-5 pb-3 border-b border-zinc-800/40 flex-shrink-0 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Design & Style</h2>
                      <p className="text-sm text-zinc-500 mt-0.5">Customize layout, accent colors and fonts</p>
                    </div>
                    <button onClick={() => setActiveMode('studio')} className="text-xs font-bold text-[#b91c1c] hover:text-[#c62828] transition-colors cursor-pointer">Done</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 form-panel">
                    {renderDesignControls()}
                  </div>
                </>
              )}
            </div>

            {/* Left Sidebar (Mobile) */}
            <div className={`w-full flex flex-col h-full overflow-hidden no-print lg:hidden ${mobileView === 'preview' ? 'hidden' : 'flex'}`} style={{ background: 'linear-gradient(180deg, #0f0f12 0%, #0b0b0e 100%)' }}>
              {activeMode === 'studio' ? (
                <>
                  <div className="px-5 pt-5 pb-4 border-b border-zinc-800/40 flex-shrink-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-white">Resume Builder</h2>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {completedCount === TOTAL_SECTIONS ? 'All sections complete ✓' : `${TOTAL_SECTIONS - completedCount} section${TOTAL_SECTIONS - completedCount !== 1 ? 's' : ''} remaining`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-500 font-mono">{completedCount}/{TOTAL_SECTIONS}</span>
                        <button onClick={() => setMobileView('preview')} className="font-bold text-xs h-9 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-colors cursor-pointer active:scale-95">Preview</button>
                      </div>
                    </div>
                    <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(completedCount / TOTAL_SECTIONS) * 100}%`, backgroundColor: 'var(--accent)' }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto form-panel pb-16 lg:pb-0">
                    <AiChatCopilot />
                    <SectionNavList isMobile />
                    <AiResumeAdvisor />
                  </div>
                </>
              ) : (
                <>
                  <div className="px-5 pt-5 pb-3 border-b border-zinc-800/40 flex-shrink-0 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Design & Style</h2>
                      <p className="text-sm text-zinc-500 mt-0.5">Customize layout, accent colors and fonts</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setMobileView('preview')} className="font-bold text-xs h-10 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-colors cursor-pointer active:scale-95">View Resume</button>
                      <button onClick={() => setActiveMode('studio')} className="font-bold text-xs h-10 px-4 rounded-xl bg-[#b91c1c]/15 border border-[#b91c1c]/35 hover:bg-[#b91c1c]/25 text-[#b91c1c] transition-all cursor-pointer active:scale-95">Done</button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 form-panel pb-16 lg:pb-0">
                    {renderDesignControls()}
                  </div>
                </>
              )}
            </div>

            {/* A4 Preview Container */}
            <div className={`flex-1 h-full preview-dot-bg overflow-auto p-3 sm:p-6 flex items-start justify-center print-block min-w-0 relative scroll-smooth ${mobileView === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
              <div
                className="w-full max-w-[858px] pb-16 origin-top transition-transform duration-200"
                style={{ transform: `scale(${mobileZoom / 100})`, transformOrigin: 'top center' }}
              >
                {mobileView === 'preview' && (
                  <div className="lg:hidden mb-3 no-print">
                    <button 
                      onClick={() => setMobileView('edit')}
                      className="inline-flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900/80 border border-zinc-700 hover:bg-zinc-800 px-4 h-10 rounded-xl cursor-pointer transition-all active:scale-95"
                    >
                      <ArrowLeft size={15} />
                      <span>{activeMode === 'design' ? 'Back to Design' : 'Back to Sections'}</span>
                    </button>
                  </div>
                )}

                <ResumePreview
                  resumeData={resumeData} selectedTemplate={selectedTemplate}
                  onChangeTemplate={(t) => updateActiveResume(prev => ({ ...prev, selectedTemplate: t }))}
                  activeSection={activeStudioSection}
                  onEditSection={(section) => { setActiveStudioSection(section as SectionType); setMobileView('edit') }}
                  onExportPdf={handlePrint} onPageCountChange={setPageCount}
                  sectionOrder={sectionOrder} onSectionOrderChange={onSectionOrderChange}
                  templateFontSize={templateFontSize} onChangeFontSize={onChangeFontSize}
                  templateFontWeight={templateFontWeight} onChangeFontWeight={onChangeFontWeight}
                  themeColor={themeColor} onChangeColor={setThemeColor}
                  stylePrefs={stylePrefs}
                  onTriggerImport={() => setShowAiGuide(true)}
                />
              </div>

              {/* Mobile Zoom Control — only shown in mobile preview */}
              {mobileView === 'preview' && (
                <div className="lg:hidden fixed bottom-[80px] left-1/2 -translate-x-1/2 z-[70] no-print">
                  <div
                    className="flex items-center gap-0 rounded-2xl border border-white/10 shadow-xl shadow-black/40 overflow-hidden"
                    style={{ background: 'rgba(12,12,16,0.92)', backdropFilter: 'blur(16px)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setMobileZoom(z => Math.max(zoomMin, z - zoomStep))}
                      disabled={!canZoomOut}
                      className="w-11 h-10 flex items-center justify-center text-zinc-400 hover:text-white disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors active:bg-white/5"
                      aria-label="Zoom out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileZoom(85)}
                      className="h-10 px-3 text-xs font-black font-mono tabular-nums border-x border-white/8 transition-colors"
                      style={{ color: 'var(--accent)' }}
                      aria-label="Reset zoom"
                      title="Tap to reset"
                    >
                      {mobileZoom}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileZoom(z => Math.min(zoomMax, z + zoomStep))}
                      disabled={!canZoomIn}
                      className="w-11 h-10 flex items-center justify-center text-zinc-400 hover:text-white disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors active:bg-white/5"
                      aria-label="Zoom in"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMode === 'preview' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
            <div className="flex-1 preview-dot-bg overflow-auto p-3 sm:p-6 flex items-start justify-center print-block min-w-0 relative scroll-smooth">
              <div className="w-full max-w-[858px] pb-16">
                <ResumePreview
                  resumeData={resumeData} selectedTemplate={selectedTemplate}
                  onChangeTemplate={(t) => updateActiveResume(prev => ({ ...prev, selectedTemplate: t }))}
                  activeSection={activeStudioSection}
                  onEditSection={(section) => { setActiveStudioSection(section as SectionType); setActiveMode('studio') }}
                  onExportPdf={handlePrint} onPageCountChange={setPageCount}
                  sectionOrder={sectionOrder} onSectionOrderChange={onSectionOrderChange}
                  templateFontSize={templateFontSize} onChangeFontSize={onChangeFontSize}
                  templateFontWeight={templateFontWeight} onChangeFontWeight={onChangeFontWeight}
                  themeColor={themeColor} onChangeColor={setThemeColor}
                  stylePrefs={stylePrefs}
                  onTriggerImport={() => setShowAiGuide(true)}
                />
              </div>
            </div>
          </div>
        )}

        {activeMode === 'analyze' && (
          <AtsChecker
            resumeData={resumeData}
            jobDescription={jobDescription}
            templateFontSize={templateFontSize}
            onUpdateJobDescription={(jd) => updateActiveResume((prev) => ({ ...prev, jobDescription: jd }))}
            onNavigateToSection={(section) => { setActiveMode('studio'); setActiveStudioSection(section as SectionType) }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
