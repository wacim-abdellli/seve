/**
 * aiService.ts — Multi-provider AI client for Seve
 *
 * Supports Groq, NVIDIA NIM, and Google Gemini using their REST APIs.
 * No external SDKs — pure fetch() only. Works entirely in the browser.
 * All three providers use the OpenAI-compatible format (except Gemini which has its own).
 */

export type AiProvider = 'groq' | 'nvidia' | 'gemini'

export interface AiConfig {
  provider: AiProvider
  apiKey: string
  model?: string // optional model override
}

export interface AiStreamCallbacks {
  onChunk: (text: string) => void
  onDone: (fullText: string) => void
  onError: (err: Error) => void
}

export interface ProviderMeta {
  label: string
  model: string
  freeTier: string
  signupUrl: string
  baseUrl: string
  placeholder: string
}

export const PROVIDER_META: Record<AiProvider, ProviderMeta> = {
  groq: {
    label: 'Groq',
    model: 'llama-3.3-70b-versatile',
    freeTier: '14,400 req/day · Free forever',
    signupUrl: 'https://console.groq.com',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    placeholder: 'gsk_...',
  },
  nvidia: {
    label: 'NVIDIA NIM',
    model: 'meta/llama-3.1-70b-instruct',
    freeTier: '1,000 free credits · No credit card',
    signupUrl: 'https://build.nvidia.com',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    placeholder: 'nvapi-...',
  },
  gemini: {
    label: 'Google Gemini',
    model: 'gemini-1.5-flash',
    freeTier: '15 req/min · Free forever',
    signupUrl: 'https://aistudio.google.com/apikey',
    baseUrl: '', // built dynamically
    placeholder: 'AIzaSy...',
  },
}

// ─── Non-streaming completion (for short text, JSON, bullet fixes) ───────────

export async function aiComplete(prompt: string, config: AiConfig): Promise<string> {
  const model = config.model || PROVIDER_META[config.provider].model

  if (config.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `Gemini error: ${res.status}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
  }

  // Groq + NVIDIA (OpenAI-compatible)
  const url = PROVIDER_META[config.provider].baseUrl
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 512,
      stream: false,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `${config.provider} error: ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

// ─── Streaming completion (for long-form: summary, cover letter) ──────────────

export async function aiStream(
  prompt: string,
  config: AiConfig,
  callbacks: AiStreamCallbacks
): Promise<void> {
  const model = config.model || PROVIDER_META[config.provider].model
  let fullText = ''

  try {
    if (config.provider === 'gemini') {
      // Gemini uses a different streaming format
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Gemini error: ${res.status}`)
      }
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr || jsonStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(jsonStr)
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
            if (text) {
              fullText += text
              callbacks.onChunk(text)
            }
          } catch { /* skip malformed */ }
        }
      }
    } else {
      // Groq + NVIDIA (OpenAI SSE format)
      const url = PROVIDER_META[config.provider].baseUrl
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 1024,
          stream: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `${config.provider} error: ${res.status}`)
      }
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr || jsonStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(jsonStr)
            const text = parsed.choices?.[0]?.delta?.content ?? ''
            if (text) {
              fullText += text
              callbacks.onChunk(text)
            }
          } catch { /* skip malformed */ }
        }
      }
    }

    callbacks.onDone(fullText)
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
  }
}

// ─── Key validation (ping with a minimal prompt) ─────────────────────────────

export async function validateAiKey(config: AiConfig): Promise<{ valid: boolean; model: string; error?: string }> {
  try {
    const model = config.model || PROVIDER_META[config.provider].model
    const result = await aiComplete('Say "ok" and nothing else.', config)
    if (typeof result === 'string') {
      return { valid: true, model }
    }
    return { valid: false, model, error: 'Unexpected response format' }
  } catch (err) {
    return {
      valid: false,
      model: config.model || PROVIDER_META[config.provider].model,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

// ─── Prompt Templates ────────────────────────────────────────────────────────

export const PROMPTS = {
  enhanceBullet: (bullet: string, jobTitle: string, company: string) => `
You are an expert ATS resume writer. Enhance this bullet point for a ${jobTitle} role at ${company}.

Original: "${bullet}"

Rules:
- Start with a strong action verb (Led, Built, Reduced, Grew, Architected, Delivered, etc.)
- Add a realistic metric placeholder in [square brackets] if no number exists (e.g. [25%], [3x], [$50K])
- Maximum 20 words
- ATS-safe language only — no tables, symbols, or special characters
- Return ONLY the enhanced bullet point — no explanation, no list, no quotes.
`.trim(),

  generateBullets: (jobTitle: string, company: string, count = 3) => `
You are an expert ATS resume writer. Generate ${count} professional, ATS-optimized resume bullet points for a ${jobTitle} role at ${company}.

Rules:
- Each bullet starts with a strong action verb (Led, Built, Designed, Reduced, Grew, etc.)
- Do NOT invent fake percentages or numbers — write strong qualitative achievement statements instead
- Each bullet must be under 20 words
- ATS-safe language only
- Return ONLY a numbered list (1. ... 2. ... 3. ...), nothing else.
`.trim(),

  generateBulletsFromWins: (jobTitle: string, company: string, wins: string) => `
You are an expert ATS resume writer. Turn these real achievements into 3 polished resume bullet points for a ${jobTitle} at ${company}.

User's actual achievements: "${wins}"

Rules:
- Start each with a strong action verb
- Use the user's REAL wins — do NOT invent numbers they didn't mention
- If they mention a metric (%, $, users, time), include it naturally
- If no metric is mentioned, describe the achievement with strong impact words instead
- Max 20 words each
- ATS-safe language only
- Return ONLY a numbered list (1. ... 2. ... 3. ...), nothing else.
`.trim(),

  suggestSectionContent: (section: string, jobTitle: string, skills: string[]) => `
You are an expert career coach. Suggest realistic content for the "${section}" section of a resume for a ${jobTitle} professional with skills in ${skills.slice(0, 5).join(', ')}.

Rules:
- Return a JSON array of objects matching the section type
- For "languages": [{"name": "English", "proficiency": "Professional"}, ...] — suggest 1-2 realistic languages
- For "certifications": [{"title": "...", "issuer": "...", "date": ""  , "description": ""}] — suggest 1-2 relevant certs
- For "projects": [{"name": "...", "description": "one sentence, action verb start", "technologies": [...]}] — suggest 1 relevant project
- For "volunteer": [{"organization": "...", "location": "...", "period": "...", "description": "..."}] — suggest 1 relevant volunteer exp
- For "awards": [{"title": "...", "awarder": "...", "date": "...", "description": "..."}] — suggest 1 award
- For "interests": [{"name": "...", "keywords": [...]}] — suggest 1 relevant interest
- For "publications": [{"title": "...", "publisher": "...", "date": "...", "description": "..."}] — suggest 1 pub
- For "references": [{"name": "...", "position": "...", "phone": "...", "description": "..."}] — suggest 1 dummy reference
- Return ONLY valid JSON array, no markdown, no explanation.
`.trim(),

  copilotCommand: (command: string, resumeJson: string) => `
You are an expert AI resume copilot. Your task is to interpret a user's natural language command and decide how to update their resume.

Current Resume JSON:
${resumeJson}

User's Command: "${command}"

Available Actions:
1. "add_project": Add a project. Return: { "action": "add_project", "data": { "name": "...", "description": "...", "technologies": ["...", "..."], "link": "..." } }
2. "add_certification": Add a certification. Return: { "action": "add_certification", "data": { "title": "...", "issuer": "...", "date": "", "description": "" } }
3. "add_award": Add an award or honor. Return: { "action": "add_award", "data": { "title": "...", "awarder": "...", "date": "", "description": "" } }
4. "add_volunteer": Add a volunteer experience. Return: { "action": "add_volunteer", "data": { "organization": "...", "location": "", "period": "", "description": "" } }
5. "add_language": Add a language. Return: { "action": "add_language", "data": { "name": "...", "proficiency": "Professional" } }
6. "update_summary": Rewrite the summary. Return: { "action": "update_summary", "data": "New summary text here" }
7. "add_experience": Add a work experience role. Return: { "action": "add_experience", "data": { "jobTitle": "...", "company": "...", "location": "", "startDate": "", "endDate": "", "current": true, "bullets": ["...", "..."] } }
8. "add_skills": Add skills to the skill list. Return: { "action": "add_skills", "data": ["skill1", "skill2"] }
9. "add_interest": Add an interest. Return: { "action": "add_interest", "data": { "name": "...", "keywords": ["..."] } }
10. "update_contact": Update contact details (such as name/fullName, email, phone, location, linkedin, website). Return: { "action": "update_contact", "data": { "fullName": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "...", "website": "..." } } (only include fields that need to be updated).
11. "unknown": If the command cannot be mapped to any of the actions above or is conversational. Return: { "action": "unknown", "message": "Helpful response explaining what you can do (e.g. 'I can add projects, certifications, volunteer experience, languages, skills, update contact info, or update your summary.')" }

Rules:
- Infer details smartly. If the user says "add a React project named Taskify", make up a high-quality bullet-like description using React and associated tech.
- Return ONLY valid, minified JSON object matching the structures above. No markdown code blocks, no trailing text, no extra spaces.
`.trim(),

  generateSummary: (jobTitle: string, skills: string[], yearsExp: number) => `
Write a professional ATS-optimized resume summary for:
Role: ${jobTitle}
Top Skills: ${skills.slice(0, 5).join(', ')}
Years of Experience: ${yearsExp}+

Rules:
- 3–4 sentences, 300–500 characters total
- Never use "I" or first-person pronouns
- First sentence: job title + years of experience
- Second/third: core strengths and key achievements
- Final: career goal or value to employer
- ATS-safe language only
- Return ONLY the summary text, no labels or explanation.
`.trim(),

  fixAtsIssue: (issueText: string, fixInstruction: string, currentText: string) => `
You are an expert ATS resume writer. Fix the following resume issue.

Issue: "${issueText}"
How to fix: "${fixInstruction}"
Current text: "${currentText}"

Rules:
- Rewrite ONLY the text provided
- Use a strong action verb if it's a bullet point
- Add a metric placeholder in [square brackets] if a number is missing
- Keep it under 20 words if it's a bullet; up to 4 sentences if it's a summary
- ATS-safe language only
- Return ONLY the fixed text — no explanation, no quotes, no labels.
`.trim(),

  suggestProjectDescription: (projectName: string, technologies: string[]) => `
Write a one-sentence ATS-optimized resume description for this project:
Project: "${projectName}"
Technologies: ${technologies.join(', ')}

Rules:
- Start with an action verb (Built, Developed, Designed, Engineered, etc.)
- Mention the tech stack naturally
- End with the purpose or impact
- Maximum 25 words
- Return ONLY the description sentence, nothing else.
`.trim(),

  importFromText: (rawText: string, schema: string) => `
Extract all resume details from the following text and format them to match this exact JSON schema.

IMPORTANT:
- Return ONLY valid JSON — no markdown backticks, no explanation, no extra text outside the JSON
- Fill every field you can extract from the text
- For bullets: write them as short, clean sentences (do not add metrics, just extract what's there)
- For dates: use MM/YYYY format where possible
- If a field is not present in the text, use an empty string "" or empty array []

JSON Schema:
${schema}

Resume Text:
${rawText}
`.trim(),
}
