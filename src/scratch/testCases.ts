import { evaluateResume } from '../utils/atsEvaluator'
import type { ResumeData } from '../types/resume'
import * as fs from 'fs'
import * as path from 'path'

// 1. Load Jane Doe resume
const janeDoePath = path.join(import.meta.dirname, '../../perfect_resume.json')
const janeDoeData: ResumeData = JSON.parse(fs.readFileSync(janeDoePath, 'utf-8'))

// 2. Define Job Descriptions
const commsManagerJd = "We are looking for a Communications Manager to lead our PR and content strategy, manage media relations, and increase brand visibility. Responsibilities include managing press release content, developing content strategies, and running brand campaigns."
const softwareEngineerJd = "We are looking for a Senior Software Engineer with experience in React, TypeScript, Node.js, and AWS to build scalable microservices. You will develop APIs, deploy on Kubernetes, and write clean database queries in PostgreSQL."

// 3. Define other test resumes
const genericResume: ResumeData = {
  contact: {
    fullName: "John Smith",
    email: "john.smith@example.com",
    phone: "555-123-4567",
    linkedin: "linkedin.com/in/johnsmith",
    location: "New York, NY"
  },
  summary: "Experienced professional seeking a challenging role. Strong ability to lead, manage, and collaborate with teams to drive growth and deliver results in a fast-paced environment.",
  experience: [
    {
      id: "exp-1",
      jobTitle: "Team Lead",
      company: "General Corp",
      location: "New York, NY",
      startDate: "01/2020",
      endDate: "present",
      current: true,
      bullets: [
        "Led a team of general employees to improve processes and deliver projects on schedule.",
        "Managed communications with key clients to ensure opportunities are maximized.",
        "Developed new team strategies to support company goals."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      degree: "Bachelor of Arts",
      school: "State University",
      location: "New York, NY",
      graduationDate: "05/2019"
    }
  ],
  skills: ["Leadership", "Management", "Communication", "Teamwork", "Problem Solving"]
}

const commsResume: ResumeData = {
  contact: {
    fullName: "Sarah Connor",
    email: "sarah.connor@example.com",
    phone: "555-987-6543",
    linkedin: "linkedin.com/in/sarahconnor",
    location: "Boston, MA"
  },
  summary: "Dynamic Communications Specialist with 6 years of experience in brand strategy, content creation, and media relations. Proven ability to craft compelling stories and manage high-impact PR campaigns.",
  experience: [
    {
      id: "exp-1",
      jobTitle: "Communications Manager",
      company: "Media Group Inc.",
      location: "Boston, MA",
      startDate: "06/2021",
      endDate: "present",
      current: true,
      bullets: [
        "Managed all media relations and designed comprehensive content strategies to boost brand visibility.",
        "Authored over 40 press releases and coordinated content distribution across social channels, achieving 25% traffic growth.",
        "Led a small team to execute PR campaigns, reducing outsourcing agency spending by 15%."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      degree: "Bachelor of Arts in Communications",
      school: "Boston University",
      location: "Boston, MA",
      graduationDate: "05/2018"
    }
  ],
  skills: ["PR", "Media Relations", "Content Strategy", "Social Media", "Storytelling", "Press Releases"]
}

// 4. Run Test Cases
console.log("=== ATS EVALUATOR TEST SUITE ===\n")

// Test Case 1: Jane Doe + Communications Manager JD
const tc1 = evaluateResume(janeDoeData, commsManagerJd)
const tc1HasMismatch = tc1.reportV2.critical.some(i => i.id === 'domain-mismatch')
console.log("Test Case 1: Jane Doe (Software Engineer) + Communications Manager JD")
console.log(`- Final Score: ${tc1.total} (Target: <= 45)`)
console.log(`- Mismatch Warning Active: ${tc1HasMismatch} (Target: true)`)
console.log(`- Detected Resume Domain: ${tc1.reportV2.resumeDomain}`)
console.log(`- Detected JD Domain: ${tc1.reportV2.jdDomain}`)
console.log(`- Status: ${tc1.total <= 45 && tc1HasMismatch ? 'PASS' : 'FAIL'}\n`)

// Test Case 2: Jane Doe + Software Engineer JD
const tc2 = evaluateResume(janeDoeData, softwareEngineerJd)
const tc2HasMismatch = tc2.reportV2.critical.some(i => i.id === 'domain-mismatch')
console.log("Test Case 2: Jane Doe (Software Engineer) + Senior Software Engineer JD")
console.log(`- Final Score: ${tc2.total} (Target: 75-88)`)
console.log(`- Mismatch Warning Active: ${tc2HasMismatch} (Target: false)`)
console.log(`- Status: ${tc2.total >= 75 && tc2.total <= 88 && !tc2HasMismatch ? 'PASS' : 'FAIL'}\n`)

// Test Case 3: Jane Doe + No JD
const tc3 = evaluateResume(janeDoeData, "")
console.log("Test Case 3: Jane Doe (Software Engineer) + No JD")
console.log(`- Final Score: ${tc3.total} (Target: 60-70)`)
console.log(`- Status: ${tc3.total >= 60 && tc3.total <= 70 ? 'PASS' : 'FAIL'}\n`)

// Test Case 4: Generic Resume + Software Engineer JD
const tc4 = evaluateResume(genericResume, softwareEngineerJd)
const keywordsCategory = tc4.reportV2.categories.find(c => c.key === 'keywords')
const kwScorePct = keywordsCategory ? (keywordsCategory.score / keywordsCategory.max) * 100 : 0
console.log("Test Case 4: Generic Resume + Software Engineer JD")
console.log(`- Keyword Match Score: ${keywordsCategory?.score}/${keywordsCategory?.max} (${kwScorePct.toFixed(1)}%) (Target: < 10%)`)
console.log(`- Status: ${kwScorePct < 10 ? 'PASS' : 'FAIL'}\n`)

// Test Case 5: Communications Resume + Communications Manager JD
const tc5 = evaluateResume(commsResume, commsManagerJd)
const tc5HasMismatch = tc5.reportV2.critical.some(i => i.id === 'domain-mismatch')
console.log("Test Case 5: Communications Resume + Communications Manager JD")
console.log(`- Final Score: ${tc5.total} (Target: High score, > 70)`)
console.log(`- Mismatch Warning Active: ${tc5HasMismatch} (Target: false)`)
console.log(`- Detected Resume Domain: ${tc5.reportV2.resumeDomain}`)
console.log(`- Detected JD Domain: ${tc5.reportV2.jdDomain}`)
console.log(`- Status: ${tc5.total > 70 && !tc5HasMismatch ? 'PASS' : 'FAIL'}\n`)
