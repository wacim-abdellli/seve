import { parseCategorizedSkills } from '../../../utils/atsUtils'

interface ResumeSkillsListProps {
  skills: string[]
  separator?: string
  className?: string
  style?: React.CSSProperties
  layout?: 'grid' | 'list'
}

export default function ResumeSkillsList({ skills, separator = ' · ', className = '', style, layout = 'grid' }: ResumeSkillsListProps) {
  if (!skills || skills.length === 0) return null

  const groups = parseCategorizedSkills(skills)
  if (groups.length === 0) return null

  const isGrid = layout === 'grid' && groups.length > 1

  return (
    <div className={`${isGrid ? 'grid grid-cols-2 gap-x-6 gap-y-1.5' : 'flex flex-col gap-1.5'} ${className}`} style={style}>
      {groups.map((group, idx) => (
        <div key={idx} className="flex flex-wrap items-baseline gap-x-1.5 leading-normal">
          {group.category !== 'Skills' && (
            <span className="font-semibold text-slate-800 shrink-0">{group.category}:</span>
          )}
          <span className="text-slate-600 font-light">
            {group.items.join(separator)}
          </span>
        </div>
      ))}
    </div>
  )
}
