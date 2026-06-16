import { Font } from '@react-pdf/renderer'

let registered = false

export function getFontUrl(filename: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/fonts/${filename}`
  }
  return `/fonts/${filename}`
}

export function registerPdfFonts(): void {
  if (registered) return

  Font.registerHyphenationCallback((word) => [word])

  Font.register({
    family: 'Inter',
    fonts: [
      { src: getFontUrl('Inter-Regular.ttf'), fontWeight: 400 },
      { src: getFontUrl('Inter-Bold.ttf'), fontWeight: 700 },
    ],
  })

  Font.register({
    family: 'EB Garamond',
    fonts: [
      { src: getFontUrl('EBGaramond-Regular.ttf'), fontWeight: 400 },
      { src: getFontUrl('EBGaramond-Bold.ttf'), fontWeight: 700 },
      { src: getFontUrl('EBGaramond-Italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
    ],
  })

  registered = true
}

export async function ensurePdfFontsReady(): Promise<boolean> {
  registerPdfFonts()
  const files = [
    'Inter-Regular.ttf',
    'Inter-Bold.ttf',
    'EBGaramond-Regular.ttf',
    'EBGaramond-Bold.ttf',
    'EBGaramond-Italic.ttf',
  ]
  try {
    await Promise.all(
      files.map((file) =>
        fetch(getFontUrl(file), { method: 'HEAD' }).then((response) => {
          if (!response.ok) throw new Error(file)
        }),
      ),
    )
    return true
  } catch {
    return false
  }
}
