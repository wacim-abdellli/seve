export type RoleDomain =
  | 'software_engineering'
  | 'product_management'
  | 'data_science'
  | 'design_ux'
  | 'marketing_communications'
  | 'finance_accounting'
  | 'hr_recruiting'
  | 'sales'
  | 'operations'
  | 'unknown'

const DOMAIN_SIGNALS: Record<RoleDomain, string[]> = {
  software_engineering: ['engineer', 'developer', 'typescript', 'react', 'node', 'api', 'backend', 'frontend', 'kubernetes', 'ci/cd', 'deployment', 'microservices', 'aws', 'docker', 'database', 'postgresql', 'redis'],
  product_management: ['product manager', 'roadmap', 'sprint', 'backlog', 'stakeholder', 'kpi', 'user story', 'prioritization', 'go-to-market'],
  data_science: ['machine learning', 'data scientist', 'python', 'pandas', 'tensorflow', 'model training', 'feature engineering', 'sql', 'analytics'],
  design_ux: ['ux designer', 'figma', 'wireframe', 'prototype', 'user research', 'design system', 'accessibility', 'ui design'],
  marketing_communications: ['communications', 'brand', 'media relations', 'campaign', 'pr', 'content strategy', 'social media', 'storytelling', 'press release', 'visibility'],
  finance_accounting: ['accountant', 'cpa', 'financial analysis', 'budgeting', 'forecasting', 'gaap', 'balance sheet', 'audit'],
  hr_recruiting: ['recruiter', 'talent acquisition', 'onboarding', 'performance management', 'hris', 'compensation'],
  sales: ['sales', 'account executive', 'quota', 'pipeline', 'crm', 'salesforce', 'revenue target', 'prospecting'],
  operations: ['operations manager', 'process improvement', 'supply chain', 'logistics', 'vendor management', 'sla'],
  unknown: [],
}

export function classifyDomain(text: string): { domain: RoleDomain; confidence: number } {
  const lower = text.toLowerCase()
  const scores: Partial<Record<RoleDomain, number>> = {}

  for (const [domain, signals] of Object.entries(DOMAIN_SIGNALS) as [RoleDomain, string[]][]) {
    if (domain === 'unknown') continue
    let score = 0
    for (const signal of signals) {
      if (lower.includes(signal)) score++
    }
    if (score > 0) scores[domain] = score
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
  if (sorted.length === 0) return { domain: 'unknown', confidence: 0 }

  const top = sorted[0]
  const confidence = Math.min(top[1] / 5, 1) // normalize: 5 signal hits = 100% confidence
  return { domain: top[0] as RoleDomain, confidence }
}

export function computeDomainPenalty(resumeDomain: RoleDomain, jdDomain: RoleDomain): number {
  if (jdDomain === 'unknown' || resumeDomain === 'unknown') return 0
  if (resumeDomain === jdDomain) return 0
  // Adjacent domains (some overlap expected)
  const adjacent: Partial<Record<RoleDomain, RoleDomain[]>> = {
    software_engineering: ['product_management', 'data_science'],
    data_science: ['software_engineering'],
    product_management: ['software_engineering', 'design_ux', 'marketing_communications'],
    design_ux: ['product_management', 'marketing_communications'],
    marketing_communications: ['product_management', 'sales'],
    sales: ['marketing_communications', 'operations'],
  }
  if (adjacent[resumeDomain]?.includes(jdDomain)) return -15 // soft mismatch
  return -35 // hard mismatch — e.g. software engineer vs comms manager
}
