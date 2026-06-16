import { Page, View } from '@react-pdf/renderer'
import type { ResumeData } from '../../types/resume'
import { PdfAccentBarHeading, PdfBulletList, PdfSkillPillGrid, PdfText, PdfTwoColumnRow } from '../components'
import { boldStyle, filterResumeData, italicStyle, stripLinkedIn, stripWebsite, t, type SectionId, type TemplateTheme } from '../shared'

export function ExecutivePdfLayout({
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
  const sidebarWidth = t(165, scale)

  const rightSectionsMap: Record<string, React.ReactNode> = {
    summary: data.summary?.trim() ? (
      <View style={{ marginBottom: t(12, scale) }}>
        <PdfAccentBarHeading title="Executive Summary" scale={scale} theme={theme} fontFamily={ff} variant="executive" />
        <PdfText style={{ fontSize: t(9.5, scale), lineHeight: 1.4, color: theme.textColor, fontFamily: ff }}>{data.summary}</PdfText>
      </View>
    ) : null,
    experience:
      experience.length > 0 ? (
        <View style={{ marginBottom: t(12, scale) }}>
          <PdfAccentBarHeading title="Professional Experience" scale={scale} theme={theme} fontFamily={ff} variant="executive" />
          {experience.map((exp) => (
            <View key={exp.id} style={{ marginBottom: t(8, scale) }}>
              <PdfTwoColumnRow
                scale={scale}
                left={
                  <PdfText style={{ fontSize: t(10.5, scale), ...bold, color: theme.headingColor, fontFamily: ff }}>
                    {exp.jobTitle} <PdfText style={{ fontFamily: ff, fontWeight: 400, color: theme.mutedColor }}>— {exp.company}</PdfText>
                  </PdfText>
                }
                right={
                  <PdfText style={{ fontSize: t(9.5, scale), color: '#475569', ...bold, fontFamily: ff }}>
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </PdfText>
                }
              />
              {exp.location ? (
                <PdfText style={{ fontSize: t(9, scale), color: '#94a3b8', ...italic, fontFamily: ff, marginTop: t(1, scale) }}>
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
        <View style={{ marginBottom: t(12, scale) }}>
          <PdfAccentBarHeading title="Key Initiatives" scale={scale} theme={theme} fontFamily={ff} variant="executive" />
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
                    <PdfText style={{ fontSize: t(9, scale), color: theme.mutedColor, fontFamily: ff }}>{proj.technologies.join(', ')}</PdfText>
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
  }

  const rightSectionOrder = sectionOrder.filter((sectionId) => ['summary', 'experience', 'projects'].includes(sectionId))

  const sidebarField = (label: string, value: string) => (
    <View style={{ marginBottom: t(8, scale) }}>
      <PdfText style={{ ...bold, color: '#94a3b8', fontSize: t(7, scale), textTransform: 'uppercase' }}>{label}</PdfText>
      <PdfText style={{ color: '#e2e8f0', marginTop: t(2, scale), fontSize: t(9, scale), fontFamily: ff }}>{value}</PdfText>
    </View>
  )

  return (
    <Page size="A4" style={{ padding: 0, fontSize: t(9.5, scale), fontFamily: ff }}>
      <View style={{ flexDirection: 'row', minHeight: '100%' }}>
        <View
          style={{
            width: sidebarWidth,
            backgroundColor: '#0f172a',
            padding: t(20, scale),
            paddingTop: t(30, scale),
          }}
        >
          <PdfText wrap={false} style={{ fontSize: t(18, scale), ...bold, color: '#ffffff', lineHeight: 1.2, fontFamily: ff }}>
            {data.contact.fullName || 'YOUR NAME'}
          </PdfText>
          <View
            style={{
              width: t(36, scale),
              height: t(2, scale),
              backgroundColor: theme.primaryColor,
              marginTop: t(8, scale),
              marginBottom: t(16, scale),
            }}
          />
          {data.contact.location && sidebarField('Location', data.contact.location)}
          {data.contact.email && sidebarField('Email', data.contact.email)}
          {data.contact.phone && sidebarField('Phone', data.contact.phone)}
          {data.contact.linkedin && sidebarField('LinkedIn', stripLinkedIn(data.contact.linkedin))}
          {data.contact.website && sidebarField('Website', stripWebsite(data.contact.website))}

          {education.length > 0 ? (
            <View style={{ marginTop: t(20, scale), paddingTop: t(12, scale), borderTopWidth: 1, borderTopColor: '#1e293b' }}>
              <PdfText style={{ fontSize: t(10, scale), ...bold, color: '#94a3b8', textTransform: 'uppercase', marginBottom: t(10, scale) }}>
                Education
              </PdfText>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: t(10, scale) }}>
                  <PdfTwoColumnRow
                    scale={scale}
                    leftWidth="68%"
                    rightWidth="32%"
                    left={
                      <PdfText style={{ ...bold, color: '#ffffff', fontSize: t(9, scale), fontFamily: ff }}>{edu.school}</PdfText>
                    }
                    right={
                      <PdfText style={{ fontSize: t(8, scale), ...bold, color: theme.primaryColor, fontFamily: ff }}>{edu.graduationDate}</PdfText>
                    }
                  />
                  <PdfText style={{ color: '#cbd5e1', fontSize: t(8.5, scale), marginTop: t(2, scale), ...italic, fontFamily: ff }}>
                    {edu.degree}
                    {edu.location ? ` · ${edu.location}` : ''}
                  </PdfText>
                </View>
              ))}
            </View>
          ) : null}

          {skills.length > 0 ? (
            <View style={{ marginTop: t(20, scale), paddingTop: t(12, scale), borderTopWidth: 1, borderTopColor: '#1e293b' }}>
              <PdfText style={{ fontSize: t(10, scale), ...bold, color: '#94a3b8', textTransform: 'uppercase', marginBottom: t(10, scale) }}>
                Competencies
              </PdfText>
              <PdfSkillPillGrid skills={skills} scale={scale} fontFamily={ff} accentColor={theme.primaryColor} darkMode />
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, padding: t(25, scale), paddingTop: t(30, scale), backgroundColor: '#ffffff' }}>
          {rightSectionOrder.map((sectionId) => {
            const section = rightSectionsMap[sectionId]
            return section ? <View key={sectionId}>{section}</View> : null
          })}
        </View>
      </View>
    </Page>
  )
}
