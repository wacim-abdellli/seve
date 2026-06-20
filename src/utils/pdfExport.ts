import html2pdf from 'html2pdf.js'

export async function exportResumeToPdf(
  element: HTMLElement,
  filename: string = 'resume.pdf'
): Promise<void> {
  // 1. Create a container and position it offscreen to avoid screen flicker/zoom
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  container.style.width = '794px'
  container.style.overflow = 'hidden'

  // 2. Clone the live element to capture its exact state
  const clone = element.cloneNode(true) as HTMLElement

  // 3. Strip zoom scale and force 100% relative layout on the clone
  clone.style.transform = 'none'
  clone.style.transformOrigin = 'unset'
  clone.style.width = '794px'
  clone.style.margin = '0'
  clone.style.padding = '0'
  clone.style.position = 'relative'
  clone.style.left = '0'
  clone.style.top = '0'
  clone.style.background = '#ffffff'

  // 4. Append to DOM
  container.appendChild(clone)
  document.body.appendChild(container)

  // 5. Configure html2pdf options
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
    // 6. Generate PDF from the offscreen clone
    await html2pdf().set(opt).from(clone).save()
  } finally {
    // 7. Clean up the offscreen container from the DOM
    document.body.removeChild(container)
  }
}
