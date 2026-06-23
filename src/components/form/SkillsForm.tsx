import { useState, useRef, useEffect } from 'react'
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
  if (/marketing|brand|seo|growth|copywrit/i.test(cleanJob)) {
    return 'marketing'
  }
  if (/finance|audit|account|tax|budget|cfa|treasury/i.test(cleanJob)) {
    return 'finance'
  }
  if (/nurse|health|clinical|patient|doctor|medical|dent|pharmac/i.test(cleanJob)) {
    return 'healthcare'
  }
  if (/design|ui|ux|graphics|art|figma|illustrat|creativ/i.test(cleanJob)) {
    return 'design'
  }
  if (/sales|bizdev|retail|cold|account manager|commercial/i.test(cleanJob)) {
    return 'sales'
  }
  if (/manager|project|leader|pmp|agile|scrum|ops|operations/i.test(cleanJob)) {
    return 'management'
  }
  if (/data|science|analyst|machine|learning|ai|python|statistics/i.test(cleanJob)) {
    return 'dataScience'
  }
  if (/teacher|tutor|professor|instructor|education|curriculum|school|academic/i.test(cleanJob)) {
    return 'education'
  }
  if (/mechanical|electrical|civil|hardware|cad|manufacturing|solidworks|autocad/i.test(cleanJob)) {
    return 'engineering'
  }
  if (/recruiter|talent|hr|human resources|payroll|benefits/i.test(cleanJob)) {
    return 'humanResources'
  }
  if (/customer|support|client|service|helpdesk|help desk|ticket/i.test(cleanJob)) {
    return 'customerSupport'
  }
  if (/lawyer|legal|paralegal|compliance|contract|attorney/i.test(cleanJob)) {
    return 'legal'
  }
  if (/writer|editor|copywriter|content|journal/i.test(cleanJob)) {
    return 'writing'
  }
  if (/chef|cook|hotel|restaurant|hospitality|event|catering|waiter/i.test(cleanJob)) {
    return 'hospitality'
  }
  if (/construction|carpenter|plumber|electrician|builder|hvac/i.test(cleanJob)) {
    return 'construction'
  }
  if (/supply|chain|logistics|inventory|procure|warehouse/i.test(cleanJob)) {
    return 'supplyChain'
  }
  return 'softwareTech'
}

const allAvailableSkills = Array.from(
  new Set(Object.values(industryKeywords).flat())
)

export default function SkillsForm({ skills, jobTitle, onChange }: SkillsFormProps) {
  const [inputValue, setInputValue] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('softwareTech')
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const industryDropdownRef = useRef<HTMLDivElement>(null)
  const filterTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Auto-detect industry when job title changes
  useEffect(() => {
    const t = setTimeout(() => { setSelectedCategory(detectCategory(jobTitle)) })
    return () => clearTimeout(t)
  }, [jobTitle])

  // Filter autocomplete suggestions based on user typing (debounced 150ms)
  useEffect(() => {
    if (!inputValue.trim()) {
      queueMicrotask(() => {
        setFilteredSuggestions([])
        setShowDropdown(false)
      })
      return
    }

    clearTimeout(filterTimerRef.current)
    filterTimerRef.current = setTimeout(() => {
      const cleanInput = inputValue.toLowerCase()
      const matches = allAvailableSkills.filter(
        (skill) => 
          skill.toLowerCase().includes(cleanInput) && 
          !skills.some(s => s.toLowerCase() === skill.toLowerCase())
      )

      queueMicrotask(() => {
        setFilteredSuggestions(matches.slice(0, 5))
        setShowDropdown(matches.length > 0)
        setSelectedIndex(-1)
      })
    }, 150)

    return () => clearTimeout(filterTimerRef.current)
  }, [inputValue, skills])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node)) {
        setShowIndustryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showDropdown && selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        addSkill(filteredSuggestions[selectedIndex])
      } else {
        addSkill(inputValue)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showDropdown && filteredSuggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showDropdown && filteredSuggestions.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length)
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...skills, trimmed])
      setInputValue('')
      setShowDropdown(false)
    }
  }

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove))
  }

  const getIndustrySuggestions = (): string[] => {
    const allCategorySkills = industryKeywords[selectedCategory] || []
    return allCategorySkills.filter((s) => !skills.some(existing => existing.toLowerCase() === s.toLowerCase()))
  }

  const industrySuggestions = getIndustrySuggestions()

  return (
    <div className="flex flex-col gap-4">
      {/* List Header and Info Button */}
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="skills-search-input" className="text-label">Skills Inventory</label>
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
            Aim for 10-15 relevant capabilities. Ensure the exact spelling matches requirements in job descriptions. Try to list both hard skills (e.g. React, Docker) and methodologies (e.g. CI/CD, Agile).
          </p>
        </div>
      )}

      {/* Input Autocomplete */}
      <div ref={containerRef} className="relative flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <input
              id="skills-search-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. TypeScript, GraphQL (Press Enter to add)"
              className="drawer-input"
            />

            {showDropdown && (
              <div className="absolute top-[105%] left-0 w-full z-30 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl animate-scale-in">
                {filteredSuggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSkill(suggestion)}
                    className={`w-full text-left px-4 py-2 flex items-center justify-between text-xs font-medium border-b border-zinc-800/40 last:border-b-0 transition-all cursor-pointer ${
                      idx === selectedIndex 
                        ? 'bg-rose-955/40 text-rose-400 font-bold border-l-2 border-rose-500 pl-3.5' 
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
            onClick={() => addSkill(inputValue)}
            className="font-bold h-9 px-3 flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Added Chips */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Added Skills ({skills.length})
        </h4>
        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar py-1">
          {skills.map((skill) => (
            <div
              key={skill}
              className="rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium gap-1.5 py-1 pl-3 pr-2 flex items-center text-xs h-7"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer rounded-full"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {skills.length === 0 && (
            <p className="text-xs text-zinc-500 italic font-light">No skills registered yet.</p>
          )}
        </div>
      </div>

      {/* Recommended Suggestions with Custom Dropdown Selector */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
            <Sparkles size={13} className="text-rose-455 animate-pulse" />
            Recommended Skills
          </h4>
          
          {/* Custom Dropdown Selector */}
          <div ref={industryDropdownRef} className="relative z-20">
            <button
              type="button"
              onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
              className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2 py-1 rounded-md text-[10px] font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <span>{INDUSTRY_LABELS[selectedCategory] || 'Industry'}</span>
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
              onClick={() => addSkill(skill)}
              className="text-[10px] font-semibold py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-white h-7 rounded-lg transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={10} className="text-zinc-500" />
              {skill}
            </button>
          ))}
          {industrySuggestions.length === 0 && (
            <p className="text-[10px] text-zinc-500 italic font-light py-2">
              All recommended skills added for this industry.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
