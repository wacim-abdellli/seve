import type { ResumeData } from '../../types/resume'

interface ClassicTemplateProps {
  data: ResumeData
}

export default function ClassicTemplate({ data }: ClassicTemplateProps) {
  const { contact, summary, experience, education, skills, projects } = data

  return (
    <div className="font-serif text-[11pt] leading-normal text-black p-4 select-text">
      {/* Contact Header */}
      <div className="text-center mb-5">
        <h1 className="text-2xl font-bold font-serif uppercase tracking-wide mb-1">
          {contact.fullName || 'YOUR NAME'}
        </h1>
        <div className="text-xs text-slate-700 space-x-1.5">
          {contact.location && <span>{contact.location}</span>}
          {contact.email && <span>• {contact.email}</span>}
          {contact.phone && <span>• {contact.phone}</span>}
          {contact.linkedin && <span>• {contact.linkedin}</span>}
          {contact.website && <span>• {contact.website}</span>}
        </div>
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 font-serif">
            Professional Summary
          </h2>
          <p className="text-xs leading-relaxed text-justify">{summary}</p>
        </div>
      )}

      {/* Experience Section */}
      {experience && experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2 font-serif">
            Work Experience
          </h2>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="text-xs font-bold">
                    {exp.jobTitle} — <span className="font-medium italic">{exp.company}</span>
                  </div>
                  <div className="text-[10px] italic text-slate-700">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>
                {exp.location && (
                  <div className="text-[10px] text-slate-600 mb-1 italic">{exp.location}</div>
                )}
                <ul className="list-disc list-inside pl-2 space-y-1">
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
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2 font-serif">
            Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="text-xs font-bold">
                    {proj.name} {proj.link && <span className="font-normal text-[10px] text-slate-600">({proj.link})</span>}
                  </div>
                  <div className="text-[10px] italic text-slate-600">
                    {proj.technologies.join(', ')}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-justify">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {education && education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2 font-serif">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold">{edu.school}</span> — <span className="text-xs italic">{edu.degree}</span>
                  {edu.gpa && <span className="text-xs text-slate-600"> (GPA: {edu.gpa})</span>}
                </div>
                <div className="text-[10px] italic text-slate-700">{edu.graduationDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 font-serif">
            Skills & Expertise
          </h2>
          <p className="text-xs leading-relaxed">
            <span className="font-bold">Technical Skills:</span> {skills.join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
