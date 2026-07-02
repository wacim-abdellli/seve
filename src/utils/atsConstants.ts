import type { SectionTier } from '../types/resume'

export const USABLE_PER_PAGE = 1026

export const STRONG_VERBS = new Set([
  'led', 'built', 'created', 'designed', 'developed', 'managed',
  'increased', 'decreased', 'improved', 'launched', 'delivered',
  'achieved', 'executed', 'optimized', 'automated', 'coordinated',
  'generated', 'reduced', 'implemented', 'streamlined', 'negotiated',
  'established', 'transformed', 'spearheaded', 'drove', 'deployed',
  'engineered', 'analyzed', 'produced', 'trained', 'mentored',
  'directed', 'facilitated', 'collaborated', 'resolved', 'maintained',
  'monitored', 'supported', 'authored', 'scaled', 'architected',
  'pioneered', 'championed', 'accelerated', 'orchestrated',
  'consolidated', 'expedited', 'integrated', 'mobilized',
  'reorganized', 'restructured', 'revamped', 'revitalized',
  'simplified', 'standardized', 'unified', 'configured',
  'formulated', 'instituted', 'navigated', 'elevated',
  'supercharged', 'catalyzed', 'modernized', 'overhauled',
  'grew', 'expanded', 'boosted', 'upgraded', 'refined',
  'constructed', 'founded', 'initiated', 'established',
  'administered', 'chaired', 'headed', 'recruited', 'hired',
])

export const FR_STRONG_VERBS = new Set([
  'dirigé', 'conçu', 'créé', 'développé', 'géré', 'optimisé', 'automatisé', 'implémenté',
  'amélioré', 'lancé', 'livré', 'réalisé', 'exécuté', 'coordonné', 'généré', 'réduit',
  'mis', 'structuré', 'négocié', 'établi', 'transformé', 'piloté', 'propulsé', 'déployé',
  'conduit', 'analysé', 'produit', 'formé', 'encadré', 'supervisé', 'facilité', 'collaboré',
  'résolu', 'maintenu', 'suivi', 'soutenu', 'rédigé', 'administré', 'déterminé', 'accru',
  'diriger', 'concevoir', 'créer', 'développer', 'gérer', 'optimiser', 'automatiser', 'implémenter',
  'améliorer', 'lancer', 'livrer', 'réaliser', 'exécuter', 'coordonner', 'générer', 'réduire',
  'mettre', 'structurer', 'négocier', 'établir', 'transformer', 'piloter', 'propulser', 'déployer',
  'conduire', 'analyser', 'produire', 'former', 'encadrer', 'superviser', 'faciliter', 'collaborer',
  'résoudre', 'maintenir', 'suivre', 'soutenir', 'rédiger', 'administrer', 'déterminer', 'accroître'
])

export const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'and', 'or', 'but', 'if', 'about'
])

export const FR_STOPWORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'est', 'sont', 'a', 'ont', 'de', 'en',
  'pour', 'sur', 'avec', 'dans', 'par', 'du', 'au', 'aux', 'et', 'ou', 'mais',
  'si', 'se', 'sa', 'ses', 'ce', 'cet', 'cette', 'ces', 'qui', 'que', 'quoi',
  'dont', 'ou', 'dans', 'chez', 'sous', 'vers', 'pourquoi', 'comment', 'plus'
])

export const EN_PRONOUNS_REGEX = /\b(i|me|my|we|our|us)\b/i
export const FR_PRONOUNS_REGEX = /\b(je|moi|mon|ma|mes|nous|notre|nos|on)\b/i

export const WEAK_TO_STRONG_EN: Record<string, string> = {
  helped: 'Collaborated',
  assisted: 'Facilitated',
  made: 'Created',
  did: 'Executed',
  worked: 'Engineered',
  managed: 'Led',
  went: 'Navigated',
  had: 'Acquired',
  saw: 'Monitored',
  took: 'Spearheaded',
  gave: 'Delivered',
  talked: 'Presented',
  got: 'Secured',
}

export const WEAK_TO_STRONG_FR: Record<string, string> = {
  aidé: 'Collaboré',
  assisté: 'Facilité',
  fait: 'Créé',
  faisais: 'Conçu',
  travaillé: 'Développé',
  eu: 'Obtenu',
  donné: 'Présenté',
  parlé: 'Communiqué',
  pris: 'Dirigé',
}

export const SECTION_TIERS: Record<string, SectionTier> = {
  contact: 'core',
  summary: 'expected',
  experience: 'core',
  education: 'core',
  skills: 'core',
  languages: 'optional',
  projects: 'expected',
  awards: 'optional',
  certifications: 'expected',
  interests: 'optional',
  publications: 'optional',
  references: 'optional',
  volunteer: 'optional',
}

export const CORE_SECTION_KEYS = ['contact', 'experience', 'education', 'skills']
export const EXPECTED_SECTION_KEYS = ['summary', 'projects', 'certifications']

export const WEAK_VERB_STARTERS = /^(was|were|been|being|had|has|have|am|is|are|used to|responsible for|worked on|helped with|in charge of|tasked with|participated in|involved in|assisted with|supported|handled|performed|did|made|got|took|gave|went|saw)/i

export const FR_WEAK_VERB_STARTERS = /^(était|étaient|été|ayant|a|ont|avais|avait|suis|es|est|sommes|êtes|sont|utilisé pour|responsable de|travaillé sur|aidé avec|en charge de|chargé de|participé à|impliqué dans|assisté avec|soutenu|géré|effectué|fait|obtenu|pris|donné|allé|vu)/i

export const STRONG_VERB_SUGGESTIONS = 'Led • Built • Developed • Engineered • Optimized • Delivered • Created • Designed • Implemented • Launched • Drove • Established • Generated • Produced • Transformed • Spearheaded'

export const FR_STRONG_VERB_SUGGESTIONS = 'Dirigé • Conçu • Créé • Développé • Géré • Optimisé • Automatisé • Implémenté • Amélioré • Lancé • Livré • Réalisé • Piloté • Déployé • Conduit • Structuré'

export const DIMENSION_WEIGHTS: Record<string, number> = {
  completeness: 0.12,
  keywords: 0.20,
  semantic: 0.20,
  formatting: 0.10,
  actionVerbs: 0.08,
  quantifiedResults: 0.08,
  contactInfo: 0.03,
  dateConsistency: 0.04,
  length: 0.05,
  bulletQuality: 0.08,
  readability: 0.03,
  contentDepth: 0.15,
  hrRedFlags: 0.05,
}

export const JD_STOPWORDS = new Set([
  'lead', 'leads', 'led', 'manage', 'manages', 'managed', 'develop', 'develops',
  'developed', 'support', 'collaborate', 'build', 'create', 'implement', 'drive',
  'deliver', 'ensure', 'work', 'help', 'strong', 'excellent', 'proven', 'ability',
  'experience', 'team', 'project', 'company', 'client', 'role', 'opportunity',
  'passionate', 'dynamic', 'innovative', 'results', 'fast-paced', 'environment',
  'growth', 'join', 'hiring', 'apply', 'candidate', 'profile', 'responsibilities',
])

export const HISTORY_KEY = 'ats-score-history'
export const MAX_HISTORY = 30

export const industryKeywords: Record<string, string[]> = {
  softwareTech: [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C++', 'AWS', 'Azure', 'Docker',
    'Kubernetes', 'CI/CD', 'Git', 'API', 'REST', 'GraphQL', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL',
    'Agile', 'Scrum', 'DevOps', 'System Design', 'Algorithms', 'Data Structures', 'Testing', 'Jest',
    'Redux', 'HTML5', 'CSS3', 'Next.js', 'Vite', 'Frontend', 'Backend', 'Full Stack', 'Cloud Computing'
  ],
  dataScience: [
    'Python', 'R Programming', 'Machine Learning', 'Deep Learning', 'SQL', 'Pandas', 'NumPy', 'SciPy',
    'TensorFlow', 'PyTorch', 'Data Visualization', 'Tableau', 'Power BI', 'Data Engineering', 'Spark',
    'Hadoop', 'Data Mining', 'Big Data', 'Statistics', 'NLP', 'Computer Vision', 'Predictive Modeling'
  ],
  marketing: [
    'SEO', 'SEM', 'Google Analytics', 'Content Strategy', 'Social Media', 'Email Marketing', 'Branding',
    'Copywriting', 'Campaign Management', 'Market Research', 'PPC', 'CRM', 'A/B Testing', 'Conversion Rate',
    'Lead Generation', 'Digital Marketing', 'Product Marketing', 'Public Relations', 'Content Creation'
  ],
  finance: [
    'Financial Modeling', 'Valuation', 'Accounting', 'Corporate Finance', 'Risk Management', 'Budgeting',
    'Excel', 'CFA', 'Portfolio Management', 'Audit', 'Forecasting', 'Taxation', 'M&A', 'Investment Banking',
    'General Ledger', 'Reconciliation', 'SAP', 'QuickBooks', 'Data Analysis', 'Financial Reporting'
  ],
  healthcare: [
    'Patient Care', 'Clinical', 'HIPAA', 'Electronic Health Records', 'EHR', 'EMR', 'Nursing', 'Diagnostics',
    'Treatment Planning', 'Healthcare Administration', 'Patient Advocacy', 'Medical Terminology', 'Infection Control',
    'CPR', 'Vital Signs', 'Medical Billing', 'Pharmacology', 'Patient Safety', 'First Aid'
  ],
  design: [
    'UI/UX', 'Figma', 'Adobe Creative Suite', 'Photoshop', 'Illustrator', 'Prototyping', 'Typography',
    'Wireframing', 'User Research', 'User Journeys', 'Visual Design', 'Interaction Design', 'Graphic Design',
    'Motion Graphics', 'Design Systems', 'Mockups', 'Information Architecture', 'Product Design'
  ],
  sales: [
    'CRM', 'Salesforce', 'Negotiation', 'Lead Generation', 'Account Management', 'B2B', 'B2C', 'Cold Calling',
    'Sales Pipeline', 'Closing Deals', 'Customer Relationship', 'Sales Forecasting', 'Key Account Management',
    'Business Development', 'Market Penetration', 'Product Demos', 'Contract Negotiation'
  ],
  management: [
    'Leadership', 'Strategic Planning', 'Project Management', 'Agile', 'PMP', 'Operations Management',
    'Resource Allocation', 'Stakeholder Management', 'Team Building', 'Change Management', 'Risk Assessment',
    'Process Improvement', 'KPIs', 'Performance Metrics', 'Vendor Management', 'Budget Management'
  ],
  education: [
    'Curriculum Design', 'Pedagogy', 'Classroom Management', 'Lesson Planning', 'Tutoring', 'Student Assessment',
    'Special Education', 'E-learning', 'Educational Technology', 'Instructional Design', 'Parent-Teacher Relations',
    'Child Development', 'Literacy Instruction', 'STEM Education', 'Academic Advising', 'Differentiated Instruction'
  ],
  engineering: [
    'AutoCAD', 'SolidWorks', 'MATLAB', 'LabVIEW', 'Circuit Design', 'Finite Element Analysis', 'FEA', 'CFD',
    'Mechanical Design', 'PLC Programming', 'Project Engineering', 'Quality Assurance', 'Lean Six Sigma',
    'CAD/CAM', 'Robotics', 'Thermodynamics', 'Electrical Engineering', 'Structural Engineering', 'Technical Drawings'
  ],
  humanResources: [
    'Talent Acquisition', 'Onboarding', 'Employee Relations', 'HRIS', 'Payroll Administration', 'Benefits Administration',
    'Conflict Resolution', 'Performance Management', 'Labor Laws', 'HR Compliance', 'Workforce Planning',
    'Succession Planning', 'HR Policy Development', 'HR Analytics', 'FMLA', 'Compensation & Benefits'
  ],
  customerSupport: [
    'Zendesk', 'Help Desk Support', 'Ticket Resolution', 'Customer Retention', 'Intercom', 'Technical Support',
    'Call Center Operations', 'CRM Systems', 'Conflict Resolution', 'Active Listening', 'SLA Management',
    'Customer Satisfaction', 'Troubleshooting', 'Product Knowledge', 'Escalation Procedures'
  ],
  legal: [
    'Legal Research', 'Contract Drafting', 'Compliance Audits', 'Litigation Support', 'Intellectual Property',
    'Regulatory Compliance', 'Risk Mitigation', 'Corporate Law', 'Westlaw', 'LexisNexis', 'Document Review',
    'Legal Writing', 'Due Diligence', 'Corporate Governance', 'Employment Law', 'Contract Negotiation'
  ],
  writing: [
    'Technical Writing', 'Copywriting', 'Editing', 'Proofreading', 'Content Creation', 'SEO Writing',
    'Creative Writing', 'Journalism', 'Grant Writing', 'Blogging', 'Research Writing', 'Localization',
    'Content Strategy', 'Ghostwriting', 'Social Media Copy', 'AP Style'
  ],
  hospitality: [
    'Guest Relations', 'Food Safety', 'ServSafe', 'POS Systems', 'Event Planning', 'Front Desk Operations',
    'Hospitality Management', 'Inventory Control', 'Customer Service', 'Culinary Arts', 'Catering Operations',
    'Menu Planning', 'Banquet Coordination', 'Reservation Systems', 'Housekeeping Management'
  ],
  construction: [
    'Blueprint Reading', 'OSHA Compliance', 'Safety Regulations', 'Project Estimation', 'HVAC Systems',
    'Plumbing', 'Carpentry', 'Electrical Wiring', 'Subcontractor Coordination', 'Site Inspections',
    'Project Scheduling', 'Masonry', 'Drywall Installation', 'Power Tools', 'Heavy Equipment Operation'
  ],
  supplyChain: [
    'Inventory Management', 'Procurement', 'Logistics', 'Warehouse Operations', 'Vendor Negotiations',
    'SAP ERP', 'Material Requirements Planning', 'MRP', 'Demand Forecasting', 'Freight Forwarding',
    'Shipping & Receiving', 'Global Sourcing', 'Distribution Management', 'Supplier Relationship Management',
    'Customs Compliance'
  ]
}
