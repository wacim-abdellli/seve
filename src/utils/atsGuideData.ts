export interface AtsGuideDetail {
  whyItMatters: string
  before: string
  after: string
}

export const ISSUE_EXPLANATIONS: Record<string, AtsGuideDetail> = {
  'completeness-contact': {
    whyItMatters: 'ATS parsers scan the very top of your document to find your contact details. If these are missing, recruiters have no automated way to email or call you, leading to immediate rejection.',
    before: '(Resume starts directly with summary or experience, missing email, phone, or location)',
    after: 'Jane Doe | Denver, CO | jane.doe@email.com | (303) 555-0199 | linkedin.com/in/janedoe'
  },
  'completeness-experience': {
    whyItMatters: 'Work experience is the most heavily weighted section in a resume. A resume without experience cannot rank on job relevance, and will fail parsing tests.',
    before: '(Only a list of skills and education is provided, hoping the recruiter will figure out the background)',
    after: 'Professional Experience\nSenior Developer | Acme Corp | 2021 – Present\n- Led development of...'
  },
  'completeness-education': {
    whyItMatters: 'Many roles have educational requirements. Missing this section makes it impossible for the ATS to verify your degrees, certifications, or self-taught credentials.',
    before: '(Education history completely omitted)',
    after: 'Education\nB.S. in Computer Science | University of Colorado | Graduation: 2020'
  },
  'completeness-skills': {
    whyItMatters: 'The skills section contains essential technical and soft keywords. Without this section, semantic search engines cannot match your profile to the job description.',
    before: '(No dedicated skills section, hoping keywords are read in work bullets)',
    after: 'Skills\nLanguages: TypeScript, Python | Frameworks: React, Next.js | Databases: PostgreSQL'
  },
  'completeness-summary': {
    whyItMatters: 'The summary provides a semantic overview of your career. Without it, the ATS does not have a high-level keyword introduction to classify your primary domain.',
    before: '(Resume skips straight to work experience)',
    after: 'Summary: Results-oriented software engineer with 5+ years of experience building scalable web applications. Expert in React and cloud architecture, with a proven track record of reducing latency by 40%.'
  },
  'projects-no-dates': {
    whyItMatters: 'ATS parsers look for dates to understand chronologies. Undated projects might be ignored or misattributed, making it seem like you have less active experience.',
    before: 'Personal Blog Website - Built a blog platform using Gatsby and Node.js.',
    after: 'Personal Blog Website (2023) - Built a blog platform using Gatsby and Node.js.'
  },
  'semantic-low-relevance': {
    whyItMatters: 'Semantic relevance scores reflect how closely your resume\'s vocabulary matches the overall context of the job description. Low relevance means you aren\'t using the industry terms or phrasing that recruiters search for.',
    before: 'Handled computer stuff and did coding for different people.',
    after: 'Engineered scalable web applications and collaborated with cross-functional product teams to deliver features.'
  },
  'domain-mismatch': {
    whyItMatters: 'The ATS classifier detected that your resume is styled for a completely different role domain than the job description (e.g. Sales resume applied to a Software Engineer role).',
    before: 'Sales representative with experience in closing deals and managing accounts... (applying for React Dev)',
    after: 'Software engineer specializing in frontend React development and API integrations... (tailored for React Dev)'
  },
  'keywords-low-match': {
    whyItMatters: 'ATS systems screen resumes by matching specific key terms from the job description. Low keyword match will automatically filter you out of the applicant pool.',
    before: 'Experienced coder who builds web interfaces and works with database queries.',
    after: 'Experienced frontend engineer skilled in React, TypeScript, HTML5, CSS3, and PostgreSQL queries.'
  },
  'skills-ungrouped': {
    whyItMatters: 'A long, flat list of skills is difficult for both ATS parsers and human recruiters to read. Grouping them helps categorize your expertise clearly.',
    before: 'Skills: React, Node, Python, Figma, Docker, AWS, Spanish, Leadership, Git',
    after: 'Skills:\n- Frontend: React, Figma\n- Backend: Node.js, Python\n- DevOps: Docker, AWS, Git'
  },
  'formatting-repetition': {
    whyItMatters: 'Repeating the same verb or noun too many times reduces the readability of your resume and wastes opportunities to showcase a broader range of vocabulary.',
    before: '- Worked on React frontend.\n- Worked on API endpoints.\n- Worked with testing.',
    after: '- Developed React frontend interfaces.\n- Engineered secure API endpoints.\n- Implemented comprehensive unit tests.'
  },
  'formatting-special-chars': {
    whyItMatters: 'Unusual icons and shapes (★, ✓, ►) can cause encoding errors in ATS databases, rendering your text as unreadable gibberish like \'\' or \'☐\'.',
    before: '★ Spearheaded developer training sessions',
    after: '- Spearheaded developer training sessions'
  },
  'formatting-pronouns': {
    whyItMatters: 'First-person pronouns (\'I\', \'my\', \'we\') sound unprofessional and subjective in a resume. Resumes should be written in a concise, action-oriented, third-person implied voice.',
    before: 'I managed a team of five and we completed the client\'s project ahead of schedule.',
    after: 'Managed a team of five, delivering the client project ahead of schedule.'
  },
  'formatting-capitalization': {
    whyItMatters: 'Lowercase bullet points look unprofessional and disorganized, which negatively impacts the human screeners who read your resume after the ATS filters it.',
    before: '- implemented payment gateway using Stripe API',
    after: '- Implemented payment gateway using Stripe API'
  },
  'formatting-bullet-symbols': {
    whyItMatters: 'Including bullet symbols directly inside your text input fields confuses the parser, as the resume exporter already adds professional bullet formatting. This results in double-bullets.',
    before: '• Managed developer sprints and code reviews.',
    after: 'Managed developer sprints and code reviews.'
  },
  'verbs-weak': {
    whyItMatters: 'Weak verbs (like \'helped with\', \'responsible for\', \'handled\') don\'t communicate your active role or level of responsibility. Starting with strong action verbs commands authority.',
    before: 'Responsible for writing clean code and helping other team members.',
    after: 'Engineered clean, testable code and mentored 3 junior developers.'
  },
  'metrics-missing': {
    whyItMatters: 'Without numbers, recruiters and ATS screeners cannot judge the scale or impact of your achievements. Metrics make your success concrete.',
    before: 'Helped speed up the loading time of the main web page.',
    after: 'Optimized critical rendering path, reducing page load time by 35%.'
  },
  'contact-caps-url': {
    whyItMatters: 'ALL CAPS URLs can be misread by simple string-parsing algorithms, leading to broken hyperlinks inside the recruiter\'s system.',
    before: 'LINKEDIN.COM/IN/JANE-DOE',
    after: 'linkedin.com/in/jane-doe'
  },
  'dates-completely-missing': {
    whyItMatters: 'A resume with no dates makes it impossible to verify the length of your experience, causing immediate disqualification by recruiters.',
    before: 'Software Engineer at Acme Corp',
    after: 'Software Engineer at Acme Corp | 06/2021 – Present'
  },
  'dates-inconsistent': {
    whyItMatters: 'Inconsistent date formats (e.g. mix of \'June 2021\', \'06/2021\', and \'2021\') confuse parsing bots trying to calculate your years of experience.',
    before: 'Experience 1: June 2021 – Present\nExperience 2: 05/2019 – 06/2021',
    after: 'Experience 1: 06/2021 – Present\nExperience 2: 05/2019 – 06/2021'
  },
  'dates-separator-inconsistent': {
    whyItMatters: 'Different date range separators (e.g. using hyphens, em-dashes, or the word \'to\' interchangeably) break range calculations in parsing algorithms.',
    before: 'Experience 1: 06/2021 to Present\nExperience 2: 05/2019 - 06/2021',
    after: 'Experience 1: 06/2021 – Present\nExperience 2: 05/2019 – 06/2021'
  },
  'length-inappropriate': {
    whyItMatters: 'Resumes that are too short (under 250 words) lack depth, while those that are too long (over 3 pages) lose the recruiter\'s attention. Keep it concise.',
    before: '(Resume containing only 100 words of skeleton contact info and skills)',
    after: '(Elaborated resume of 400-600 words with quantified achievements)'
  },
  'page2-sparse': {
    whyItMatters: 'Having just 1 or 2 lines spill onto page 2 looks sloppy. It\'s better to keep it to a tight single page or fill out the second page at least halfway.',
    before: '(Page 2 contains only one line: \'Certifications: AWS Certified Developer\')',
    after: '(Adjusted font sizes/margins to fit everything perfectly on Page 1)'
  },
  'readability-insufficient-content': {
    whyItMatters: 'There isn\'t enough text on the resume to perform a reliable readability analysis. Add more descriptions of your roles and achievements.',
    before: '(Just job titles and dates, no descriptions)',
    after: '(Added 3 bullet points per role using the X-Y-Z formula)'
  },
  'readability-complex': {
    whyItMatters: 'Extremely long sentences and dense academic jargon make your resume hard to scan. Recruiters spend an average of 6 seconds per resume; keep it readable.',
    before: 'Conducted multifaceted programmatic refactoring paradigms to aggregate distributed API systems...',
    after: 'Refactored distributed API endpoints, reducing data payload size by 25%.'
  },
  'readability-simple': {
    whyItMatters: 'Overly simplistic language might fail to show your technical expertise and professional maturity.',
    before: 'I made website pages look good and fixed some bugs in the code.',
    after: 'Developed responsive UI components and debugged critical backend issues.'
  },
  'depth-summary-thin': {
    whyItMatters: 'A short, one-sentence summary doesn\'t give a clear picture of your background, primary skills, and career level.',
    before: 'Developer seeking a new job.',
    after: 'Results-driven Software Engineer with 4+ years of experience specializing in React and Node.js. Passionate about optimization and developer tooling.'
  },
  'depth-summary-missing': {
    whyItMatters: 'Without a summary, your resume lacks a clear pitch and forces the recruiter to guess your specialization.',
    before: '(No summary section, goes straight to experience)',
    after: '(Added a 3-line professional summary at the top)'
  },
  'depth-no-bullets': {
    whyItMatters: 'Listing a job title without any bullet points describing your work leaves the recruiter in the dark about what you actually accomplished.',
    before: 'React Developer at Acme Corp (2022 - Present)',
    after: 'React Developer at Acme Corp (2022 - Present)\n- Engineered reusable UI components...'
  },
  'depth-few-bullets': {
    whyItMatters: 'Having fewer than 3 bullet points per job entry doesn\'t provide enough detail to evaluate your experience level and impact.',
    before: 'Software Engineer at Acme Corp\n- Wrote code for the platform.',
    after: 'Software Engineer at Acme Corp\n- Designed and built user registration portal...\n- Integrated Stripe payments...\n- Reduced API latency by 15%...'
  },
  'depth-stub-bullets': {
    whyItMatters: 'Ultra-short bullets (under 15 characters) like \'Wrote code\' or \'Fixed bugs\' lack context and fail to demonstrate skill.',
    before: '- Fixed bugs.',
    after: '- Identified and fixed 30+ critical frontend bugs, improving stability.'
  },
  'depth-no-experience': {
    whyItMatters: 'Work experience is the core of your resume. Without it, the ATS and recruiters cannot judge your professional history.',
    before: '(No experience section)',
    after: '(Added experience section detailing internships, freelance, or full-time roles)'
  },
  'depth-few-skills': {
    whyItMatters: 'Listing too few skills makes your resume look thin and reduces the chances of matching keyword-based searches.',
    before: 'Skills: Python, HTML',
    after: 'Skills: Python, HTML5, CSS3, Django, PostgreSQL, Git, Agile Development'
  },
  'depth-no-skills': {
    whyItMatters: 'A missing skills section makes it very difficult for the ATS to index your technical keywords.',
    before: '(No skills list)',
    after: '(Added skills section grouped by technology domain)'
  },
  'depth-edu-incomplete': {
    whyItMatters: 'Incomplete education entries make it hard to verify your qualifications.',
    before: 'Computer Science Degree',
    after: 'B.S. in Computer Science | University of Colorado (Graduated 2020)'
  }
}

export const POWER_VERBS = [
  {
    category: 'Leadership & Mgmt',
    verbs: ['Spearheaded', 'Orchestrated', 'Directed', 'Chaired', 'Coordinated', 'Guided', 'Mentored', 'Pioneered', 'Architected', 'Supervised']
  },
  {
    category: 'Tech & Dev',
    verbs: ['Engineered', 'Programmed', 'Automated', 'Refactored', 'Deployed', 'Integrated', 'Optimized', 'Debugging', 'Formulated', 'Configured']
  },
  {
    category: 'Creative & Design',
    verbs: ['Conceptualized', 'Designed', 'Authored', 'Drafted', 'Visualized', 'Revamped', 'Illustrated', 'Curated', 'Rebuilt', 'Formed']
  },
  {
    category: 'Ops & Execution',
    verbs: ['Executed', 'Implemented', 'Streamlined', 'Catalyzed', 'Expedited', 'Restructured', 'Consolidated', 'Standardized', 'Enforced', 'Maximized']
  },
  {
    category: 'Comm & Support',
    verbs: ['Collaborated', 'Advocated', 'Negotiated', 'Resolved', 'Liaised', 'Mediated', 'Partnered', 'Facilitated', 'Consulted', 'Trained']
  }
]

export const FORMATTING_RULES = {
  dos: [
    'Use standard system fonts (Arial, Inter, Calibri, Georgia, Times New Roman).',
    'Organize experience chronologically starting with your most recent role.',
    'Use standard, simple bullet points (solid round dots or dashes).',
    'Write dates in MM/YYYY format consistently across all sections.',
    'List skills in clear categories using piping (|) or colons (:) as dividers.'
  ],
  donts: [
    'Avoid placing vital text inside Text Boxes or floating graphics (ATS systems skip them).',
    'Do not use complex multi-row nested tables or graphic skill level charts.',
    'Do not use graphical icons (like email or phone cliparts) directly inside text flows.',
    'Avoid graphic shapes, headers/footers for core details, or decorative background fills.',
    'Never use custom bullet characters like ★, ✓, or ► which cause UTF encoding crash errors.'
  ]
}
