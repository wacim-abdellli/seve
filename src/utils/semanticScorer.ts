function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
}

function buildTfIdf(doc: string[], corpus: string[][]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const term of doc) tf.set(term, (tf.get(term) ?? 0) + 1)

  const idf = new Map<string, number>()
  for (const [term] of tf) {
    const docsWithTerm = corpus.filter(d => d.includes(term)).length
    idf.set(term, Math.log((corpus.length + 1) / (docsWithTerm + 1)) + 1)
  }

  const tfidf = new Map<string, number>()
  for (const [term, count] of tf) {
    tfidf.set(term, (count / doc.length) * (idf.get(term) ?? 1))
  }
  return tfidf
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  const allKeys = new Set([...a.keys(), ...b.keys()])
  let dotProduct = 0, normA = 0, normB = 0
  for (const key of allKeys) {
    const va = a.get(key) ?? 0
    const vb = b.get(key) ?? 0
    dotProduct += va * vb
    normA += va * va
    normB += vb * vb
  }
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function computeSemanticRelevance(resumeText: string, jdText: string): number {
  if (!jdText.trim()) return 0
  const resumeTokens = tokenize(resumeText)
  const jdTokens = tokenize(jdText)
  const corpus = [resumeTokens, jdTokens]
  const resumeTfidf = buildTfIdf(resumeTokens, corpus)
  const jdTfidf = buildTfIdf(jdTokens, corpus)
  return Math.round(cosineSimilarity(resumeTfidf, jdTfidf) * 100)
}
