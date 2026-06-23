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
    <div 
      className={`${isGrid ? 'grid gap-y-1' : 'flex flex-col gap-1'} ${className}`} 
      style={{
        ...style,
        ...(isGrid ? { gridTemplateColumns: 'fit-content(70%) 1fr', columnGap: '1.5rem' } : {})
      }}
    >
      {groups.map((group, idx) => (
        <div key={idx} className="leading-normal">
          {group.category !== 'Skills' && (
            <span className="font-semibold text-slate-900 mr-1.5">{group.category}:</span>
          )}
          <span className="text-slate-650 font-light">
            {group.items.join(separator)}
          </span>
        </div>
      ))}
    </div>
  )
}
