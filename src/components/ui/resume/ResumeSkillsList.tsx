interface ResumeSkillsListProps {
  skills: string[]
  separator?: string
  className?: string
  style?: React.CSSProperties
}

export default function ResumeSkillsList({ skills, separator = ' · ', className = '', style }: ResumeSkillsListProps) {
  if (!skills || skills.length === 0) return null
  return <p className={className} style={style}>{skills.join(separator)}</p>
}
