/**
 * Utility for cleaning and parsing JSON input, designed to handle common issues
 * when copy-pasting from LLMs (e.g. ChatGPT, Claude) like smart quotes, trailing
 * commas, markdown wrappers, and inline comments.
 */
export function cleanAndParseJson(val: string): any {
  let cleaned = val.trim()

  // 1. Extract JSON from markdown code block if present
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (markdownMatch) {
    cleaned = markdownMatch[1].trim()
  }

  // 2. Extract content between first '{' or '[' and last '}' or ']'
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

  // 3. Replace smart/fancy quotes with straight double/single quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // smart double quotes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // smart single quotes

  // 4. Remove comments (both //... and /*...*/)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')

  // 5. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

  // 6. Attempt parsing
  return JSON.parse(cleaned)
}
