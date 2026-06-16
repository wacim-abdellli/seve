import { pipeline, env } from '@xenova/transformers'

// Configure environment for browser workers
env.allowLocalModels = false // Fetch from Hugging Face CDN and cache locally in browser Cache API

let extractor: any = null

// Dot product of two vectors
function dotProduct(a: number[], b: number[]): number {
  let sum = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i]
  }
  return sum
}

// Magnitude of a vector
function magnitude(a: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * a[i]
  }
  return Math.sqrt(sum)
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a)
  const magB = magnitude(b)
  if (magA === 0 || magB === 0) return 0
  return dotProduct(a, b) / (magA * magB)
}

// Initialize the model
async function initModel() {
  if (extractor) {
    self.postMessage({ type: 'status', status: 'ready' })
    return
  }

  try {
    self.postMessage({ type: 'status', status: 'loading', progress: 0 })
    
    extractor = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small', {
      progress_callback: (data: any) => {
        if (data.status === 'progress') {
          self.postMessage({
            type: 'progress',
            status: 'downloading',
            progress: data.progress,
            file: data.file
          })
        }
      }
    })

    self.postMessage({ type: 'status', status: 'ready' })
  } catch (error: any) {
    self.postMessage({ type: 'error', error: error.message || 'Failed to initialize AI model' })
  }
}

// Handle embedding generation and comparison
async function compareText(resumeText: string, jobDescription: string) {
  if (!extractor) {
    await initModel()
  }

  try {
    self.postMessage({ type: 'status', status: 'computing' })

    // E5 models perform best when prefixed with "query: " or "passage: "
    const queryText = `query: ${jobDescription.trim()}`
    const passageText = `passage: ${resumeText.trim()}`

    // Compute embeddings
    const queryOutput = await extractor(queryText, { pooling: 'mean', normalize: true })
    const passageOutput = await extractor(passageText, { pooling: 'mean', normalize: true })

    const queryVector = Array.from(queryOutput.data) as number[]
    const passageVector = Array.from(passageOutput.data) as number[]

    // Calculate similarity
    const score = cosineSimilarity(queryVector, passageVector)

    // Map score (-1 to 1) to percentage (0 to 100)
    // Cosine similarity for normalized embeddings usually falls in 0.3 - 0.9 range
    // Let's calibrate it so that a reasonable match is spread out nicely
    let percentage = 0
    if (score > 0) {
      // E.g., if score is 0.70, it's a good match. Let's scale it.
      // We map the range [0.5, 0.88] to [40, 100]
      const minVal = 0.50
      const maxVal = 0.88
      const clamped = Math.max(minVal, Math.min(score, maxVal))
      percentage = Math.round(((clamped - minVal) / (maxVal - minVal)) * 60 + 40)
    } else {
      percentage = 0
    }

    self.postMessage({
      type: 'result',
      score: percentage,
      rawScore: score
    })
  } catch (error: any) {
    self.postMessage({ type: 'error', error: error.message || 'Failed to calculate semantic score' })
  }
}

// Listen for messages from the main thread
self.onmessage = async (event: MessageEvent) => {
  const { type, resumeText, jobDescription } = event.data

  if (type === 'init') {
    await initModel()
  } else if (type === 'compare') {
    await compareText(resumeText, jobDescription)
  }
}
