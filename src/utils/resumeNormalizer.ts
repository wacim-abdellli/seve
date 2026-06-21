import type { ResumeData } from '../types/resume'

export function normalizeResumeData(importedData: any): ResumeData {
  const defaultContact = { fullName: '', email: '', phone: '', linkedin: '', location: '', website: '' };
  
  if (!importedData || typeof importedData !== 'object') {
    return {
      contact: defaultContact,
      summary: '',
      experience: [],
      education: [],
      skills: [],
    };
  }

  const contact = {
    fullName: typeof importedData.contact?.fullName === 'string' ? importedData.contact.fullName : '',
    email: typeof importedData.contact?.email === 'string' ? importedData.contact.email : '',
    phone: typeof importedData.contact?.phone === 'string' ? importedData.contact.phone : '',
    linkedin: typeof importedData.contact?.linkedin === 'string' ? importedData.contact.linkedin : '',
    location: typeof importedData.contact?.location === 'string' ? importedData.contact.location : '',
    website: typeof importedData.contact?.website === 'string' ? importedData.contact.website : '',
  };

  const summary = typeof importedData.summary === 'string' ? importedData.summary : '';

  const ensureArray = (arr: any) => (Array.isArray(arr) ? arr : []);

  const experience = ensureArray(importedData.experience).map((exp: any) => ({
    id: typeof exp?.id === 'string' ? exp.id : crypto.randomUUID(),
    jobTitle: typeof exp?.jobTitle === 'string' ? exp.jobTitle : '',
    company: typeof exp?.company === 'string' ? exp.company : '',
    location: typeof exp?.location === 'string' ? exp.location : '',
    startDate: typeof exp?.startDate === 'string' ? exp.startDate : '',
    endDate: typeof exp?.endDate === 'string' ? exp.endDate : '',
    current: typeof exp?.current === 'boolean' ? exp.current : false,
    bullets: Array.isArray(exp?.bullets) ? exp.bullets.map((b: any) => typeof b === 'string' ? b : '') : [''],
  }));

  const education = ensureArray(importedData.education).map((edu: any) => ({
    id: typeof edu?.id === 'string' ? edu.id : crypto.randomUUID(),
    degree: typeof edu?.degree === 'string' ? edu.degree : '',
    school: typeof edu?.school === 'string' ? edu.school : '',
    location: typeof edu?.location === 'string' ? edu.location : '',
    graduationDate: typeof edu?.graduationDate === 'string' ? edu.graduationDate : '',
    gpa: typeof edu?.gpa === 'string' ? edu.gpa : '',
  }));

  const skills = Array.isArray(importedData.skills)
    ? importedData.skills.map((s: any) => typeof s === 'string' ? s : '').filter(Boolean)
    : [];

  const languages = ensureArray(importedData.languages).map((l: any) => ({
    id: typeof l?.id === 'string' ? l.id : crypto.randomUUID(),
    name: typeof l?.name === 'string' ? l.name : '',
    proficiency: typeof l?.proficiency === 'string' ? l.proficiency : '',
  }));

  const projects = ensureArray(importedData.projects).map((p: any) => ({
    id: typeof p?.id === 'string' ? p.id : crypto.randomUUID(),
    name: typeof p?.name === 'string' ? p.name : '',
    description: typeof p?.description === 'string' ? p.description : '',
    technologies: Array.isArray(p?.technologies) ? p.technologies.map((t: any) => typeof t === 'string' ? t : '') : [''],
    link: typeof p?.link === 'string' ? p.link : '',
    startDate: typeof p?.startDate === 'string' ? p.startDate : '',
    endDate: typeof p?.endDate === 'string' ? p.endDate : '',
    date: typeof p?.date === 'string' ? p.date : '',
  }));

  const awards = ensureArray(importedData.awards).map((a: any) => ({
    id: typeof a?.id === 'string' ? a.id : crypto.randomUUID(),
    title: typeof a?.title === 'string' ? a.title : '',
    awarder: typeof a?.awarder === 'string' ? a.awarder : '',
    date: typeof a?.date === 'string' ? a.date : '',
    description: typeof a?.description === 'string' ? a.description : '',
  }));

  const certifications = ensureArray(importedData.certifications).map((c: any) => ({
    id: typeof c?.id === 'string' ? c.id : crypto.randomUUID(),
    title: typeof c?.title === 'string' ? c.title : '',
    issuer: typeof c?.issuer === 'string' ? c.issuer : '',
    date: typeof c?.date === 'string' ? c.date : '',
    description: typeof c?.description === 'string' ? c.description : '',
  }));

  const interests = ensureArray(importedData.interests).map((i: any) => ({
    id: typeof i?.id === 'string' ? i.id : crypto.randomUUID(),
    name: typeof i?.name === 'string' ? i.name : '',
    keywords: Array.isArray(i?.keywords) ? i.keywords.map((k: any) => typeof k === 'string' ? k : '') : [''],
  }));

  const publications = ensureArray(importedData.publications).map((p: any) => ({
    id: typeof p?.id === 'string' ? p.id : crypto.randomUUID(),
    title: typeof p?.title === 'string' ? p.title : '',
    publisher: typeof p?.publisher === 'string' ? p.publisher : '',
    date: typeof p?.date === 'string' ? p.date : '',
    description: typeof p?.description === 'string' ? p.description : '',
  }));

  const references = ensureArray(importedData.references).map((r: any) => ({
    id: typeof r?.id === 'string' ? r.id : crypto.randomUUID(),
    name: typeof r?.name === 'string' ? r.name : '',
    position: typeof r?.position === 'string' ? r.position : '',
    phone: typeof r?.phone === 'string' ? r.phone : '',
    description: typeof r?.description === 'string' ? r.description : '',
  }));

  const volunteer = ensureArray(importedData.volunteer).map((v: any) => ({
    id: typeof v?.id === 'string' ? v.id : crypto.randomUUID(),
    organization: typeof v?.organization === 'string' ? v.organization : '',
    location: typeof v?.location === 'string' ? v.location : '',
    period: typeof v?.period === 'string' ? v.period : '',
    description: typeof v?.description === 'string' ? v.description : '',
  }));

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
  };
}
