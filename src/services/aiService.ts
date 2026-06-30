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
    model: 'llama-3.3-70b-versatile',
    freeTier: '25 free calls/day · No setup needed',
    signupUrl: '',
    baseUrl: '',
    placeholder: '',
  },
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
  opts?: { maxTokens?: number; temperature?: number; jsonMode?: boolean; systemPrompt?: string },
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
      systemPrompt: opts?.systemPrompt ?? '',
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
  // Lower temperature for structured/JSON tasks = less hallucination
  const temperature = jsonMode ? 0.15 : 0.3

  if (config.provider === 'app') {
    return appProxyComplete(prompt, { maxTokens, temperature, jsonMode, systemPrompt: opts?.systemPrompt })
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
    temperature,
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
  // Strip DeepSeek R1 <think>...</think> reasoning blocks from output
  const raw = data.choices?.[0]?.message?.content?.trim() ?? ''
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
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
            let text = parsed.choices?.[0]?.delta?.content ?? ''
            // Strip any <think> partial tags that leak into stream chunks
            text = text.replace(/<think>[\s\S]*?<\/think>/gi, '')
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

const JSON_SYSTEM = [
  'You are a precise structured data extractor for a resume builder app.',
  'CRITICAL: Respond ONLY with raw, valid JSON — no markdown, no ```json fences, no explanation, no text before or after the JSON.',
  'Never add fields not listed in the schema. Never wrap the result in extra objects.',
].join(' ')

const RESUME_SYSTEM = [
  'You are an elite ATS resume writer with 15+ years of experience helping candidates land jobs at top companies.',
  'Your writing is precise, impactful, and keyword-optimized.',
  'Follow every instruction exactly. Be concise. No preamble, no explanation, no extra text.',
].join(' ')

export const PROMPTS = {
  enhanceBullet: (bullet: string, jobTitle: string, company: string) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Rewrite this resume bullet for a ${jobTitle} at ${company} to be stronger and more impactful.

Original: "${bullet}"

Rules:
- Start with a powerful action verb (Led, Built, Reduced, Automated, Delivered, Scaled, Architected, etc.)
- If no metric exists, add a realistic placeholder in [brackets] like [30%], [3x], [$50K], [10+ team]
- Maximum 20 words
- No first-person pronouns, no articles at the start
- ATS keywords only — no symbols or special characters

Examples of good bullets:
✓ "Reduced API response time by [40%] through query optimization and caching layer implementation"
✓ "Led cross-functional team of [8] engineers to ship redesigned checkout flow, increasing conversions by [22%]"
✓ "Automated deployment pipeline cutting release cycle from 2 weeks to [2 days]"

Return ONLY the rewritten bullet — no quotes, no explanation, no numbering.`,
  }),

  generateBullets: (jobTitle: string, company: string, count = 3) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Write ${count} powerful resume bullet points for a ${jobTitle} at ${company}.

Each bullet must:
- Start with a different strong action verb (Led, Built, Reduced, Designed, Automated, Delivered, Scaled, Improved, etc.)
- Describe a real, plausible achievement — NOT generic responsibilities
- Include a realistic metric placeholder in [brackets] if no number is natural
- Be 15-20 words maximum
- Use ATS-friendly language only

Format: numbered list, one bullet per line.
1. [bullet]
2. [bullet]
3. [bullet]

Return ONLY the numbered list — no intro, no explanation, no extra text.`,
  }),

  generateBulletsFromWins: (jobTitle: string, company: string, wins: string) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Transform these raw achievements into 3 polished resume bullets for a ${jobTitle} at ${company}.

User's achievements: "${wins}"

Rules:
- Start each bullet with a strong action verb
- Use ONLY numbers/metrics the user actually mentioned — never invent them
- If no metric exists, describe the impact with strong qualitative words (critical, company-wide, 0-to-1, etc.)
- 15-20 words each
- No first-person pronouns

Format: numbered list only.
1. [bullet]
2. [bullet]
3. [bullet]

Return ONLY the numbered list.`,
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

You are an intelligent AI resume copilot. The user gives you a natural language command to modify their resume.
You MUST return a single JSON object with an "action" key and a "data" key. If multiple changes are requested, you can output multiple sibling JSON objects.

Available actions and exact data shapes:
- "add_project": {"action":"add_project","data":{"name":"string","description":"one sentence starting with action verb","technologies":["string"],"link":""}}
- "add_certification": {"action":"add_certification","data":{"title":"string","issuer":"string","date":"YYYY","description":""}}
- "add_award": {"action":"add_award","data":{"title":"string","awarder":"string","date":"YYYY","description":"string"}}
- "add_volunteer": {"action":"add_volunteer","data":{"organization":"string","location":"City, Country","period":"Month YYYY - Month YYYY","description":"one sentence impact statement"}}
- "add_language": {"action":"add_language","data":{"name":"string","proficiency":"Native|Fluent|Professional|Conversational"}}
- "update_summary": {"action":"update_summary","data":"Full new summary paragraph here. 3-4 sentences. No I/my."}
- "add_experience": {"action":"add_experience","data":{"jobTitle":"string","company":"string","location":"","startDate":"Mon YYYY","endDate":"Present","current":true,"bullets":["Action verb + achievement","Action verb + achievement"]}}
- "add_skills": {"action":"add_skills","data":["Skill1","Skill2","Skill3"]}
- "add_interest": {"action":"add_interest","data":{"name":"string","keywords":["string"]}}
- "update_contact": {"action":"update_contact","data":{"fullName":"if updating","email":"if updating","phone":"if updating","location":"if updating","linkedin":"if updating","website":"if updating"}}
- "update_experience": {"action":"update_experience","data":{"id":"REQUIRED_ID_FROM_CONTEXT","jobTitle":"string","company":"string","bullets":["Action verb + achievement","Action verb + achievement"]}} — use this to rewrite or improve existing experience bullets or details.
- "update_project": {"action":"update_project","data":{"id":"REQUIRED_ID_FROM_CONTEXT","name":"string","description":"string","technologies":["string"]}} — use this to update existing projects.
- "unknown": {"action":"unknown","message":"Brief explanation of what you can do"}

Rules for updating / improving existing content:
- Find the matching experience or project in the resume context below.
- Copy its "id" and put it in the "id" field of data.
- If requested to "improve vocabulary" or "improve resume wording/quality", rewrite the "summary" (using update_summary) AND rewrite the bullets for each experience entry (using update_experience with their respective IDs) to start with strong action verbs and include metrics.

Few-shot examples:
- User says "add a Python project" → {"action":"add_project","data":{"name":"Python Data Pipeline","description":"Built an automated ETL pipeline processing 1M+ records daily using Python and Apache Airflow.","technologies":["Python","Apache Airflow","PostgreSQL"],"link":""}}
- User says "improve the vocabulary of my Stripe experience" → {"action":"update_experience","data":{"id":"stripe-exp-123","company":"Stripe","bullets":["Architected event-driven microservices processing [1M+] transactions daily with [99.99%] availability","Optimized SQL database query speeds by [45%] through indexing and partitioning"]}}
- User says "improve vocabulary of the CV" →
  {"action":"update_summary","data":"[Polished, metric-driven summary]"}
  {"action":"update_experience","data":{"id":"job-id-1","company":"Stripe","bullets":["...","..."]}}
  {"action":"update_experience","data":{"id":"job-id-2","company":"Datadog","bullets":["...","..."]}}

IMPORTANT: Infer realistic, high-quality details from the user's command and their resume context. Never leave fields as generic placeholders like \"string\".`,
    prompt: `Resume context:
${resumeJson}

User command: "${command}"

Respond with the JSON action object:`,
  }),

  generateSummary: (jobTitle: string, skills: string[], yearsExp: number) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `Write a compelling, ATS-optimized professional resume summary.

Role: ${jobTitle}
Top Skills: ${skills.slice(0, 6).join(', ') || 'not specified'}
Years of Experience: ${yearsExp}+

Structure (follow exactly):
1. Opening: "[X]+ years of experience as a [Job Title]..." — state role and years
2. Middle: 1-2 sentences on core strengths, technical skills, and biggest achievement area
3. Close: 1 sentence on value to employer or career direction

Quality rules:
- Total: 3-4 sentences, 350-500 characters
- Never use "I", "my", "me", or any first-person pronouns
- No clichés: "hard worker", "team player", "passionate", "self-motivated"
- Concrete language: tools, domains, outcomes
- ATS keywords from the skills list should appear naturally

Example of a GREAT summary:
"Software Engineer with 6+ years building high-traffic web applications using React and Node.js. Led architecture of a real-time data platform serving 2M+ users, improving latency by 35%. Deep expertise in cloud-native design (AWS, Docker, Kubernetes). Seeking senior roles where technical depth drives measurable product impact."

Return ONLY the summary paragraph — no labels, no explanation, no quotes.`,
  }),

  fixAtsIssue: (issueText: string, fixInstruction: string, currentText: string) => ({
    systemPrompt: RESUME_SYSTEM,
    prompt: `You are fixing a specific ATS resume issue. Rewrite the given text to fix the issue described.

ISSUE DETECTED: "${issueText}"
HOW TO FIX IT: "${fixInstruction}"
CURRENT TEXT TO REWRITE: "${currentText}"

Strict rules:
- Rewrite ONLY the current text — do not add new sections or unrelated content
- If it is a bullet point: start with a strong action verb, add [metric] placeholder if no number exists, max 20 words
- If it is a summary: 3-4 sentences, no first-person pronouns, 300-500 characters
- ATS-safe language, no symbols or special characters
- Apply the fix instruction precisely

Return ONLY the rewritten text. No quotes. No explanation. No labels.`,
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
