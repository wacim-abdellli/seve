import { lazy, Suspense } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, ChevronRight, ArrowLeft, Type } from 'lucide-react'
import { useResume } from '../hooks/useResume'
import ResumePreview, { templatesList } from '../components/ResumePreview'
import DesignStylePanel from '../components/DesignStylePanel'
import { getSectionStatus } from '../utils/completionHelper'
const AtsChecker = lazy(() => import('../components/AtsChecker'))
import type { EditorContextType } from '../layouts/EditorLayout'
import type { ResumeData, Template } from '../types/resume'
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
      { id: 'contact' as const, title: 'Contact Info', icon: UserIcon, colorClass: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/15 group-hover:text-blue-300' },
      { id: 'summary' as const, title: 'Profile Summary', icon: FileTextIcon, colorClass: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/15 group-hover:text-purple-300' },
      { id: 'experience' as const, title: 'Work Experience', icon: BriefcaseIcon, colorClass: 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/15 group-hover:text-rose-300' },
      { id: 'education' as const, title: 'Education', icon: GraduationCapIcon, colorClass: 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/15 group-hover:text-amber-300' },
    ],
  },
  {
    label: 'SKILLS & MORE',
    sections: [
      { id: 'skills' as const, title: 'Skills & Stack', icon: Code2, colorClass: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15 group-hover:text-emerald-300' },
      { id: 'languages' as const, title: 'Languages', icon: Globe, colorClass: 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/15 group-hover:text-indigo-300' },
      { id: 'projects' as const, title: 'Projects', icon: FolderOpen, colorClass: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/15 group-hover:text-cyan-300' },
    ],
  },
  {
    label: 'OPTIONAL',
    sections: [
      { id: 'awards' as const, title: 'Awards & Honors', icon: Trophy, colorClass: 'bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/15 group-hover:text-yellow-300' },
      { id: 'certifications' as const, title: 'Certifications', icon: Award, colorClass: 'bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/15 group-hover:text-sky-300' },
      { id: 'interests' as const, title: 'Interests', icon: Heart, colorClass: 'bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/15 group-hover:text-pink-300' },
      { id: 'publications' as const, title: 'Publications', icon: BookOpen, colorClass: 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/15 group-hover:text-orange-300' },
      { id: 'references' as const, title: 'References', icon: Phone, colorClass: 'bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/15 group-hover:text-teal-300' },
      { id: 'volunteer' as const, title: 'Volunteer', icon: HandHeart, colorClass: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/15 group-hover:text-violet-300' },
    ],
  },
]

const truncateText = (str: string, max: number) => {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '...' : str
}

const getSectionPreview = (section: string, data: ResumeData): string => {
  switch (section) {
    case 'contact': return data.contact.email || 'Add your details'
    case 'summary': return truncateText(data.summary, 60) || 'Write a summary'
    case 'experience':
      return data.experience.length === 0 ? 'No positions added yet'
        : `${data.experience[0].jobTitle || 'Untitled'} at ${data.experience[0].company || 'No Company'}` + (data.experience.length > 1 ? ` +${data.experience.length - 1} more` : '')
    case 'education': return data.education.length === 0 ? 'No institutions added yet' : `${data.education.length} institution(s) added`
    case 'skills': return data.skills.length === 0 ? 'No skills added yet' : data.skills.slice(0, 4).join(', ') + (data.skills.length > 4 ? '...' : '')
    case 'languages': { const l = data.languages || []; return l.length === 0 ? 'No languages added' : l.map(x => x.name).join(', ') + (l.length > 3 ? '...' : '') }
    case 'projects': { const l = data.projects || []; return l.length === 0 ? 'No projects added' : `${l.length} project(s)` }
    case 'awards': { const l = data.awards || []; return l.length === 0 ? 'No awards added' : l.map(x => x.title).filter(Boolean).join(', ') }
    case 'certifications': { const l = data.certifications || []; return l.length === 0 ? 'No certifications added' : l.map(x => x.title).filter(Boolean).join(', ') }
    case 'interests': { const l = data.interests || []; return l.length === 0 ? 'No interests added' : l.map(x => x.name).filter(Boolean).join(', ') }
    case 'publications': { const l = data.publications || []; return l.length === 0 ? 'No publications added' : l.map(x => x.title).filter(Boolean).join(', ') }
    case 'references': { const l = data.references || []; return l.length === 0 ? 'No references added' : l.map(x => x.name).filter(Boolean).join(', ') }
    case 'volunteer': { const l = data.volunteer || []; return l.length === 0 ? 'No volunteer experience added' : l.map(x => x.organization).filter(Boolean).join(', ') }
    default: return ''
  }
}

export default function EditorPage() {
  const { resumeData, selectedTemplate, jobDescription, updateActiveResume } = useResume()
  const ctx = useOutletContext<EditorContextType>()

  const { activeMode, setActiveMode, openDrawer, activeStudioSection, setActiveStudioSection, pageCount, setPageCount, templateFontSize, onChangeFontSize, templateFontWeight, onChangeFontWeight, stylePrefs, updateStylePrefs, sectionOrder, onSectionOrderChange, mobileView, setMobileView, themeColor, setThemeColor, handlePrint, setShowAiGuide } = ctx

  const completedCount = Object.values(getSectionStatus(resumeData)).filter(Boolean).length

  const renderDesignControls = () => {
    return (
      <div className="space-y-6">
        {/* Templates */}
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-450 block select-none font-display">Layout Template</label>
          <div className="grid grid-cols-2 gap-2">
            {templatesList.map(t => {
              const isSelected = selectedTemplate === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateActiveResume(prev => ({ ...prev, selectedTemplate: t.id }))}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#b91c1c]/10 border-[#b91c1c]/35 text-[#b91c1c] shadow-lg shadow-rose-950/5' 
                      : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
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
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-450 block select-none font-display">Base Font Size</label>
          <div className="flex items-center bg-zinc-950 border border-zinc-850 rounded-xl p-0.5 h-10 w-full justify-between">
            <button 
              onClick={() => onChangeFontSize(Math.max(6, Number((templateFontSize - 0.5).toFixed(1))))}
              className="px-3 text-zinc-400 hover:text-white hover:bg-zinc-900/65 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center font-bold text-xs"
              type="button"
              title="Decrease font size"
            >
              <span>A-</span>
            </button>
            <div className="flex items-center gap-1.5 px-2 text-zinc-300 font-mono select-none">
              <Type className="w-4 h-4 text-zinc-550" />
              <span className="text-xs font-black">{templateFontSize}pt</span>
            </div>
            <button 
              onClick={() => onChangeFontSize(Math.min(16, Number((templateFontSize + 0.5).toFixed(1))))}
              className="px-3 text-zinc-400 hover:text-white hover:bg-zinc-900/65 rounded-lg transition-colors cursor-pointer h-full flex items-center justify-center font-bold text-xs"
              type="button"
              title="Increase font size"
            >
              <span>A+</span>
            </button>
          </div>
        </div>

        {/* Weight */}
        <div className="space-y-3 pt-4 border-t border-zinc-800/40">
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-450 block select-none font-display">Font Weight</label>
          <div className="flex items-center bg-zinc-950 border border-zinc-850 rounded-xl p-0.5 h-10 w-full justify-between mb-2.5">
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
                    : 'bg-zinc-950/60 border-zinc-850 text-zinc-550 hover:text-zinc-300 hover:bg-zinc-900'
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
            <div className="hidden lg:flex border-r border-zinc-800 bg-card/65 backdrop-blur-md flex-col flex-shrink-0 h-full overflow-hidden no-print w-[380px]">
              {activeMode === 'studio' ? (
                <>
                  <div className="px-5 pt-5 pb-4 border-b border-zinc-800/40 flex-shrink-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-white">Resume Builder</h2>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {completedCount === 13 ? 'All sections complete ✓' : `${13 - completedCount} section${13 - completedCount !== 1 ? 's' : ''} remaining`}
                        </p>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                        {completedCount}/13
                      </span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(completedCount / 13) * 100}%`, backgroundColor: themeColor }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto form-panel">
                    {sectionGroups.map((group) => (
                      <div key={group.label}>
                        <div className="px-5 pt-4 pb-1">
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{group.label}</span>
                        </div>
                        {group.sections.map((section) => {
                          const isComplete = getSectionStatus(resumeData)[section.id]
                          const previewText = getSectionPreview(section.id, resumeData)
                          const Icon = section.icon
                          const isActive = activeStudioSection === section.id
                          return (
                            <button key={section.id} type="button" onClick={() => openDrawer(section.id)} className={`w-full text-left group flex items-center gap-4 px-5 py-3.5 transition-all duration-150 cursor-pointer border-l-2 ${isActive ? 'border-[#b91c1c] bg-zinc-800/20 hover:bg-zinc-800/30' : 'border-transparent hover:border-zinc-700 hover:bg-zinc-800/40'}`}>
                              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center transition-colors ${section.colorClass}`}>
                                <Icon className="w-5 h-5 transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{section.title}</p>
                                <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{previewText}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isComplete ? (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Complete" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full border border-zinc-600 bg-transparent shrink-0" title="Incomplete" />
                                )}
                                <ChevronRight className="w-4 h-4 text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ))}
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
            <div className={`w-full bg-card/65 backdrop-blur-md flex flex-col h-full overflow-hidden no-print lg:hidden ${mobileView === 'preview' ? 'hidden' : 'flex'}`}>
              {activeMode === 'studio' ? (
                <>
                  <div className="px-5 pt-5 pb-4 border-b border-zinc-800/40 flex-shrink-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-white">Resume Builder</h2>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {completedCount === 13 ? 'All sections complete ✓' : `${13 - completedCount} section${13 - completedCount !== 1 ? 's' : ''} remaining`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-500 font-mono">{completedCount}/13</span>
                        <button onClick={() => setMobileView('preview')} className="font-bold text-xs h-9 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-colors cursor-pointer active:scale-95">Preview</button>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(completedCount / 13) * 100}%`, backgroundColor: themeColor }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto form-panel pb-16 lg:pb-0">
                    {sectionGroups.map((group) => (
                      <div key={group.label}>
                        <div className="px-5 pt-4 pb-1">
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{group.label}</span>
                        </div>
                        {group.sections.map((section) => {
                          const isComplete = getSectionStatus(resumeData)[section.id]
                          const previewText = getSectionPreview(section.id, resumeData)
                          const Icon = section.icon
                          const isActive = activeStudioSection === section.id
                          return (
                            <button key={section.id} type="button" onClick={() => openDrawer(section.id)} className={`w-full text-left group flex items-center gap-4 px-5 py-3.5 min-h-[56px] hover:bg-zinc-800/40 active:bg-zinc-800/70 transition-all cursor-pointer border-l-2 ${isActive ? 'border-[#b91c1c] bg-zinc-800/20' : 'border-transparent'}`}>
                              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center transition-colors ${section.colorClass}`}>
                                <Icon className="w-5 h-5 transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{section.title}</p>
                                <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{previewText}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isComplete ? (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Complete" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full border border-zinc-600 bg-transparent shrink-0" title="Incomplete" />
                                )}
                                <ChevronRight className="w-4 h-4 text-zinc-700 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ))}
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
                  <div className="flex-1 overflow-y-auto p-5 form-panel">
                    {renderDesignControls()}
                  </div>
                </>
              )}
            </div>

            {/* A4 Preview Container */}
            <div className={`flex-1 h-full preview-dot-bg overflow-auto p-3 sm:p-6 flex items-start justify-center print-block min-w-0 relative scroll-smooth ${mobileView === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="w-full max-w-[858px] pb-16">
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
                <div className="sticky top-4 z-20 flex items-center justify-center mb-4 no-print">
                  <div className="preview-toolbar inline-flex items-center gap-2 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[10px] font-bold text-zinc-400">LIVE</span>
                    <span className="w-px h-4 bg-zinc-700" />
                    <span className="text-[10px] text-zinc-500 font-mono">{pageCount}p</span>
                    <span className="w-px h-4 bg-zinc-700" />
                    <button
                      onClick={() => onChangeFontSize(Math.max(6, Number((templateFontSize - 0.5).toFixed(1))))}
                      className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer text-[10px] font-bold"
                      title="Decrease font size"
                    >−</button>
                    <span className="text-[10px] font-mono text-zinc-300 w-8 text-center">{templateFontSize}pt</span>
                    <button
                      onClick={() => onChangeFontSize(Math.min(16, Number((templateFontSize + 0.5).toFixed(1))))}
                      className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer text-[10px] font-bold"
                      title="Increase font size"
                    >+</button>
                  </div>
                </div>
                <div className="preview-paper-shadow rounded-sm overflow-hidden">
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
                  hideToolbar
                />
              </div>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'preview' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden preview-dot-bg p-3 sm:p-5 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 mb-4 flex-shrink-0 gap-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Eye size={16} className="text-red-400" /> Document Preview & Export
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Choose your styling template and preview your resume</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 hidden sm:inline">Template</label>
                  <div className="relative">
                    <select value={selectedTemplate} onChange={(e) => updateActiveResume(prev => ({ ...prev, selectedTemplate: e.target.value as Template }))} className="appearance-none h-9 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900 hover:border-zinc-700 focus:bg-zinc-900 focus:border-[#b91c1c]/50 px-3 pr-8 text-xs font-bold text-white transition-all cursor-pointer outline-none">
                      <option value="classic">Classic</option>
                      <option value="modern">Modern</option>
                      <option value="executive">Executive</option>
                      <option value="minimalist">Minimalist</option>
                      <option value="creative">Creative</option>
                      <option value="compact">Compact</option>
                      <option value="professional">Professional</option>
                      <option value="technical">Technical</option>
                      <option value="academic">Academic</option>
                      <option value="clean">Clean</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
                <button onClick={handlePrint} className="font-bold text-xs text-rose-400 bg-rose-950/10 border border-rose-900/40 hover:bg-rose-900/20 hover:text-rose-300 shadow-[0_0_12px_rgba(185,28,28,0.05)] transition-all h-8 px-3 rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                  <Eye size={13} /> Export PDF
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-3 sm:p-6 flex justify-center items-start min-w-0">
              <div className="w-full max-w-[858px]">
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
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-5 h-5 rounded-full border-2 border-red-500/30 border-t-red-400 animate-spin" />
            </div>
          }>
            <AtsChecker
              resumeData={resumeData}
              jobDescription={jobDescription}
              templateFontSize={templateFontSize}
              onUpdateJobDescription={(jd) => updateActiveResume((prev) => ({ ...prev, jobDescription: jd }))}
              onNavigateToSection={(section) => { setActiveMode('studio'); setActiveStudioSection(section as SectionType) }}
            />
          </Suspense>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
