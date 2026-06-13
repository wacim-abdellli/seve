import type { ResumeData } from '../../types/resume'

interface ModernTemplateProps {
  data: ResumeData
}

export default function ModernTemplate({ data }: ModernTemplateProps) {
  const { contact, summary, experience, education, skills, projects } = data

  return (
    <div className="font-sans text-[10.5pt] leading-normal text-slate-800 p-4 select-text">
      {/* Contact Header */}
      <div className="mb-6 relative pb-4 border-b-2 border-indigo-500">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
          {contact.fullName || 'YOUR NAME'}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-600 font-medium">
          {contact.location && <span>📍 {contact.location}</span>}
          {contact.email && <span>✉️ {contact.email}</span>}
          {contact.phone && <span>📞 {contact.phone}</span>}
          {contact.linkedin && <span>🔗 {contact.linkedin}</span>}
          {contact.website && <span>🌐 {contact.website}</span>}
        </div>
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-5 bg-indigo-500 rounded-sm" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Professional Summary
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-justify text-slate-700">{summary}</p>
        </div>
      )}

      {/* Experience Section */}
      {experience && experience.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 bg-indigo-500 rounded-sm" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Work Experience
            </h2>
          </div>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <div className="text-xs font-extrabold text-slate-900">
                    {exp.jobTitle} <span className="text-indigo-600 font-medium">@ {exp.company}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[10px] text-slate-500 font-semibold">{exp.location}</div>
                )}
                <ul className="list-disc list-inside pl-1 space-y-1 text-slate-700">
                  {exp.bullets.filter(b => b.trim() !== '').map((bullet, idx) => (
                    <li key={idx} className="text-xs leading-relaxed text-justify list-item">
                      <span className="pl-1 text-slate-600">{bullet}</span>
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 bg-indigo-500 rounded-sm" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Projects
            </h2>
          </div>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <div className="text-xs font-bold text-slate-900">
                    {proj.name} {proj.link && <span className="text-[10px] text-slate-500">({proj.link})</span>}
                  </div>
                  <div className="text-[10px] font-semibold text-indigo-500">
                    {proj.technologies.join(' | ')}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 text-justify">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {education && education.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 bg-indigo-500 rounded-sm" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Education
            </h2>
          </div>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-slate-900">{edu.school}</span>
                  <span className="text-xs text-slate-500"> — {edu.degree}</span>
                  {edu.gpa && <span className="text-xs font-semibold text-slate-500"> (GPA: {edu.gpa})</span>}
                </div>
                <div className="text-[10px] font-bold text-slate-500">{edu.graduationDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-5 bg-indigo-500 rounded-sm" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Skills
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded border border-slate-200 font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
