export const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''

  if (dateStr.toLowerCase() === 'present')
    return 'Present'

  if (/^\d{2}\/\d{4}$/.test(dateStr)) return dateStr

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[1]}`
  }

  const months: Record<string, string> = {
    january: '01', february: '02', march: '03',
    april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09',
    october: '10', november: '11', december: '12'
  }
  const nameMatch = dateStr.match(/(\w+)\s+(\d{4})/i)
  if (nameMatch) {
    const m = months[nameMatch[1].toLowerCase()]
    if (m) return `${m}/${nameMatch[2]}`
  }

  return dateStr
}
