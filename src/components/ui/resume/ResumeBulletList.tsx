interface ResumeBulletListProps {
  bullets: string[]
  className?: string
  itemClassName?: string
}

export default function ResumeBulletList({ bullets, className = '', itemClassName = '' }: ResumeBulletListProps) {
  const filtered = (bullets || []).filter(b => b && typeof b === 'string' && b.trim() !== '')
  if (filtered.length === 0) return null

  // Strip native list bullet styles and manual indents to prevent layout collisions
  const cleanClassName = className
    .replace(/\blist-disc\b/g, '')
    .trim()
    
  const cleanItemClassName = itemClassName
    .replace(/\blist-disc\b/g, '')
    .replace(/\b-indent-\S+\b/g, '')
    .replace(/\bpl-\S+\b/g, '')
    .replace(/\bml-\S+\b/g, '')
    .trim()

  return (
    <ul className={`${cleanClassName} list-none pl-0`}>
      {filtered.map((bullet, idx) => (
        <li
          key={idx}
          className={`${cleanItemClassName} list-none pl-0 relative flex items-start gap-2`}
          style={{ listStyleType: 'none', display: 'flex', alignItems: 'flex-start' }}
        >
          {/* Custom text-rendered bullet point for 100% canvas & print consistency */}
          <span 
            className="select-none text-slate-500 shrink-0 font-sans text-[10px]" 
            style={{ 
              lineHeight: '1.4',
              marginTop: '0.08em'
            }}
          >
            •
          </span>
          <span className="flex-1 text-justify leading-relaxed">{bullet}</span>
        </li>
      ))}
    </ul>
  )
}
