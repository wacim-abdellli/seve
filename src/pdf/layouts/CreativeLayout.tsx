import { Page, View } from '@react-pdf/renderer'
import type { ResumeData } from '../../types/resume'
import {
  PdfAccentBarHeading,
  PdfBulletList,
  PdfContactDotRow,
  PdfSkillPillGrid,
  PdfText,
  PdfTwoColumnRow,
} from '../components'
import {
  boldStyle,
  filterResumeData,
  getInitials,
  hexToRgba,
  italicStyle,
  stripLinkedIn,
  stripWebsite,
  t,
  type SectionId,
  type TemplateTheme,
} from '../shared'

export function CreativePdfLayout({
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
      <View style={{ marginBottom: t(15, scale) }}>
        <PdfAccentBarHeading title="Summary" scale={scale} theme={theme} fontFamily={ff} variant="creative" />
        <PdfText style={{ fontSize: t(9.5, scale), lineHeight: 1.4, color: theme.textColor, fontFamily: ff }}>{data.summary}</PdfText>
      </View>
    ) : null,
    experience:
      experience.length > 0 ? (
        <View style={{ marginBottom: t(15, scale) }}>
          <PdfAccentBarHeading title="Experience" scale={scale} theme={theme} fontFamily={ff} variant="creative" />
          {experience.map((exp) => (
            <View key={exp.id} style={{ marginBottom: t(8, scale) }}>
              <PdfTwoColumnRow
                scale={scale}
                left={
                  <PdfText style={{ fontSize: t(9.5, scale), ...bold, color: theme.headingColor, fontFamily: ff }}>
                    {exp.jobTitle} — <PdfText style={{ color: theme.primaryColor, ...bold }}>{exp.company}</PdfText>
                  </PdfText>
                }
                right={
                  <PdfText style={{ fontSize: t(9, scale), color: theme.mutedColor, ...bold, fontFamily: ff }}>
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
        <View style={{ marginBottom: t(15, scale) }}>
          <PdfAccentBarHeading title="Projects" scale={scale} theme={theme} fontFamily={ff} variant="creative" />
          {projects.map((proj) => (
            <View key={proj.id} style={{ marginBottom: t(8, scale) }}>
              <PdfTwoColumnRow
                scale={scale}
                left={
                  <PdfText style={{ fontSize: t(9.5, scale), ...bold, color: theme.headingColor, fontFamily: ff }}>
                    {proj.name}
                    {proj.link ? ` (${proj.link})` : ''}
                  </PdfText>
                }
                right={
                  proj.technologies?.length ? (
                    <PdfText style={{ fontSize: t(8, scale), ...bold, color: theme.primaryColor, fontFamily: ff }}>
                      {proj.technologies.join(' · ')}
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
        <View style={{ marginBottom: t(15, scale) }}>
          <PdfAccentBarHeading title="Education" scale={scale} theme={theme} fontFamily={ff} variant="creative" />
          {education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: t(8, scale) }}>
              <PdfTwoColumnRow
                scale={scale}
                left={<PdfText style={{ fontSize: t(9.5, scale), ...bold, color: theme.headingColor, fontFamily: ff }}>{edu.school}</PdfText>}
                right={
                  <PdfText style={{ fontSize: t(8, scale), ...bold, color: theme.primaryColor, fontFamily: ff }}>{edu.graduationDate}</PdfText>
                }
              />
              <PdfText style={{ fontSize: t(9, scale), color: theme.mutedColor, marginTop: t(1, scale), ...italic, fontFamily: ff }}>
                {edu.degree}
                {edu.location ? ` · ${edu.location}` : ''}
                {edu.gpa && parseFloat(edu.gpa) >= 3.5 ? ` · GPA: ${edu.gpa}` : ''}
              </PdfText>
            </View>
          ))}
        </View>
      ) : null,
  }

  const rightSectionOrder = sectionOrder.filter((sectionId) => sectionId !== 'skills')

  return (
    <Page size="A4" style={{ padding: 0, fontSize: t(9.5, scale), fontFamily: ff }}>
      <View style={{ flexDirection: 'row', minHeight: '100%' }}>
        <View
          style={{
            width: sidebarWidth,
            backgroundColor: hexToRgba(theme.primaryColor, 0.05),
            borderRightWidth: 1,
            borderRightColor: hexToRgba(theme.primaryColor, 0.15),
            padding: t(24, scale),
            paddingTop: t(24, scale),
          }}
        >
          <View
            style={{
              width: t(42, scale),
              height: t(42, scale),
              borderRadius: t(21, scale),
              backgroundColor: theme.primaryColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: t(12, scale),
            }}
          >
            <PdfText style={{ fontSize: t(14, scale), ...bold, color: '#ffffff' }}>{getInitials(data.contact.fullName || '')}</PdfText>
          </View>

          <PdfText wrap={false} style={{ fontSize: t(11, scale), ...bold, color: theme.headingColor, lineHeight: 1.2, fontFamily: ff }}>
            {data.contact.fullName || 'YOUR NAME'}
          </PdfText>
          <PdfText
            style={{
              fontSize: t(6, scale),
              ...bold,
              color: theme.primaryColor,
              textTransform: 'uppercase',
              marginTop: t(4, scale),
              marginBottom: t(16, scale),
            }}
          >
            Candidate Profile
          </PdfText>

          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: hexToRgba(theme.primaryColor, 0.12),
              paddingBottom: t(4, scale),
              marginBottom: t(8, scale),
            }}
          >
            <PdfText style={{ fontSize: t(9, scale), ...bold, color: theme.headingColor, textTransform: 'uppercase' }}>Info</PdfText>
          </View>

          {data.contact.email && <PdfContactDotRow label="Email" value={data.contact.email} scale={scale} theme={theme} fontFamily={ff} />}
          {data.contact.phone && <PdfContactDotRow label="Phone" value={data.contact.phone} scale={scale} theme={theme} fontFamily={ff} />}
          {data.contact.location && <PdfContactDotRow label="Location" value={data.contact.location} scale={scale} theme={theme} fontFamily={ff} />}
          {data.contact.linkedin && (
            <PdfContactDotRow label="LinkedIn" value={stripLinkedIn(data.contact.linkedin)} scale={scale} theme={theme} fontFamily={ff} />
          )}
          {data.contact.website && (
            <PdfContactDotRow label="Website" value={stripWebsite(data.contact.website)} scale={scale} theme={theme} fontFamily={ff} />
          )}

          {skills.length > 0 ? (
            <View style={{ marginTop: t(16, scale) }}>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: hexToRgba(theme.primaryColor, 0.12),
                  paddingBottom: t(4, scale),
                  marginBottom: t(8, scale),
                }}
              >
                <PdfText style={{ fontSize: t(9, scale), ...bold, color: theme.headingColor, textTransform: 'uppercase' }}>Skills</PdfText>
              </View>
              <PdfSkillPillGrid skills={skills} scale={scale} fontFamily={ff} accentColor={theme.primaryColor} />
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, padding: t(30, scale), paddingTop: t(30, scale), backgroundColor: '#ffffff' }}>
          {rightSectionOrder.map((sectionId) => {
            const section = rightSectionsMap[sectionId]
            return section ? <View key={sectionId}>{section}</View> : null
          })}
        </View>
      </View>
    </Page>
  )
}
