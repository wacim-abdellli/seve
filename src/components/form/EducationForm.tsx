import type { Education } from '../../types/resume'

interface EducationFormProps {
  education: Education[]
  onChange: (updated: Education[]) => void
}

export default function EducationForm({ education, onChange }: EducationFormProps) {
  const handleAdd = () => {
    const newEntry: Education = {
      id: crypto.randomUUID(),
      degree: '',
      school: '',
      location: '',
      graduationDate: '',
      gpa: '',
    }
    onChange([...education, newEntry])
  }

  const handleRemove = (id: string) => {
    onChange(education.filter((edu) => edu.id !== id))
  }

  const handleChange = (id: string, field: keyof Education, value: string) => {
    onChange(
      education.map((edu) => {
        if (edu.id === id) {
          return { ...edu, [field]: value }
        }
        return edu
      })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <h3 className="text-lg font-medium text-white">Education</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs transition-all font-medium"
        >
          + Add Education
        </button>
      </div>

      {education.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No education history added yet. Add school details.</p>
      ) : (
        <div className="space-y-6">
          {education.map((edu) => {
            const gpaValue = parseFloat(edu.gpa || '')
            const showGpaWarning = !isNaN(gpaValue) && gpaValue < 3.5

            return (
              <div key={edu.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-4 shadow-sm relative">
                <button
                  type="button"
                  onClick={() => handleRemove(edu.id)}
                  className="absolute top-4 right-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 w-7 h-7 rounded flex items-center justify-center text-xs no-print"
                >
                  ✕
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Degree / Course *</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleChange(edu.id, 'degree', e.target.value)}
                      placeholder="B.S. in Computer Science"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">School / University *</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => handleChange(edu.id, 'school', e.target.value)}
                      placeholder="Stanford University"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Location</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) => handleChange(edu.id, 'location', e.target.value)}
                      placeholder="Stanford, CA"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Graduation *</label>
                      <input
                        type="text"
                        value={edu.graduationDate}
                        onChange={(e) => handleChange(edu.id, 'graduationDate', e.target.value)}
                        placeholder="06/2021"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">GPA (Optional)</label>
                      <input
                        type="text"
                        value={edu.gpa || ''}
                        onChange={(e) => handleChange(edu.id, 'gpa', e.target.value)}
                        placeholder="3.8"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {showGpaWarning && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-2.5 rounded-lg text-xs leading-relaxed">
                    ⚠️ <strong>GPA Recommendation:</strong> ATS rules advise only displaying a GPA of 3.5 or above on entry-level/recent-grad resumes. Consider omitting if it doesn't meet this threshold.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
