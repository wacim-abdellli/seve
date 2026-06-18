import type { ReactNode } from 'react'
import ResumeDateRange from './ResumeDateRange'
import ResumeBulletList from './ResumeBulletList'

interface ResumeExperienceItemProps {
  jobTitle: string
  company: string
  startDate: string
  endDate: string
  current?: boolean
  location?: string | null
  bullets: string[]
  headerClass?: string
  titleClass?: string
  companyClass?: string
  dateClass?: string
  locationClass?: string
  bulletListClass?: string
  bulletItemClass?: string
  children?: ReactNode
}

export default function ResumeExperienceItem({
  jobTitle, company, startDate, endDate, current, location, bullets,
  headerClass = 'flex justify-between items-baseline',
  titleClass = '',
  companyClass = '',
  dateClass = '',
  locationClass = '',
  bulletListClass = '',
  bulletItemClass = '',
  children,
}: ResumeExperienceItemProps) {
  return (
    <div className="space-y-1">
      <div className={headerClass}>
        <span className={titleClass}>
          {jobTitle}{company ? <span className={companyClass}> — {company}</span> : ''}
        </span>
        <span className={dateClass}>
          <ResumeDateRange startDate={startDate} endDate={endDate} current={current} />
        </span>
      </div>
      {location && <div className={locationClass}>{location}</div>}
      <ResumeBulletList bullets={bullets} className={bulletListClass} itemClassName={bulletItemClass} />
      {children}
    </div>
  )
}
