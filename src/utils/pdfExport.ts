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

  // Remove all screen-only (no-print) elements from the clone before generating the PDF
  const noPrintElements = clone.querySelectorAll('.no-print')
  noPrintElements.forEach(el => el.remove())

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

  // Force min-height and height to auto on the resume pages inside the clone
  // to prevent standard screen min-height (1123px) + border rounding from exceeding
  // the A4 page limit and triggering an accidental empty second page. Also strip borders/shadows.
  const resumePages = clone.querySelectorAll('.resume-page')
  resumePages.forEach(el => {
    const pageEl = el as HTMLElement
    pageEl.style.setProperty('min-height', 'auto', 'important')
    pageEl.style.setProperty('height', 'auto', 'important')
    pageEl.style.setProperty('border', 'none', 'important')
    pageEl.style.setProperty('border-radius', '0', 'important')
    pageEl.style.setProperty('box-shadow', 'none', 'important')
  })

  // 4. Append to DOM
  container.appendChild(clone)
  document.body.appendChild(container)

  // 5. Configure html2pdf options
  const opt = {
    margin: 0,
    filename,
    image: { type: 'png' as const },
    html2canvas: {
      scale: 4, // 4x resolution for Retina-level crispness
      useCORS: true,
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
