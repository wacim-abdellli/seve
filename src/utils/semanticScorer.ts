function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
}

export function computeSemanticRelevance(resumeText: string, jdText: string): number {
  if (!jdText.trim()) return 0

  const resumeTokens = new Set(tokenize(resumeText))
  const jdTokens = new Set(tokenize(jdText))

  if (jdTokens.size === 0) return 0

  let intersection = 0
  for (const token of jdTokens) {
    if (resumeTokens.has(token)) intersection++
  }

  return Math.round((intersection / jdTokens.size) * 100)
}
