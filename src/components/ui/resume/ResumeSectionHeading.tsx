import type { ReactNode } from 'react'

interface ResumeSectionHeadingProps {
  label: string
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
}

export default function ResumeSectionHeading({ label, className = '', style, children }: ResumeSectionHeadingProps) {
  return (
    <h2 className={className} style={style}>
      {label}
      {children}
    </h2>
  )
}
