import type { ResumeData } from '../../types/resume'

interface ExecutiveTemplateProps {
  data: ResumeData
}

export default function ExecutiveTemplate({ data }: ExecutiveTemplateProps) {
  const { contact, summary, experience, education, skills, projects } = data

  return (
    <div className="font-serif text-[11pt] leading-normal text-slate-900 p-4 select-text">
      {/* Two-Column Contact Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b-4 border-slate-900 pb-4 mb-6 items-end">
        <div>
          <h1 className="text-3xl font-black font-serif tracking-tight text-slate-950 uppercase leading-none">
            {contact.fullName || 'YOUR NAME'}
          </h1>
          <p className="text-[10pt] font-semibold tracking-wider text-slate-500 uppercase mt-1">
            Executive Professional
          </p>
        </div>
        <div className="text-right text-xs text-slate-700 space-y-0.5">
          {contact.location && <div className="font-semibold">{contact.location}</div>}
          <div className="flex justify-end gap-x-2 flex-wrap">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>| {contact.phone}</span>}
          </div>
          <div className="flex justify-end gap-x-2 flex-wrap text-slate-500 italic">
            {contact.linkedin && <span>{contact.linkedin}</span>}
            {contact.website && <span>| {contact.website}</span>}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase text-slate-950 font-serif mb-1">
            Executive Summary
          </h2>
          <div className="w-full h-[1px] bg-slate-400 mb-2" />
          <p className="text-xs leading-relaxed text-justify text-slate-800">{summary}</p>
        </div>
      )}

      {/* Experience Section */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase text-slate-950 font-serif mb-1">
            Professional Experience
          </h2>
          <div className="w-full h-[1px] bg-slate-400 mb-3" />
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="text-xs font-bold text-slate-950 uppercase">
                    {exp.jobTitle} <span className="font-normal capitalize text-slate-600">— {exp.company}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 shrink-0">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[10px] text-slate-500 italic mb-1.5">{exp.location}</div>
                )}
                <ul className="list-disc list-inside pl-2 space-y-1.5 text-slate-800">
                  {exp.bullets.filter(b => b.trim() !== '').map((bullet, idx) => (
                    <li key={idx} className="text-xs leading-relaxed text-justify list-item">
                      <span className="pl-1">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase text-slate-950 font-serif mb-1">
            Key Initiatives & Projects
          </h2>
          <div className="w-full h-[1px] bg-slate-400 mb-3" />
          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <div className="text-xs font-bold text-slate-950 uppercase">
                    {proj.name}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">
                    {proj.technologies.join(', ')}
                  </div>
                </div>
                {proj.link && (
                  <div className="text-[9px] text-slate-500 font-mono italic">{proj.link}</div>
                )}
                <p className="text-xs leading-relaxed text-slate-800 text-justify">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {education && education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase text-slate-950 font-serif mb-1">
            Education & Credentials
          </h2>
          <div className="w-full h-[1px] bg-slate-400 mb-3" />
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-slate-950 uppercase">{edu.school}</span>
                  <span className="text-xs text-slate-700"> — {edu.degree}</span>
                  {edu.gpa && <span className="text-xs text-slate-600"> (GPA: {edu.gpa})</span>}
                </div>
                <div className="text-xs font-bold text-slate-800">{edu.graduationDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <div className="mb-3">
          <h2 className="text-sm font-extrabold uppercase text-slate-950 font-serif mb-1">
            Core Competencies
          </h2>
          <div className="w-full h-[1px] bg-slate-400 mb-2" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {skills.map((skill) => (
              <div key={skill} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                <span className="text-xs text-slate-800">{skill}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
