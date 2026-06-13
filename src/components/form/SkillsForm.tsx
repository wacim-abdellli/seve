import React, { useState } from 'react'
import { industryKeywords } from '../../utils/keywords'

interface SkillsFormProps {
  skills: string[]
  jobTitle: string
  onChange: (updated: string[]) => void
}

export default function SkillsForm({ skills, jobTitle, onChange }: SkillsFormProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill(inputValue)
    }
  }

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed])
      setInputValue('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove))
  }

  // Suggest skills based on target job title
  const getSuggestions = (): string[] => {
    const cleanJob = jobTitle.toLowerCase()
    let categoryKey = 'softwareTech' // default fallback

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
    // Filter out skills that are already added
    return allCategorySkills.filter((s) => !skills.includes(s))
  }

  const suggestions = getSuggestions()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Professional Skills</h3>

      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">
          Add Skills (Press Enter to add)
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. React, Project Management, SEO"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Added Skills Tags */}
      <div className="flex flex-wrap gap-2 py-1">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="hover:text-red-400 font-bold ml-1 transition-colors text-[10px]"
            >
              ✕
            </button>
          </span>
        ))}
        {skills.length === 0 && (
          <p className="text-xs text-slate-500 italic py-1">No skills added yet.</p>
        )}
      </div>

      {/* Recommended Suggestions panel */}
      {suggestions.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 mt-2">
          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wide mb-2.5">
            Suggested for "{jobTitle || 'Your Industry'}"
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 15).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-lg transition-all border border-slate-600/50"
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
