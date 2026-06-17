import * as pdfjs from 'pdfjs-dist'
// @ts-ignore
import mammoth from 'mammoth'
import type { ResumeData } from '../types/resume'

// Initialize PDFJS Global Worker CDN path
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'

/**
 * Extracts raw string text from a PDF or DOCX file client-side.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const mimeType = file.type
  const fileName = file.name.toLowerCase()

  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return extractTextFromPdf(file)
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return extractTextFromDocx(file)
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or Word (.docx) file.')
  }
}

/**
 * Parses raw PDF pages and returns concatenated text content.
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdf = await loadingTask.promise
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n'
  }

  if (!fullText.trim()) {
    throw new Error('No readable text found in PDF. Note that scanned/image PDFs are not supported.')
  }

  return fullText
}

/**
 * Uses mammoth to extract plain text from DOCX file.
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  
  if (!result.value.trim()) {
    throw new Error('No readable text found in Word document.')
  }

  return result.value
}

// Gemini JSON response schema for ResumeData
const resumeDataSchema = {
  type: "OBJECT",
  properties: {
    contact: {
      type: "OBJECT",
      properties: {
        fullName: { type: "STRING" },
        email: { type: "STRING" },
        phone: { type: "STRING" },
        linkedin: { type: "STRING" },
        location: { type: "STRING" },
        website: { type: "STRING" }
      },
      required: ["fullName", "email", "phone"]
    },
    summary: { type: "STRING" },
    experience: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          jobTitle: { type: "STRING" },
          company: { type: "STRING" },
          location: { type: "STRING" },
          startDate: { type: "STRING" },
          endDate: { type: "STRING" },
          current: { type: "BOOLEAN" },
          bullets: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["jobTitle", "company", "bullets"]
      }
    },
    education: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          school: { type: "STRING" },
          degree: { type: "STRING" },
          location: { type: "STRING" },
          graduationDate: { type: "STRING" },
          gpa: { type: "STRING" }
        },
        required: ["school", "degree", "graduationDate"]
      }
    },
    skills: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    languages: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          proficiency: { type: "STRING" }
        },
        required: ["name"]
      }
    },
    projects: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          link: { type: "STRING" },
          technologies: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["name", "description"]
      }
    }
  },
  required: ["contact", "summary", "experience", "education", "skills"]
}

/**
 * Sends raw text content to Gemini, requesting it to be structured into standard ResumeData schema format.
 */
export async function parseResumeTextWithAi(text: string, apiKey: string): Promise<ResumeData> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API_KEY_REQUIRED')
  }

  const prompt = `
You are a parser engine for Seve, a professional resume builder.
Your task is to parse the raw text extracted from a user's resume PDF or Word file and organize it into a structured JSON format matching our data schema exactly.

Strict Rules:
1. Extract and separate details into: contact, summary, experience, education, skills, languages, and projects.
2. Under "experience", convert bullet points into an array of strings. Strip bullet characters (•, -, etc.) from the start of the strings.
3. Clean and normalize dates to "MM/YYYY" or "Month YYYY" where possible. Use "Present" if the position is current.
4. Try to populate as many fields as possible from the provided text.
5. If some sections like projects or languages are missing in the text, return empty arrays.
6. Return ONLY a valid JSON object matching the requested schema. No conversational headers/footers, no markdown wrapping, no explanation.

Here is the raw extracted text from the resume:
---
${text}
---
`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: resumeDataSchema,
            temperature: 0.1,
          }
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text
      ) {
        const jsonText = data.candidates[0].content.parts[0].text
        const parsed = JSON.parse(jsonText) as ResumeData

        // Ensure IDs are populated for parsed items to prevent react key issues
        if (parsed.experience) {
          parsed.experience = parsed.experience.map(exp => ({ ...exp, id: crypto.randomUUID() }))
        }
        if (parsed.education) {
          parsed.education = parsed.education.map(edu => ({ ...edu, id: crypto.randomUUID() }))
        }
        if (parsed.languages) {
          parsed.languages = parsed.languages.map(lang => ({ ...lang, id: crypto.randomUUID() }))
        }
        if (parsed.projects) {
          parsed.projects = parsed.projects.map(proj => ({ ...proj, id: crypto.randomUUID() }))
        }

        return parsed
      }
    }
    
    // Attempt fallback with gemini-1.5-flash if 2.5 is unavailable/fails
    console.warn('Gemini 2.5 call failed or returned empty. Trying fallback with Gemini 1.5...')
    const fallbackResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: resumeDataSchema,
            temperature: 0.1,
          }
        })
      }
    )

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json()
      if (
        fallbackData.candidates &&
        fallbackData.candidates[0] &&
        fallbackData.candidates[0].content &&
        fallbackData.candidates[0].content.parts &&
        fallbackData.candidates[0].content.parts[0] &&
        fallbackData.candidates[0].content.parts[0].text
      ) {
        const jsonText = fallbackData.candidates[0].content.parts[0].text
        const parsed = JSON.parse(jsonText) as ResumeData

        // Add IDs
        if (parsed.experience) {
          parsed.experience = parsed.experience.map(exp => ({ ...exp, id: crypto.randomUUID() }))
        }
        if (parsed.education) {
          parsed.education = parsed.education.map(edu => ({ ...edu, id: crypto.randomUUID() }))
        }
        if (parsed.languages) {
          parsed.languages = parsed.languages.map(lang => ({ ...lang, id: crypto.randomUUID() }))
        }
        if (parsed.projects) {
          parsed.projects = parsed.projects.map(proj => ({ ...proj, id: crypto.randomUUID() }))
        }

        return parsed
      }
    }

    throw new Error('AI Engine failed to parse resume details. Please verify your API Key and try again.')
  } catch (e) {
    console.error('Parser AI Engine error:', e)
    throw e
  }
}
