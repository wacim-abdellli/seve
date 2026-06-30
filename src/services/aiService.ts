/**
 * aiService.ts — Multi-provider AI client for Seve
 *
 * Supports Groq, NVIDIA NIM, Google Gemini, and OpenRouter using their REST APIs.
 * No external SDKs — pure fetch() only. Works entirely in the browser.
 * Groq, NVIDIA, and OpenRouter use the OpenAI-compatible format.
 * Gemini uses its own REST format.
 */

export type AiProvider = 'groq' | 'nvidia' | 'gemini' | 'openrouter' | 'app'

// Supabase project URL — read from Vite env at build time
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL ?? ''

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
  app: {
    label: 'Seve AI',
    model: 'deepseek-r1-distill-llama-70b',
    freeTier: '25 free calls/day · No setup needed',
    signupUrl: '',
    baseUrl: '',
    placeholder: '',
  },
  groq: {
    label: 'Groq',
    model: 'deepseek-r1-distill-llama-70b',
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
    freeTier: '1,500 req/day · Free forever',
    signupUrl: 'https://aistudio.google.com/apikey',
    baseUrl: '',
    placeholder: 'AIzaSy...',
  },
  openrouter: {
    label: 'OpenRouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    freeTier: '20+ free models · No credit card',
    signupUrl: 'https://openrouter.ai',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    placeholder: 'sk-or-...',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMessages(
  systemPrompt: string,
  userContent: string,
): { role: string; content: string }[] {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ]
}

// ─── App proxy (Supabase Edge Function) ──────────────────────────────────────

async function appProxyComplete(
  prompt: string,
  opts?: { maxTokens?: number; temperature?: number; jsonMode?: boolean },
): Promise<string> {
  const url = `${SUPABASE_URL}/functions/v1/ai-proxy`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      maxTokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.3,
      jsonMode: opts?.jsonMode ?? false,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `Proxy error: ${res.status}`)
  return data.text ?? ''
}

// ─── Non-streaming completion ─────────────────────────────────────────────────

export async function aiComplete(
  prompt: string,
  config: AiConfig,
  opts?: { maxTokens?: number; jsonMode?: boolean; systemPrompt?: string },
): Promise<string> {
  const maxTokens = opts?.maxTokens ?? 1024
  const jsonMode = opts?.jsonMode ?? false

  if (config.provider === 'app') {
    return appProxyComplete(prompt, { maxTokens, temperature: 0.3, jsonMode })
  }

  const model = config.model || PROVIDER_META[config.provider].model

  if (config.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`
    const body: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
    }
    if (jsonMode) {
      body.generationConfig.responseMimeType = 'application/json'
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `Gemini error: ${res.status}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
  }

  // Groq, NVIDIA, OpenRouter (OpenAI-compatible)
  const url = PROVIDER_META[config.provider].baseUrl
  const messages = opts?.systemPrompt
    ? buildMessages(opts.systemPrompt, prompt)
    : [{ role: 'user', content: prompt }]

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  }

  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://seve.live'
    headers['X-Title'] = 'Seve Resume Builder'
  }

  const body: any = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: maxTokens,
    stream: false,
  }

  if (jsonMode && (config.provider === 'groq' || config.provider === 'openrouter')) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `${config.provider} error: ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

// ─── Streaming completion ─────────────────────────────────────────────────────

export async function aiStream(
  prompt: string,
  config: AiConfig,
  callbacks: AiStreamCallbacks,
  opts?: { systemPrompt?: string },
): Promise<void> {
  const model = config.model || PROVIDER_META[config.provider].model
  let fullText = ''

  try {
    if (config.provider === 'gemini') {
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
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr || jsonStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(jsonStr)
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
            if (text) { fullText += text; callbacks.onChunk(text) }
          } catch { /* skip malformed */ }
        }
      }
    } else {
      const url = PROVIDER_META[config.provider].baseUrl
      const messages = opts?.systemPrompt
        ? buildMessages(opts.systemPrompt, prompt)
        : [{ role: 'user', content: prompt }]

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      }
      if (config.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://seve.live'
        headers['X-Title'] = 'Seve Resume Builder'
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 1024, stream: true }),
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
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr || jsonStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(jsonStr)
            const text = parsed.choices?.[0]?.delta?.content ?? ''
            if (text) { fullText += text; callbacks.onChunk(text) }
          } catch { /* skip malformed */ }
        }
      }
    }

    callbacks.onDone(fullText)
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
  }
}

// ─── Key validation ───────────────────────────────────────────────────────────

export async function validateAiKey(
  config: AiConfig,
): Promise<{ valid: boolean; model: string; error?: string }> {
  try {
    const model = config.model || PROVIDER_META[config.provider].model
    if (config.provider === 'app') {
      const result = await appProxyComplete('Say "ok" and nothing else.')
      return { valid: !!result, model: 'DeepSeek R1 (Seve AI)' }
    }
    const result = await aiComplete('Say "ok" and nothing else.', config)
    if (typeof result === 'string') return { valid: true, model }
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

const JSON_SYSTEM = 'You are a structured data extractor. Respond ONLY with raw, valid JSON — no markdown, no code fences, no explanation, no trailing text.'
const RESUME_SYSTEM = 'You are an expert ATS resume writer with 15 years of experience. Follow instructions exactly. Be concise and impactful.'

export const PROMPTS = {
  enhanceBullet: (bullet: string, jobTitle: string, company: string) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Enhance this resume bullet point for a ${jobTitle} role at ${company}.

Original: "${bullet}"

Rules:
- Start with a strong action verb (Led, Built, Reduced, Grew, Architected, Delivered, etc.)
- Add a realistic metric placeholder in [square brackets] if no number exists (e.g. [25%], [3x], [$50K])
- Maximum 20 words
- ATS-safe language only
- Return ONLY the enhanced bullet point — no explanation, no list, no quotes.`,
  }),

  generateBullets: (jobTitle: string, company: string, count = 3) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Generate ${count} professional, ATS-optimized resume bullet points for a ${jobTitle} role at ${company}.

Rules:
- Each bullet starts with a strong action verb (Led, Built, Designed, Reduced, Grew, etc.)
- Do NOT invent fake percentages or numbers — write strong qualitative achievement statements instead
- Each bullet must be under 20 words
- ATS-safe language only
- Return ONLY a numbered list (1. ... 2. ... 3. ...), nothing else.`,
  }),

  generateBulletsFromWins: (jobTitle: string, company: string, wins: string) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Turn these real achievements into 3 polished resume bullet points for a ${jobTitle} at ${company}.

User's actual achievements: "${wins}"

Rules:
- Start each with a strong action verb
- Use the user's REAL wins — do NOT invent numbers they didn't mention
- If they mention a metric (%, $, users, time), include it naturally
- Max 20 words each
- ATS-safe language only
- Return ONLY a numbered list (1. ... 2. ... 3. ...), nothing else.`,
  }),

  suggestSectionContent: (section: string, jobTitle: string, skills: string[]) => ({
    systemPrompt: JSON_SYSTEM,
    prompt: `Suggest realistic "${section}" section content for a ${jobTitle} professional with skills in ${skills.slice(0, 5).join(', ')}.

Return a JSON array matching the schema for "${section}":
- "languages": [{"name":"string","proficiency":"Native|Fluent|Professional|Conversational"}] — 1-2 items
- "certifications": [{"title":"string","issuer":"string","date":"YYYY","description":""}] — 1-2 items
- "projects": [{"name":"string","description":"one sentence starting with action verb","technologies":["string"]}] — 1 item
- "volunteer": [{"organization":"string","location":"string","period":"string","description":"string"}] — 1 item
- "awards": [{"title":"string","awarder":"string","date":"YYYY","description":"string"}] — 1 item
- "interests": [{"name":"string","keywords":["string"]}] — 1 item
- "publications": [{"title":"string","publisher":"string","date":"YYYY","description":"string"}] — 1 item
- "references": [{"name":"string","position":"string","phone":"","description":"string"}] — 1 item

Return the array directly. No wrapper object. No markdown. No explanation.`,
  }),

  copilotCommand: (command: string, resumeJson: string) => ({
    systemPrompt: `${JSON_SYSTEM}

You are an AI resume copilot. Return a SINGLE JSON object with "action" and optional "data" keys.

Actions:
- "add_project": data = {"name":"string","description":"string","technologies":["string"],"link":""}
- "add_certification": data = {"title":"string","issuer":"string","date":"","description":""}
- "add_award": data = {"title":"string","awarder":"string","date":"","description":""}
- "add_volunteer": data = {"organization":"string","location":"","period":"","description":""}
- "add_language": data = {"name":"string","proficiency":"Professional"}
- "update_summary": data = "New summary text string"
- "add_experience": data = {"jobTitle":"string","company":"string","location":"","startDate":"","endDate":"","current":true,"bullets":["string"]}
- "add_skills": data = ["skill1","skill2"]
- "add_interest": data = {"name":"string","keywords":["string"]}
- "update_contact": data = {only fields to update: "fullName","email","phone","location","linkedin","website"}
- "unknown": message = "Brief explanation of what you can do"

Infer details smartly. Generate high-quality, realistic content.`,
    prompt: `Current resume: ${resumeJson}

Command: "${command}"`,
  }),

  generateSummary: (jobTitle: string, skills: string[], yearsExp: number) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Write a professional ATS-optimized resume summary.

Role: ${jobTitle}
Top Skills: ${skills.slice(0, 5).join(', ')}
Years of Experience: ${yearsExp}+

Rules:
- 3-4 sentences, 300-500 characters total
- Never use "I" or first-person pronouns
- First sentence: job title + years of experience
- Second/third: core strengths and key achievements
- Final: career goal or value to employer
- ATS-safe language only
- Return ONLY the summary text, no labels or explanation.`,
  }),

  fixAtsIssue: (issueText: string, fixInstruction: string, currentText: string) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Fix the following resume issue.

Issue: "${issueText}"
How to fix: "${fixInstruction}"
Current text: "${currentText}"

Rules:
- Rewrite ONLY the text provided
- Use a strong action verb if it's a bullet point
- Add a metric placeholder in [square brackets] if a number is missing
- Keep it under 20 words if it's a bullet; up to 4 sentences if it's a summary
- ATS-safe language only
- Return ONLY the fixed text — no explanation, no quotes, no labels.`,
  }),

  suggestProjectDescription: (projectName: string, technologies: string[]) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Write a one-sentence ATS-optimized resume description for this project.
Project: "${projectName}"
Technologies: ${technologies.join(', ')}

Rules:
- Start with an action verb (Built, Developed, Designed, Engineered, etc.)
- Mention the tech stack naturally
- End with the purpose or impact
- Maximum 25 words
- Return ONLY the description sentence, nothing else.`,
  }),

  importFromText: (rawText: string, schema: string) => ({
    systemPrompt: JSON_SYSTEM,
    prompt: `Extract all resume details from the text below and format them to match the exact JSON schema provided.

Rules:
- Fill every field you can extract from the text
- For bullets: write them as short, clean sentences (do not add metrics, just extract what's there)
- For dates: use MM/YYYY format where possible
- If a field is not present in the text, use an empty string "" or empty array []

JSON Schema:
${schema}

Resume Text:
${rawText}`,
  }),
}
