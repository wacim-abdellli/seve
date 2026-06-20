import html2pdf from 'html2pdf.js'

export async function exportResumeToPdf(
  element: HTMLElement,
  filename: string = 'resume.pdf'
): Promise<void> {
  // 1. Store original styles of the live on-screen element
  const originalTransform = element.style.transform
  const originalTransformOrigin = element.style.transformOrigin
  const originalWidth = element.style.width
  const originalMargin = element.style.margin
  const originalPadding = element.style.padding
  const originalPosition = element.style.position
  const originalLeft = element.style.left
  const originalTop = element.style.top
  const originalBackground = element.style.background

  // 2. Temporarily strip viewport zoom scale and force unscaled 100% dimensions (794px)
  element.style.transform = 'none'
  element.style.transformOrigin = 'unset'
  element.style.width = '794px'
  element.style.margin = '0'
  element.style.padding = '0'
  element.style.position = 'relative'
  element.style.left = '0'
  element.style.top = '0'
  element.style.background = '#ffffff'

  // 3. Configure html2pdf options
  const opt = {
    margin: 0,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait' as const,
    },
    pagebreak: {
      mode: ['css'] as string[],
      avoid: ['.resume-section', '.exp-entry', '.edu-entry', '.proj-entry'],
    },
  }

  try {
    // 4. Generate PDF from the live, unscaled element
    await html2pdf().set(opt).from(element).save()
  } finally {
    // 5. Restore original styles back to the live preview
    element.style.transform = originalTransform
    element.style.transformOrigin = originalTransformOrigin
    element.style.width = originalWidth
    element.style.margin = originalMargin
    element.style.padding = originalPadding
    element.style.position = originalPosition
    element.style.left = originalLeft
    element.style.top = originalTop
    element.style.background = originalBackground
  }
}
