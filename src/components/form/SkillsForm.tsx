import { useState, useRef, useEffect, useMemo } from 'react'
import { industryKeywords } from '../../utils/atsConstants'
import { HelpCircle, Sparkles, Plus, X, ChevronDown } from 'lucide-react'

interface SkillsFormProps {
  skills: string[]
  jobTitle: string
  onChange: (updated: string[]) => void
}

const INDUSTRY_LABELS: Record<string, string> = {
  softwareTech: 'Software & Tech',
  dataScience: 'Data Science & AI',
  marketing: 'Marketing',
  finance: 'Finance & Accounting',
  healthcare: 'Healthcare',
  design: 'Design & UI/UX',
  sales: 'Sales & BizDev',
  management: 'Management & Ops',
  education: 'Education & Training',
  engineering: 'Engineering (Mech/Elec/Civil)',
  humanResources: 'HR & Recruiting',
  customerSupport: 'Customer Support',
  legal: 'Legal & Compliance',
  writing: 'Writing & Editing',
  hospitality: 'Hospitality & Food',
  construction: 'Construction & Trades',
  supplyChain: 'Supply Chain & Logistics',
}

const detectCategory = (jobTitle: string): string => {
  const cleanJob = jobTitle.toLowerCase()
  if (/marketing|brand|seo|growth|copywrit/i.test(cleanJob)) return 'marketing'
  if (/finance|audit|account|tax|budget|cfa|treasury/i.test(cleanJob)) return 'finance'
  if (/nurse|health|clinical|patient|doctor|medical|dent|pharmac/i.test(cleanJob)) return 'healthcare'
  if (/design|ui|ux|graphics|art|figma|illustrat|creativ/i.test(cleanJob)) return 'design'
  if (/sales|bizdev|retail|cold|account manager|commercial/i.test(cleanJob)) return 'sales'
  if (/manager|project|leader|pmp|agile|scrum|ops|operations/i.test(cleanJob)) return 'management'
  if (/data|science|analyst|machine|learning|ai|python|statistics/i.test(cleanJob)) return 'dataScience'
  if (/teacher|tutor|professor|instructor|education|curriculum|school|academic/i.test(cleanJob)) return 'education'
  if (/mechanical|electrical|civil|hardware|cad|manufacturing|solidworks|autocad/i.test(cleanJob)) return 'engineering'
  if (/recruiter|talent|hr|human resources|payroll|benefits/i.test(cleanJob)) return 'humanResources'
  if (/customer|support|client|service|helpdesk|help desk|ticket/i.test(cleanJob)) return 'customerSupport'
  if (/lawyer|legal|paralegal|compliance|contract|attorney/i.test(cleanJob)) return 'legal'
  if (/writer|editor|copywriter|content|journal/i.test(cleanJob)) return 'writing'
  if (/chef|cook|hotel|restaurant|hospitality|event|catering|waiter/i.test(cleanJob)) return 'hospitality'
  if (/construction|carpenter|plumber|electrician|builder|hvac/i.test(cleanJob)) return 'construction'
  if (/supply|chain|logistics|inventory|procure|warehouse/i.test(cleanJob)) return 'supplyChain'
  return 'softwareTech'
}

const allAvailableSkills = Array.from(
  new Set(Object.values(industryKeywords).flat())
)

export default function SkillsForm({ skills, jobTitle, onChange }: SkillsFormProps) {
  const [activeCatIdx, setActiveCatIdx] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('softwareTech')
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Track input values separately per category block
  const [inputValues, setInputValues] = useState<Record<number, string>>({})
  const [showDropdownIdx, setShowDropdownIdx] = useState<number | null>(null)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const containerRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const industryDropdownRef = useRef<HTMLDivElement>(null)
  const filterTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const groupedSkills = useMemo(() => {
    const parsed: { category: string; items: string[] }[] = []
    for (const item of skills) {
      const colonIdx = item.indexOf(':')
      if (colonIdx > 0) {
        const cat = item.substring(0, colonIdx).trim()
        const skillsText = item.substring(colonIdx + 1).trim()
        const items = skillsText
          ? skillsText.split(',').map(s => s.trim()).filter(Boolean)
          : []
        parsed.push({ category: cat, items })
      } else {
        const defaultCat = 'Skills'
        const existing = parsed.find(p => p.category.toLowerCase() === defaultCat.toLowerCase())
        if (existing) {
          if (!existing.items.includes(item)) {
            existing.items.push(item)
          }
        } else {
          parsed.push({ category: defaultCat, items: [item] })
        }
      }
    }
    if (parsed.length === 0) {
      parsed.push({ category: 'Skills', items: [] })
    }
    return parsed
  }, [skills])

  const serializeSkills = (groups: { category: string; items: string[] }[]): string[] => {
    return groups
      .filter(g => g.category.trim() !== '')
      .map(g => `${g.category.trim()}: ${g.items.join(', ')}`)
  }

  // Auto-detect industry when job title changes
  useEffect(() => {
    const t = setTimeout(() => { setSelectedCategory(detectCategory(jobTitle)) })
    return () => clearTimeout(t)
  }, [jobTitle])

  // Filter autocomplete suggestions based on active category typing
  const activeInputValue = inputValues[activeCatIdx] || ''
  useEffect(() => {
    if (!activeInputValue.trim()) {
      setFilteredSuggestions([])
      setShowDropdownIdx(null)
      return
    }

    clearTimeout(filterTimerRef.current)
    filterTimerRef.current = setTimeout(() => {
      const cleanInput = activeInputValue.toLowerCase()
      const matches = allAvailableSkills.filter(
        (skill) => 
          skill.toLowerCase().includes(cleanInput) && 
          !skills.some(existing => {
            const cleanExisting = existing.toLowerCase()
            const cleanSkill = skill.toLowerCase()
            if (cleanExisting.includes(':')) {
              const parts = cleanExisting.split(':')[1] || ''
              return parts.split(',').map(x => x.trim()).includes(cleanSkill)
            }
            return cleanExisting === cleanSkill
          })
      )

      setFilteredSuggestions(matches.slice(0, 5))
      setShowDropdownIdx(matches.length > 0 ? activeCatIdx : null)
      setSelectedIndex(-1)
    }, 150)

    return () => clearTimeout(filterTimerRef.current)
  }, [activeInputValue, activeCatIdx, skills])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDropdownIdx !== null) {
        const ref = containerRefs.current[showDropdownIdx]
        if (ref && !ref.contains(e.target as Node)) {
          setShowDropdownIdx(null)
        }
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node)) {
        setShowIndustryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdownIdx])

  const handleAddCategory = () => {
    const updated = [...groupedSkills, { category: 'New Category', items: [] }]
    onChange(serializeSkills(updated))
    setActiveCatIdx(updated.length - 1)
  }

  const handleRemoveCategory = (index: number) => {
    const updated = groupedSkills.filter((_, i) => i !== index)
    onChange(serializeSkills(updated))
    setActiveCatIdx(prev => Math.min(prev, updated.length - 1))
  }

  const handleRenameCategory = (index: number, newName: string) => {
    const updated = groupedSkills.map((g, i) => i === index ? { ...g, category: newName } : g)
    onChange(serializeSkills(updated))
  }

  const handleAddSkillToCategory = (catIndex: number, skillName: string) => {
    const trimmed = skillName.trim()
    if (!trimmed) return
    const group = groupedSkills[catIndex]
    if (!group) return
    if (group.items.some(item => item.toLowerCase() === trimmed.toLowerCase())) return
    const updated = groupedSkills.map((g, i) => i === catIndex ? { ...g, items: [...g.items, trimmed] } : g)
    onChange(serializeSkills(updated))
    setInputValues(prev => ({ ...prev, [catIndex]: '' }))
    setShowDropdownIdx(null)
  }

  const handleRemoveSkillFromCategory = (catIndex: number, skillName: string) => {
    const updated = groupedSkills.map((g, i) => i === catIndex ? { ...g, items: g.items.filter(item => item !== skillName) } : g)
    onChange(serializeSkills(updated))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, catIdx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const currentInputValue = inputValues[catIdx] || ''
      if (showDropdownIdx === catIdx && selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        handleAddSkillToCategory(catIdx, filteredSuggestions[selectedIndex])
      } else {
        handleAddSkillToCategory(catIdx, currentInputValue)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showDropdownIdx === catIdx && filteredSuggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showDropdownIdx === catIdx && filteredSuggestions.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length)
      }
    } else if (e.key === 'Escape') {
      setShowDropdownIdx(null)
    }
  }

  const getIndustrySuggestions = (): string[] => {
    const allCategorySkills = industryKeywords[selectedCategory] || []
    return allCategorySkills.filter((s) => !skills.some(existing => {
      const cleanExisting = existing.toLowerCase()
      const cleanSkill = s.toLowerCase()
      if (cleanExisting.includes(':')) {
        const parts = cleanExisting.split(':')[1] || ''
        return parts.split(',').map(x => x.trim()).includes(cleanSkill)
      }
      return cleanExisting === cleanSkill
    }))
  }

  const industrySuggestions = getIndustrySuggestions()

  return (
    <div className="flex flex-col gap-4">
      {/* List Header and Info Button */}
      <div className="flex justify-between items-center mb-1">
        <label className="text-label">Skills & Stack</label>
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          title="Formatting Guidelines"
        >
          <HelpCircle size={15} />
        </button>
      </div>

      {showTooltip && (
        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-zinc-400 text-xs leading-relaxed animate-fade-in flex flex-col gap-1.5">
          <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Sparkles size={14} className="animate-pulse text-rose-400" />
            ATS Keyword Rules:
          </span>
          <p className="font-light">
            Aim for 10-15 relevant capabilities. Grouping skills by category (e.g. "Languages", "Tools") makes your resume highly readable for both ATS algorithms and human recruiters.
          </p>
        </div>
      )}

      {/* Category Groups list */}
      <div className="space-y-4">
        {groupedSkills.map((group, idx) => {
          const isActive = idx === activeCatIdx
          const currentInputValue = inputValues[idx] || ''
          const showDropdown = showDropdownIdx === idx
          
          return (
            <div
              key={idx}
              ref={(el) => { containerRefs.current[idx] = el }}
              onClick={() => setActiveCatIdx(idx)}
              className={`p-3.5 rounded-xl border transition-all flex flex-col gap-3 ${
                isActive 
                  ? 'bg-zinc-900/40 border-rose-500/35 shadow-[0_0_10px_rgba(185,28,28,0.05)]' 
                  : 'bg-zinc-900/10 border-zinc-800 hover:border-zinc-700/60'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={group.category}
                  onChange={(e) => handleRenameCategory(idx, e.target.value)}
                  placeholder="Category Name (e.g. Frontend)"
                  className="bg-zinc-950/60 border border-zinc-800 focus:border-rose-500/50 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none flex-1 placeholder:text-zinc-600 transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
                {groupedSkills.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveCategory(idx)
                    }}
                    className="text-[9.5px] font-bold text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Delete Group
                  </button>
                )}
              </div>

              {/* Tags/Chips */}
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium gap-1 py-0.5 pl-2.5 pr-1 flex items-center text-[10.5px] h-6"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSkillFromCategory(idx, item)
                      }}
                      aria-label={`Remove ${item}`}
                      className="w-4.5 h-4.5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
                {group.items.length === 0 && (
                  <p className="text-[10px] text-zinc-500 italic font-light py-0.5">Empty group. Add skills below.</p>
                )}
              </div>

              {/* Input for this specific Category */}
              <div className="relative flex gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={currentInputValue}
                    onChange={(e) => {
                      setInputValues(prev => ({ ...prev, [idx]: e.target.value }))
                      setActiveCatIdx(idx)
                    }}
                    onFocus={() => setActiveCatIdx(idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    placeholder="Add skill (e.g. TypeScript)..."
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  />
                  {showDropdown && (
                    <div className="absolute top-[105%] left-0 w-full z-30 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl animate-scale-in">
                      {filteredSuggestions.map((suggestion, sIdx) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddSkillToCategory(idx, suggestion)}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-[11px] font-medium border-b border-zinc-800/40 last:border-b-0 transition-all cursor-pointer ${
                            sIdx === selectedIndex 
                              ? 'bg-rose-955/40 text-rose-400 font-bold border-l-2 border-rose-500 pl-2.5' 
                              : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <span>{suggestion}</span>
                          <span className="text-[9px] opacity-40 font-mono">Press Enter</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddSkillToCategory(idx, currentInputValue)}
                  className="px-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add category block button */}
      <button
        type="button"
        onClick={handleAddCategory}
        className="w-full py-2.5 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Plus size={13} /> Add Skill Group
      </button>

      {/* Recommended suggestions panel */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
            <Sparkles size={13} className="text-rose-455 animate-pulse" />
            Recommended for {INDUSTRY_LABELS[selectedCategory]}
          </h4>
          
          <div ref={industryDropdownRef} className="relative z-20">
            <button
              type="button"
              onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
              className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2 py-1 rounded-md text-[10px] font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <span>Change Industry</span>
              <ChevronDown size={10} className={`opacity-60 transition-transform duration-250 ${showIndustryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showIndustryDropdown && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-[110%] w-[200px] max-h-[220px] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl custom-scrollbar py-1 animate-scale-in">
                {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(key)
                      setShowIndustryDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-medium border-b border-zinc-800/40 last:border-b-0 transition-colors cursor-pointer ${
                      key === selectedCategory
                        ? 'bg-rose-955/30 text-rose-400 font-bold border-l-2 border-rose-500 pl-2.5'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-[130px] overflow-y-auto pr-1.5 custom-scrollbar">
          {industrySuggestions.slice(0, 20).map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => handleAddSkillToCategory(activeCatIdx, skill)}
              className="text-[10px] font-semibold py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-white h-7 rounded-lg transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={10} className="text-zinc-500" />
              {skill}
            </button>
          ))}
          {industrySuggestions.length === 0 && (
            <p className="text-[10px] text-zinc-500 italic font-light py-2">
              All recommended skills added.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
