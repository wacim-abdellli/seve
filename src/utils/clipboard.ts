/**
 * Robust clipboard copy helper that works in both secure (HTTPS/localhost)
 * and unsecure environments, with mobile and fallback support.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try standard navigator.clipboard API if available
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to fallback method on security/permission failures
    }
  }

  // 2. Fallback method using a temporary textarea
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed' // Avoid scrolling page
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}
