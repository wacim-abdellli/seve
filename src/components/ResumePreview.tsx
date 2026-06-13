import type { ResumeData, Template } from '../types/resume'
import ClassicTemplate from './templates/ClassicTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutiveTemplate from './templates/ExecutiveTemplate'

interface ResumePreviewProps {
  resumeData: ResumeData
  selectedTemplate: Template
}

export default function ResumePreview({ resumeData, selectedTemplate }: ResumePreviewProps) {
  return (
    <div className="flex justify-center print-container">
      {/* Aspect-ratio restricted A4 paper container */}
      <div 
        id="resume-print-area" 
        className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl p-8 rounded-sm select-text border border-slate-200 transition-all duration-300 print:shadow-none print:border-none print:p-0 print:w-full print:min-h-0"
      >
        {selectedTemplate === 'classic' && (
          <ClassicTemplate data={resumeData} />
        )}
        
        {selectedTemplate === 'modern' && (
          <ModernTemplate data={resumeData} />
        )}

        {selectedTemplate === 'executive' && (
          <ExecutiveTemplate data={resumeData} />
        )}
      </div>
    </div>
  )
}
