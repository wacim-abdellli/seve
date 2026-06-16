import { Document } from '@react-pdf/renderer'
import type { ResumeData, Template } from '../types/resume'
import { ClassicPdfLayout } from './layouts/ClassicLayout'
import { CreativePdfLayout } from './layouts/CreativeLayout'
import { ExecutivePdfLayout } from './layouts/ExecutiveLayout'
import { MinimalistPdfLayout } from './layouts/MinimalistLayout'
import { ModernPdfLayout } from './layouts/ModernLayout'
import { registerPdfFonts } from './registerFonts'
import { getTemplateTheme, type SectionId } from './shared'

registerPdfFonts()

export function ResumePdfDocument({
  data,
  template,
  fontSize = 10,
  sectionOrder = ['summary', 'experience', 'projects', 'education', 'skills'],
  themeColor,
}: {
  data: ResumeData
  template: Template
  fontSize?: number
  sectionOrder?: SectionId[]
  themeColor?: string
}) {
  const theme = getTemplateTheme(template, themeColor)
  const scale = fontSize / 10
  const layoutProps = { data, theme, scale, sectionOrder }

  return (
    <Document title={`${data.contact.fullName || 'Resume'}_Resume`}>
      {template === 'classic' && <ClassicPdfLayout {...layoutProps} />}
      {template === 'modern' && <ModernPdfLayout {...layoutProps} />}
      {template === 'executive' && <ExecutivePdfLayout {...layoutProps} />}
      {template === 'minimalist' && <MinimalistPdfLayout {...layoutProps} />}
      {template === 'creative' && <CreativePdfLayout {...layoutProps} />}
      {!['classic', 'modern', 'executive', 'minimalist', 'creative'].includes(template) && <ClassicPdfLayout {...layoutProps} />}
    </Document>
  )
}

export type { SectionId }
