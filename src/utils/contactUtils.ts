import type { ContactInfo } from '../types/resume'

export const getFullName = (contact?: ContactInfo): string => {
  return contact?.fullName?.trim() || ''
}
