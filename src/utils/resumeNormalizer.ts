import type { ResumeData, LanguageProficiency } from '../types/resume'

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : []

export function normalizeResumeData(importedData: unknown): ResumeData {
  const defaultContact = { fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' }

  if (!isRecord(importedData)) {
    return {
      contact: defaultContact,
      summary: '',
      experience: [],
      education: [],
      skills: [],
    }
  }

  const root = importedData
  const rawContact = isRecord(root.contact) ? root.contact : {}
  const contact = {
    fullName: asString(rawContact.fullName),
    email: asString(rawContact.email),
    phone: asString(rawContact.phone),
    linkedin: asString(rawContact.linkedin),
    location: asString(rawContact.location),
    website: asString(rawContact.website),
  }

  const summary = asString(root.summary)

  const pickStr = (item: JsonRecord | undefined, key: string): string =>
    isRecord(item) ? asString(item[key]) : ''

  const pickBool = (item: JsonRecord | undefined, key: string): boolean =>
    isRecord(item) && typeof item[key] === 'boolean' ? (item[key] as boolean) : false

  const pickArray = (item: JsonRecord | undefined, key: string): unknown[] =>
    isRecord(item) ? asArray(item[key]) : []

  const seenIds = new Set<string>()
  const ensureUniqueId = (id: string): string => {
    if (!id || seenIds.has(id)) {
      const newId = crypto.randomUUID()
      seenIds.add(newId)
      return newId
    }
    seenIds.add(id)
    return id
  }

  const experience = asArray(root.experience).map((exp: unknown) => {
    const e = isRecord(exp) ? exp : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      jobTitle: pickStr(e, 'jobTitle'),
      company: pickStr(e, 'company'),
      location: pickStr(e, 'location'),
      startDate: pickStr(e, 'startDate'),
      endDate: pickStr(e, 'endDate'),
      current: pickBool(e, 'current'),
      bullets: pickArray(e, 'bullets').map((b: unknown) => asString(b)),
    }
  })

  const education = asArray(root.education).map((edu: unknown) => {
    const e = isRecord(edu) ? edu : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      degree: pickStr(e, 'degree'),
      school: pickStr(e, 'school'),
      location: pickStr(e, 'location'),
      graduationDate: pickStr(e, 'graduationDate'),
      gpa: pickStr(e, 'gpa'),
    }
  })

  const skills = asArray(root.skills).map((s: unknown) => asString(s)).filter(Boolean)

  const languages = asArray(root.languages).map((l: unknown) => {
    const e = isRecord(l) ? l : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      name: pickStr(e, 'name'),
      proficiency: pickStr(e, 'proficiency') as LanguageProficiency,
    }
  })

  const projects = asArray(root.projects).map((p: unknown) => {
    const e = isRecord(p) ? p : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      name: pickStr(e, 'name'),
      description: pickStr(e, 'description'),
      technologies: pickArray(e, 'technologies').map((t: unknown) => asString(t)).filter(Boolean),
      link: pickStr(e, 'link'),
      startDate: pickStr(e, 'startDate'),
      endDate: pickStr(e, 'endDate'),
      date: pickStr(e, 'date'),
    }
  })

  const awards = asArray(root.awards).map((a: unknown) => {
    const e = isRecord(a) ? a : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      title: pickStr(e, 'title'),
      awarder: pickStr(e, 'awarder'),
      date: pickStr(e, 'date'),
      description: pickStr(e, 'description'),
    }
  })

  const certifications = asArray(root.certifications).map((c: unknown) => {
    const e = isRecord(c) ? c : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      title: pickStr(e, 'title'),
      issuer: pickStr(e, 'issuer'),
      date: pickStr(e, 'date'),
      description: pickStr(e, 'description'),
    }
  })

  const interests = asArray(root.interests).map((i: unknown) => {
    const e = isRecord(i) ? i : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      name: pickStr(e, 'name'),
      keywords: pickArray(e, 'keywords').map((k: unknown) => asString(k)).filter(Boolean),
    }
  })

  const publications = asArray(root.publications).map((p: unknown) => {
    const e = isRecord(p) ? p : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      title: pickStr(e, 'title'),
      publisher: pickStr(e, 'publisher'),
      date: pickStr(e, 'date'),
      description: pickStr(e, 'description'),
    }
  })

  const references = asArray(root.references).map((r: unknown) => {
    const e = isRecord(r) ? r : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      name: pickStr(e, 'name'),
      position: pickStr(e, 'position'),
      phone: pickStr(e, 'phone'),
      description: pickStr(e, 'description'),
    }
  })

  const volunteer = asArray(root.volunteer).map((v: unknown) => {
    const e = isRecord(v) ? v : undefined
    return {
      id: ensureUniqueId(pickStr(e, 'id')),
      organization: pickStr(e, 'organization'),
      location: pickStr(e, 'location'),
      period: pickStr(e, 'period'),
      description: pickStr(e, 'description'),
    }
  })

  return {
    contact,
    summary,
    experience,
    education,
    skills,
    languages,
    projects,
    awards,
    certifications,
    interests,
    publications,
    references,
    volunteer,
  }
}
