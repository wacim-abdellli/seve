import React, { useState, useRef, useEffect } from 'react'
import { industryKeywords } from '../../utils/atsConstants'
import { HelpCircle, Sparkles, Plus, X } from 'lucide-react'

interface SkillsFormProps {
  skills: string[]
  jobTitle: string
  onChange: (updated: string[]) => void
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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!inputValue.trim()) {
      queueMicrotask(() => {
        setFilteredSuggestions([])
        setShowDropdown(false)
      })
      return
    }

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
  }, [inputValue, skills])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
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
    const cleanJob = jobTitle.toLowerCase()
    let categoryKey = 'softwareTech'

    if (/marketing|brand|seo|growth/i.test(cleanJob)) {
      categoryKey = 'marketing'
    } else if (/finance|audit|account|tax|budget/i.test(cleanJob)) {
      categoryKey = 'finance'
    } else if (/nurse|health|clinical|patient|doctor|medical/i.test(cleanJob)) {
      categoryKey = 'healthcare'
    } else if (/design|ui|ux|graphics|art|figma/i.test(cleanJob)) {
      categoryKey = 'design'
    } else if (/sales|bizdev|retail|cold/i.test(cleanJob)) {
      categoryKey = 'sales'
    } else if (/manager|project|leader|pmp|agile|scrum/i.test(cleanJob)) {
      categoryKey = 'management'
    } else if (/software|dev|engineer|tech|code|react|web/i.test(cleanJob)) {
      categoryKey = 'softwareTech'
    }

    const allCategorySkills = industryKeywords[categoryKey] || []
    return allCategorySkills.filter((s) => !skills.some(existing => existing.toLowerCase() === s.toLowerCase()))
  }

  const industrySuggestions = getIndustrySuggestions()

  return (
    <div className="flex flex-col gap-4">
      {/* List Header and Info Button */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-label">Skills Inventory</span>
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          className="text-zinc-550 hover:text-white transition-colors cursor-pointer"
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
                        : 'text-zinc-300 hover:bg-zinc-850'
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
                className="w-4 h-4 rounded-full flex items-center justify-center text-zinc-550 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {skills.length === 0 && (
            <p className="text-xs text-zinc-550 italic font-light">No skills registered yet.</p>
          )}
        </div>
      </div>

      {/* Recommended Suggestions */}
      {industrySuggestions.length > 0 && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 flex flex-col gap-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
            <Sparkles size={13} className="text-rose-455" />
            Recommended for {jobTitle ? `"${jobTitle}"` : 'your profile'}
          </h4>
          <div className="flex flex-wrap gap-2 max-h-[130px] overflow-y-auto pr-1.5 custom-scrollbar">
            {industrySuggestions.slice(0, 15).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="text-xs font-medium py-1 px-2.5 bg-zinc-905 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 h-7 rounded-lg transition-colors cursor-pointer"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
