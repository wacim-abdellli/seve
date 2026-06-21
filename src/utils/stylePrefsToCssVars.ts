import type { ResumeStylePreferences } from '../types/resume'

export function stylePrefsToCssVars(prefs: ResumeStylePreferences): React.CSSProperties {
  return {
    '--template-heading-font': prefs.headingFont || 'inherit',
    '--template-body-font': prefs.bodyFont || 'inherit',
    '--template-line-height': String(prefs.lineHeight),
    '--template-letter-spacing': prefs.letterSpacing,
    '--template-heading-case': prefs.headingCase === 'normal' ? 'none' : prefs.headingCase,
    '--template-page-padding': `${prefs.pagePadding}mm`,
    '--template-section-spacing': `${prefs.sectionSpacing}px`,
    '--template-item-spacing': `${prefs.itemSpacing}px`,
    '--template-bullet-indent': `${prefs.bulletIndent}px`,
    '--template-body-color': prefs.bodyTextColor,
    '--template-heading-color': prefs.headingColor,
    '--template-divider-style': prefs.dividerStyle,
    '--template-divider-width': `${prefs.dividerWidth}px`,
    '--template-high-contrast': prefs.highContrastPrint ? '1' : '0',
    '--template-ats-font': prefs.atsOptimizedFont ? '1' : '0',
    '--template-divider-color': prefs.dividerColor === 'theme' ? 'var(--template-theme-color)' : (prefs.dividerColor || 'var(--template-theme-color)'),
    '--template-section-cut-style': prefs.sectionCutStyle || 'none',
    '--template-section-bg-color': prefs.sectionBgColor || '#f8fafc',
    '--template-section-border-color': prefs.sectionBorderColor || '#e2e8f0',
  } as React.CSSProperties
}
