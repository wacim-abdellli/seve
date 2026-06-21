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

  // 4. Append to DOM (must happen before resolveVars so getComputedStyle sees stylesheet rules)
  container.appendChild(clone)
  document.body.appendChild(container)

  // 5. Resolve CSS custom property references into direct inline styles
  //    (html2canvas may not resolve var() references, so we bake computed values)
  const resolveVars = (root: HTMLElement) => {
    const pages = root.querySelectorAll('.resume-page')
    pages.forEach(el => {
      const pageEl = el as HTMLElement
      const style = getComputedStyle(pageEl)
      pageEl.style.setProperty('font-family', style.fontFamily, 'important')
      pageEl.style.setProperty('line-height', style.lineHeight, 'important')
      pageEl.style.setProperty('letter-spacing', style.letterSpacing, 'important')
      pageEl.style.setProperty('color', style.color, 'important')
      pageEl.style.setProperty('padding', style.padding, 'important')
    })
    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headings.forEach(el => {
      const hEl = el as HTMLElement
      const style = getComputedStyle(hEl)
      hEl.style.setProperty('font-family', style.fontFamily, 'important')
      hEl.style.setProperty('color', style.color, 'important')
      hEl.style.setProperty('text-transform', style.textTransform, 'important')
    })
    root.querySelectorAll('.resume-section + .resume-section').forEach(el => {
      const secEl = el as HTMLElement
      const style = getComputedStyle(secEl)
      secEl.style.setProperty('margin-top', style.marginTop, 'important')
    })
    root.querySelectorAll('ul, ol').forEach(el => {
      const listEl = el as HTMLElement
      const style = getComputedStyle(listEl)
      listEl.style.setProperty('padding-left', style.paddingLeft, 'important')
    })
    root.querySelectorAll('li').forEach(el => {
      const liEl = el as HTMLElement
      const style = getComputedStyle(liEl)
      liEl.style.setProperty('margin-top', style.marginTop, 'important')
    })
    root.querySelectorAll('hr, .resume-divider').forEach(el => {
      const dividerEl = el as HTMLElement
      const style = getComputedStyle(dividerEl)
      dividerEl.style.setProperty('border-top', style.borderTop, 'important')
    })
  }
  resolveVars(clone)

  // 6. Configure html2pdf options
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
    // 8. Generate PDF from the offscreen clone
    await html2pdf().set(opt).from(clone).save()
  } finally {
    // 9. Clean up the offscreen container from the DOM
    document.body.removeChild(container)
  }
}
