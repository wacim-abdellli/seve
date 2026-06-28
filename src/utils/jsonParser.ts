/**
 * Utility for cleaning and parsing JSON input, designed to handle common issues
 * when copy-pasting from LLMs (e.g. ChatGPT, Claude) like smart quotes, trailing
 * commas, markdown wrappers, and inline comments.
 */

export function cleanJsonString(val: string): string {
  let cleaned = val.trim()

  // 1. Extract JSON from markdown code block if present
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (markdownMatch) {
    cleaned = markdownMatch[1].trim()
  }

  // 2. Replace smart/fancy quotes with straight double/single quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // smart double quotes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // smart single quotes

  // 3. Remove comments (both //... and /*...*/)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')

  // 4. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

  return cleaned
}

export function cleanAndParseJson(val: string): any {
  let cleaned = cleanJsonString(val)

  // Extract content between first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.indexOf('{')
  const firstBracket = cleaned.indexOf('[')
  let startIndex = -1

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket)
  } else if (firstBrace !== -1) {
    startIndex = firstBrace
  } else if (firstBracket !== -1) {
    startIndex = firstBracket
  }

  const lastBrace = cleaned.lastIndexOf('}')
  const lastBracket = cleaned.lastIndexOf(']')
  let endIndex = -1

  if (lastBrace !== -1 && lastBracket !== -1) {
    endIndex = Math.max(lastBrace, lastBracket)
  } else if (lastBrace !== -1) {
    endIndex = lastBrace
  } else if (lastBracket !== -1) {
    endIndex = lastBracket
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    cleaned = cleaned.substring(startIndex, endIndex + 1)
  }

  return JSON.parse(cleaned)
}

/**
 * Extracts and parses all top-level JSON objects or arrays from a raw text string.
 * This is particularly useful when an LLM returns multiple JSON objects (e.g. one after another)
 * instead of wrapping them in an array.
 */
export function extractAllJsonObjects(text: string): any[] {
  const results: any[] = []
  let cleaned = cleanJsonString(text)

  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escapeNext = false
  let startIndex = -1

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    // Toggle string literal tracking
    if (char === '"' || char === "'") {
      inString = !inString
      continue
    }

    // Ignore brackets inside string literals
    if (inString) {
      continue
    }

    if (char === '{' || char === '[') {
      if (braceCount === 0 && bracketCount === 0) {
        startIndex = i
      }
      if (char === '{') braceCount++
      if (char === '[') bracketCount++
    } else if (char === '}' || char === ']') {
      if (char === '}') braceCount--
      if (char === ']') bracketCount--

      if (braceCount === 0 && bracketCount === 0 && startIndex !== -1) {
        const potentialJson = cleaned.substring(startIndex, i + 1)
        try {
          const parsed = JSON.parse(potentialJson)
          if (parsed && typeof parsed === 'object') {
            results.push(parsed)
          }
        } catch {
          // If native JSON.parse fails, try running it through cleanAndParseJson for extra cleaning
          try {
            const parsed = cleanAndParseJson(potentialJson)
            if (parsed && typeof parsed === 'object') {
              results.push(parsed)
            }
          } catch {
            // Ignore invalid fragments
          }
        }
        startIndex = -1
      }
    }
  }

  // Fallback: if scanning char-by-char found nothing, try cleanAndParseJson on the whole text
  if (results.length === 0) {
    try {
      const parsed = cleanAndParseJson(text)
      if (parsed) {
        results.push(parsed)
      }
    } catch {
      // ignore
    }
  }

  return results
}
