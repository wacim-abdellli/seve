interface ResumeBulletListProps {
  bullets: string[]
  className?: string
  itemClassName?: string
}

export default function ResumeBulletList({ bullets, className = '', itemClassName = '' }: ResumeBulletListProps) {
  const filtered = bullets.filter(b => b.trim() !== '')
  if (filtered.length === 0) return null

  return (
    <ul className={className}>
      {filtered.map((bullet) => (
        <li key={bullet} className={itemClassName}>{bullet}</li>
      ))}
    </ul>
  )
}
