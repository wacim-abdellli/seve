import { formatDate } from '../../../utils/dateUtils'

interface ResumeDateRangeProps {
  startDate?: string
  endDate?: string
  current?: boolean
  className?: string
}

export default function ResumeDateRange({ startDate, endDate, current, className = '' }: ResumeDateRangeProps) {
  return (
    <span className={className}>
      {formatDate(startDate || '')} – {current ? 'Present' : formatDate(endDate || '')}
    </span>
  )
}
