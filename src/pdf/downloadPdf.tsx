import { pdf } from '@react-pdf/renderer'
import type { ResumeData, Template } from '../types/resume'
import { ResumePdfDocument, type SectionId } from './ResumePdfDocument'
import { ensurePdfFontsReady } from './registerFonts'

export async function downloadResumePdf(
  data: ResumeData,
  template: Template,
  fontSize: number = 10,
  sectionOrder?: SectionId[],
  themeColor?: string,
) {
  await ensurePdfFontsReady()

  const doc = (
    <ResumePdfDocument
      data={data}
      template={template}
      fontSize={fontSize}
      sectionOrder={sectionOrder}
      themeColor={themeColor}
    />
  )

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const fileName = (data.contact.fullName || 'Resume').trim().replace(/\s+/g, '_')
  link.download = `${fileName}_Resume.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
