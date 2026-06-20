export const SYNONYM_MAP: Record<string, string[]> = {
  javascript: ['js', 'ecmascript', 'es6'],
  js: ['javascript', 'ecmascript'],
  typescript: ['ts'],
  ts: ['typescript'],
  postgresql: ['postgres', 'psql'],
  postgres: ['postgresql', 'psql'],
  nextjs: ['next.js', 'next'],
  'next.js': ['nextjs', 'next'],
  react: ['reactjs', 'react.js'],
  reactjs: ['react', 'react.js'],
  node: ['nodejs', 'node.js'],
  nodejs: ['node', 'node.js'],
  aws: ['amazon web services', 'amazon webservices', 'amazon'],
  gcp: ['google cloud', 'google cloud platform'],
  python: ['py', 'python3'],
  docker: ['dockerized', 'container', 'containers', 'containerization'],
  kubernetes: ['k8s', 'kube'],
  k8s: ['kubernetes', 'kube'],
  'machine learning': ['ml', 'deep learning', 'ai'],
  ml: ['machine learning', 'deep learning'],
  ai: ['artificial intelligence', 'machine learning'],
  leadership: ['leader', 'leading', 'led'],
  management: ['manager', 'managing', 'managed'],
  communication: ['communicating', 'communicated', 'verbal', 'written'],
  agile: ['scrum', 'kanban', 'sprint'],
  ci: ['continuous integration', 'ci/cd'],
  cd: ['continuous delivery', 'continuous deployment', 'ci/cd'],
  'ci/cd': ['continuous integration', 'continuous delivery', 'continuous deployment', 'ci', 'cd'],
  mongodb: ['mongo', 'nosql'],
  sql: ['database', 'relational database', 'rdbms', 'mysql', 'postgresql'],
  mysql: ['sql', 'database', 'mariadb'],
  analysis: ['analytics', 'analyzing', 'analyzed', 'data analysis'],
  testing: ['test', 'tests', 'qa', 'quality assurance', 'automated testing'],
  'problem solving': ['problem-solving', 'critical thinking', 'analytical'],
  'project management': ['pm', 'project planning', 'project manager'],
  html: ['html5'],
  css: ['css3', 'stylesheets'],
  ux: ['user experience', 'usability'],
  ui: ['user interface', 'frontend'],
  saas: ['software as a service', 'cloud'],
  api: ['apis', 'rest', 'restful', 'rest api', 'restful api', 'graphql', 'endpoint'],
  graphql: ['api', 'apis', 'graph ql', 'gql'],
  rest: ['restful', 'rest api', 'api'],
  microservices: ['micro-service', 'micro service', 'service-oriented', 'soa'],
  cloud: ['aws', 'azure', 'gcp', 'cloud computing', 'saas'],
  azure: ['microsoft azure', 'cloud'],
  devops: ['dev ops', 'dev-ops', 'site reliability', 'sre', 'ci/cd'],
  linux: ['unix', 'bash', 'shell', 'posix'],
  data: ['analytics', 'data analysis', 'data science', 'data engineering', 'big data'],
  blockchain: ['web3', 'web 3', 'solidity', 'ethereum', 'crypto', 'cryptocurrency'],
  mobile: ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'mobile app'],
  security: ['cybersecurity', 'cyber security', 'infosec', 'information security', 'appsec'],
}

export interface MatchResult {
  matched: string[]
  missing: string[]
  partial: { jdTerm: string; resumeTerm: string }[]
}

export const SKILL_IMPLICATIONS: Record<string, string[]> = {
  mongodb: ['nosql', 'database', 'sql'],
  postgresql: ['sql', 'database', 'rdbms'],
  mysql: ['sql', 'database', 'rdbms'],
  sqlite: ['sql', 'database'],
  oracle: ['sql', 'database', 'rdbms'],
  mariadb: ['sql', 'database', 'rdbms'],
  dynamodb: ['nosql', 'database'],
  cassandra: ['nosql', 'database'],
  redis: ['nosql', 'database', 'caching'],
  nextjs: ['react', 'javascript', 'js', 'frontend', 'web'],
  'next.js': ['react', 'javascript', 'js', 'frontend', 'web'],
  react: ['javascript', 'js', 'frontend', 'web'],
  reactjs: ['javascript', 'js', 'frontend', 'web'],
  angular: ['typescript', 'javascript', 'js', 'frontend', 'web'],
  vue: ['javascript', 'js', 'frontend', 'web'],
  svelte: ['javascript', 'js', 'frontend', 'web'],
  typescript: ['javascript', 'js'],
  ts: ['javascript', 'js'],
  express: ['nodejs', 'node', 'javascript', 'js', 'api', 'backend'],
  nestjs: ['typescript', 'ts', 'nodejs', 'node', 'javascript', 'js', 'api', 'backend'],
  springboot: ['java', 'backend'],
  spring: ['java', 'backend'],
  django: ['python', 'api', 'backend'],
  flask: ['python', 'api', 'backend'],
  fastapi: ['python', 'api', 'backend'],
  laravel: ['php', 'backend'],
  rails: ['ruby', 'backend'],
  kubernetes: ['docker', 'containers', 'devops'],
  k8s: ['docker', 'containers', 'devops'],
  docker: ['containers', 'devops'],
  terraform: ['infrastructure as code', 'devops', 'cloud'],
  aws: ['cloud', 'devops'],
  gcp: ['cloud', 'devops'],
  azure: ['cloud', 'devops'],
  github: ['git', 'version control'],
  gitlab: ['git', 'version control'],
  scrum: ['agile'],
  kanban: ['agile'],
  redux: ['react', 'javascript', 'state management'],
  graphql: ['api'],
}

export function expandResumeSkills(resumeSkills: Set<string>): Set<string> {
  const expanded = new Set<string>(resumeSkills)
  let size = 0
  
  // Recursively add implications
  while (expanded.size > size) {
    size = expanded.size
    for (const skill of [...expanded]) {
      const implied = SKILL_IMPLICATIONS[skill]
      if (implied) {
        for (const imp of implied) {
          expanded.add(imp)
        }
      }
    }
  }
  return expanded
}

export function tokenize(text: string): string[] {
  const raw = text.toLowerCase().match(/\b[a-z][a-z.+#/-]{2,}\b/g) || []
  return [...new Set(raw)]
}

export function matchKeywords(jdTokens: string[], resumeTokens: string[]): MatchResult {
  const baseResumeSet = new Set(resumeTokens)
  const resumeSet = expandResumeSkills(baseResumeSet)
  const matched: string[] = []
  const missing: string[] = []
  const partial: { jdTerm: string; resumeTerm: string }[] = []
  const seen = new Set<string>()

  for (const token of jdTokens) {
    if (seen.has(token)) continue
    seen.add(token)

    if (resumeSet.has(token)) {
      matched.push(token)
      continue
    }

    const variants = SYNONYM_MAP[token]
    if (variants) {
      const found = variants.find(v => resumeSet.has(v))
      if (found) {
        matched.push(token)
        partial.push({ jdTerm: token, resumeTerm: found })
        continue
      }
    }

    let foundSynonym = false
    for (const [key, vals] of Object.entries(SYNONYM_MAP)) {
      if (vals.includes(token) && resumeSet.has(key)) {
        matched.push(token)
        partial.push({ jdTerm: token, resumeTerm: key })
        foundSynonym = true
        break
      }
    }
    if (foundSynonym) continue

    missing.push(token)
  }

  return { matched, missing, partial }
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export function extractMultiWordSkills(text: string, skillPhrases: string[]): string[] {
  const lower = text.toLowerCase()
  return skillPhrases.filter(phrase =>
    new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i').test(lower)
  )
}
