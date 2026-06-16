import { Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { boldStyle, hexToRgba, parseSkill, t, type TemplateTheme } from './shared'

type PdfTextProps = {
  children: React.ReactNode
  style?: Style
  wrap?: boolean
}

export function PdfText({ children, style, wrap = true }: PdfTextProps) {
  return (
    <Text wrap={wrap} style={style}>
      {children}
    </Text>
  )
}

export function PdfBulletList({
  bullets,
  scale,
  theme,
  fontFamily,
}: {
  bullets: string[] | undefined
  scale: number
  theme: TemplateTheme
  fontFamily: string
}) {
  return bullets?.map(
    (bullet, index) =>
      bullet?.trim() && (
        <View key={index} style={{ flexDirection: 'row', marginTop: t(3, scale), paddingLeft: t(10, scale) }}>
          <PdfText style={{ width: t(8, scale), fontSize: t(9, scale), color: theme.textColor }}>•</PdfText>
          <PdfText style={{ flex: 1, fontSize: t(9.5, scale), lineHeight: 1.35, color: theme.textColor, fontFamily }}>
            {bullet}
          </PdfText>
        </View>
      ),
  )
}

export function PdfTwoColumnRow({
  left,
  right,
  scale,
  leftWidth = '62%',
  rightWidth = '38%',
}: {
  left: React.ReactNode
  right?: React.ReactNode
  scale: number
  leftWidth?: string
  rightWidth?: string
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: t(1, scale) }}>
      <View style={{ width: leftWidth, paddingRight: t(6, scale) }}>{left}</View>
      {right ? <View style={{ width: rightWidth, alignItems: 'flex-end' }}>{right}</View> : null}
    </View>
  )
}

export function PdfSkillPill({
  skill,
  scale,
  fontFamily,
  accentColor,
  textColor = accentColor,
  bgAlpha = 0.06,
  borderAlpha = 0.2,
  uppercase = true,
  darkMode = false,
}: {
  skill: string
  scale: number
  fontFamily: string
  accentColor: string
  textColor?: string
  bgAlpha?: number
  borderAlpha?: number
  uppercase?: boolean
  darkMode?: boolean
}) {
  const parsed = parseSkill(skill)
  const bg = darkMode ? hexToRgba(accentColor, 0.08) : hexToRgba(accentColor, bgAlpha)
  const border = darkMode ? hexToRgba(accentColor, 0.18) : hexToRgba(accentColor, borderAlpha)

  return (
    <View
      style={{
        backgroundColor: bg,
        borderWidth: 0.5,
        borderColor: border,
        paddingHorizontal: t(6, scale),
        paddingVertical: t(2.5, scale),
        borderRadius: t(3, scale),
        marginRight: t(4, scale),
        marginBottom: t(4, scale),
      }}
    >
      <PdfText
        style={{
          fontSize: t(7, scale),
          color: textColor,
          fontFamily,
          textTransform: uppercase ? 'uppercase' : 'none',
        }}
      >
        {parsed.hasCategory ? (
          <>
            <PdfText style={{ ...boldStyle(fontFamily), color: darkMode ? accentColor : '#0f172a' }}>
              {parsed.category}:
            </PdfText>
            {parsed.value}
          </>
        ) : (
          skill
        )}
      </PdfText>
    </View>
  )
}

export function PdfSkillPillGrid({
  skills,
  scale,
  fontFamily,
  accentColor,
  darkMode = false,
}: {
  skills: string[]
  scale: number
  fontFamily: string
  accentColor: string
  darkMode?: boolean
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {skills.map((skill) => (
        <PdfSkillPill
          key={skill}
          skill={skill}
          scale={scale}
          fontFamily={fontFamily}
          accentColor={accentColor}
          textColor={darkMode ? '#cbd5e1' : accentColor}
          darkMode={darkMode}
        />
      ))}
    </View>
  )
}

export function PdfContactDotRow({
  label,
  value,
  scale,
  theme,
  fontFamily,
}: {
  label: string
  value: string
  scale: number
  theme: TemplateTheme
  fontFamily: string
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: t(5, scale) }}>
      <View
        style={{
          width: t(4, scale),
          height: t(4, scale),
          borderRadius: t(2, scale),
          backgroundColor: theme.primaryColor,
          marginTop: t(2.5, scale),
          marginRight: t(6, scale),
        }}
      />
      <View style={{ flex: 1 }}>
        <PdfText style={{ fontSize: t(6, scale), ...boldStyle(fontFamily), color: theme.primaryColor, textTransform: 'uppercase' }}>
          {label}
        </PdfText>
        <PdfText style={{ fontSize: t(8.5, scale), color: theme.textColor, marginTop: t(1, scale) }}>{value}</PdfText>
      </View>
    </View>
  )
}

export function PdfAccentBarHeading({
  title,
  scale,
  theme,
  fontFamily,
  variant = 'modern',
}: {
  title: string
  scale: number
  theme: TemplateTheme
  fontFamily: string
  variant?: 'modern' | 'classic' | 'minimalist' | 'creative' | 'executive'
}) {
  if (variant === 'modern') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: t(6, scale) }}>
        <View
          style={{
            width: t(4, scale),
            height: t(14, scale),
            backgroundColor: theme.primaryColor,
            marginRight: t(6, scale),
            borderRadius: t(1, scale),
          }}
        />
        <PdfText
          style={{
            fontSize: t(11, scale),
            ...boldStyle(fontFamily),
            color: theme.headingColor,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </PdfText>
      </View>
    )
  }

  if (variant === 'classic') {
    return (
      <View style={{ marginBottom: t(6, scale) }}>
        <PdfText
          style={{
            fontSize: t(10, scale),
            ...boldStyle(fontFamily),
            color: theme.headingColor,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </PdfText>
        <View style={{ borderBottomWidth: 1, borderBottomColor: theme.primaryColor, marginTop: t(2, scale) }} />
      </View>
    )
  }

  if (variant === 'minimalist') {
    return (
      <PdfText
        style={{
          fontSize: t(10, scale),
          ...boldStyle(fontFamily),
          color: theme.headingColor,
          textTransform: 'uppercase',
          borderBottomWidth: 0.5,
          borderBottomColor: theme.primaryColor,
          paddingBottom: t(2, scale),
          marginBottom: t(8, scale),
        }}
      >
        {title}
      </PdfText>
    )
  }

  if (variant === 'creative') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: t(8, scale),
          paddingBottom: t(4, scale),
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
        }}
      >
        <View
          style={{
            width: t(6, scale),
            height: t(6, scale),
            borderRadius: t(3, scale),
            backgroundColor: theme.primaryColor,
            marginRight: t(6, scale),
          }}
        />
        <PdfText
          style={{
            fontSize: t(10, scale),
            ...boldStyle(fontFamily),
            color: theme.headingColor,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </PdfText>
      </View>
    )
  }

  return (
    <PdfText
      style={{
        fontSize: t(11, scale),
        ...boldStyle(fontFamily),
        color: theme.headingColor,
        textTransform: 'uppercase',
        borderBottomWidth: 2,
        borderBottomColor: '#f1f5f9',
        paddingBottom: t(4, scale),
        marginBottom: t(8, scale),
      }}
    >
      {title}
    </PdfText>
  )
}
