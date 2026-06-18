interface ResumeEducationItemProps {
  school: string
  degree: string
  graduationDate: string
  location?: string | null
  gpa?: string | null
  headerClass?: string
  schoolClass?: string
  dateClass?: string
  detailClass?: string
}

export default function ResumeEducationItem({
  school, degree, graduationDate, location, gpa,
  headerClass = 'flex justify-between items-baseline',
  schoolClass = '',
  dateClass = '',
  detailClass = '',
}: ResumeEducationItemProps) {
  const showGpa = gpa && parseFloat(gpa) >= 3.5

  return (
    <div>
      <div className={headerClass}>
        <span className={schoolClass}>{school}</span>
        <span className={dateClass}>{graduationDate}</span>
      </div>
      <div className={detailClass}>
        <span>{degree}</span>
        {location && <span> · {location}</span>}
        {showGpa && <span> · GPA: {gpa}</span>}
      </div>
    </div>
  )
}
