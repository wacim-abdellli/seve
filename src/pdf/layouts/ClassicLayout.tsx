import { Page, View } from '@react-pdf/renderer'
import type { ResumeData } from '../../types/resume'
import { PdfAccentBarHeading, PdfBulletList, PdfText, PdfTwoColumnRow } from '../components'
import { boldStyle, filterResumeData, italicStyle, parseSkill, t, type SectionId, type TemplateTheme } from '../shared'

export function ClassicPdfLayout({
  data,
  theme,
  scale,
  sectionOrder,
}: {
  data: ResumeData
  theme: TemplateTheme
  scale: number
  sectionOrder: SectionId[]
}) {
  const ff = theme.fontFamily
  const bold = boldStyle(ff)
  const italic = italicStyle(ff)
  const { experience, education, projects, skills } = filterResumeData(data)

  const sectionsMap: Record<string, React.ReactNode> = {
    summary: data.summary?.trim() ? (
      <View style={{ marginBottom: t(10, scale) }}>
        <PdfAccentBarHeading title="Professional Summary" scale={scale} theme={theme} fontFamily={ff} variant="classic" />
        <PdfText style={{ fontSize: t(9.5, scale), lineHeight: 1.4, color: theme.textColor, fontFamily: ff }}>{data.summary}</PdfText>
      </View>
    ) : null,
    experience:
      experience.length > 0 ? (
        <View style={{ marginBottom: t(10, scale) }}>
          <PdfAccentBarHeading title="Work History" scale={scale} theme={theme} fontFamily={ff} variant="classic" />
          {experience.map((exp) => (
            <View key={exp.id} style={{ marginBottom: t(8, scale) }}>
              <PdfTwoColumnRow
                scale={scale}
                left={
                  <PdfText style={{ fontSize: t(10.5, scale), ...bold, color: theme.headingColor, fontFamily: ff }}>
                    {exp.jobTitle} — <PdfText style={{ fontFamily: ff, fontWeight: 400, color: '#475569' }}>{exp.company}</PdfText>
                  </PdfText>
                }
                right={
                  <PdfText style={{ fontSize: t(9.5, scale), color: theme.mutedColor, ...italic, fontFamily: ff }}>
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </PdfText>
                }
              />
              {exp.location ? (
                <PdfText style={{ fontSize: t(8.5, scale), color: theme.mutedColor, ...italic, fontFamily: ff, marginTop: t(1, scale) }}>
                  {exp.location}
                </PdfText>
              ) : null}
              <PdfBulletList bullets={exp.bullets} scale={scale} theme={theme} fontFamily={ff} />
            </View>
          ))}
        </View>
      ) : null,
    projects:
      projects.length > 0 ? (
        <View style={{ marginBottom: t(10, scale) }}>
          <PdfAccentBarHeading title="Key Projects" scale={scale} theme={theme} fontFamily={ff} variant="classic" />
          {projects.map((proj) => (
            <View key={proj.id} style={{ marginBottom: t(8, scale) }}>
              <PdfTwoColumnRow
                scale={scale}
                left={
                  <PdfText style={{ fontSize: t(10.5, scale), ...bold, color: theme.headingColor, fontFamily: ff }}>
                    {proj.name}
                    {proj.link ? ` (${proj.link})` : ''}
                  </PdfText>
                }
                right={
                  proj.technologies?.length ? (
                    <PdfText style={{ fontSize: t(9, scale), ...bold, color: theme.mutedColor, fontFamily: ff }}>
                      {proj.technologies.join(', ')}
                    </PdfText>
                  ) : undefined
                }
              />
              <PdfText style={{ marginTop: t(2, scale), fontSize: t(9.5, scale), lineHeight: 1.35, color: theme.textColor, fontFamily: ff }}>
                {proj.description}
              </PdfText>
            </View>
          ))}
        </View>
      ) : null,
    education:
      education.length > 0 ? (
        <View style={{ marginBottom: t(10, scale) }}>
          <PdfAccentBarHeading title="Academic Credentials" scale={scale} theme={theme} fontFamily={ff} variant="classic" />
          {education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: t(8, scale) }}>
              <PdfTwoColumnRow
                scale={scale}
                left={<PdfText style={{ fontSize: t(10.5, scale), ...bold, color: theme.headingColor, fontFamily: ff }}>{edu.school}</PdfText>}
                right={
                  <PdfText style={{ fontSize: t(9.5, scale), color: theme.mutedColor, ...bold, fontFamily: ff }}>{edu.graduationDate}</PdfText>
                }
              />
              <PdfText style={{ fontSize: t(10, scale), color: '#475569', marginTop: t(1, scale), fontFamily: ff }}>
                {edu.degree}
                {edu.location ? ` · ${edu.location}` : ''}
                {edu.gpa && parseFloat(edu.gpa) >= 3.5 ? ` · GPA: ${edu.gpa}` : ''}
              </PdfText>
            </View>
          ))}
        </View>
      ) : null,
    skills:
      skills.length > 0 ? (
        <View style={{ marginBottom: t(10, scale) }}>
          <PdfAccentBarHeading title="Skills & Core Competencies" scale={scale} theme={theme} fontFamily={ff} variant="classic" />
          <PdfText style={{ fontSize: t(9.5, scale), lineHeight: 1.35, color: theme.textColor, fontFamily: ff }}>
            {skills.map((skill, index) => {
              const parsed = parseSkill(skill)
              return (
                <PdfText key={skill}>
                  {index > 0 ? ' · ' : ''}
                  {parsed.hasCategory ? (
                    <>
                      <PdfText style={bold}>{parsed.category}:</PdfText>
                      {parsed.value}
                    </>
                  ) : (
                    skill
                  )}
                </PdfText>
              )
            })}
          </PdfText>
        </View>
      ) : null,
  }

  return (
    <Page size="A4" style={{ padding: t(40, scale), fontSize: t(10, scale), color: theme.textColor, fontFamily: ff }}>
      <View style={{ alignItems: 'center', marginBottom: t(15, scale) }}>
        <PdfText wrap={false} style={{ fontSize: t(24, scale), ...bold, color: theme.headingColor, textTransform: 'uppercase', fontFamily: ff }}>
          {data.contact.fullName || 'YOUR NAME'}
        </PdfText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: t(6, scale) }}>
          {[
            data.contact.location,
            data.contact.email ? `• ${data.contact.email}` : '',
            data.contact.phone ? `• ${data.contact.phone}` : '',
            data.contact.linkedin ? `• ${data.contact.linkedin}` : '',
            data.contact.website ? `• ${data.contact.website}` : '',
          ]
            .filter(Boolean)
            .map((item) => (
              <PdfText key={String(item)} style={{ fontSize: t(10, scale), color: theme.mutedColor, marginHorizontal: t(4, scale), textTransform: 'uppercase' }}>
                {item}
              </PdfText>
            ))}
        </View>
      </View>
      {sectionOrder.map((sectionId) => {
        const section = sectionsMap[sectionId]
        return section ? <View key={sectionId}>{section}</View> : null
      })}
    </Page>
  )
}
