# Seve — Free, Honest ATS Resume Builder & Career Coach

**Seve** is a premium, client-side web application designed to help job seekers build professional, ATS-optimized resumes. Built with a commitment to transparency and user privacy.

No registrations, no premium paywalls, no fake statistics, and no tracking.

---

## 🔒 Privacy & Local-First Architecture

Seve is engineered to respect your privacy and give you full ownership of your data:
- **100% Client-Side Storage:** All your resume revisions, target job descriptions, settings, and chat history are saved locally in your browser's `localStorage` (`seve_state`).
- **Zero Third-Party Servers:** We host no backend databases or tracking servers. Your data never leaves your browser unless you export it as a backup file.
 
---

## ✨ Features

### 1. ATS Scoring Engine (Local Offline Heuristics)
Evaluates your resume in real-time based on actual industry guidelines, scoring out of 100 points:
- **Section Completeness (20 pts):** Ensures contact info, summary, experience, education, and skills are present.
- **Keyword Match (25 pts):** Scans your resume text against keywords extracted from your target job description.
- **Formatting Safety (20 pts):** Highlights potential parsing traps (tables, text boxes, non-standard symbols).
- **Action Verbs (10 pts):** Verifies that experience bullet points start with strong, professional verbs.
- **Quantified Results (10 pts):** Identifies whether you have included measurable impact metrics.
- **Contact Info (5 pts):** Checks for name, email, and LinkedIn profile format.
- **Date Consistency (5 pts):** Scans dates to ensure they use a standard candidate-friendly format (`MM/YYYY`).
- **Length Appropriateness (5 pts):** Warns if your resume is too long relative to your experience level.

### 2. One-Click ATS Auto-Fix
Instantly sanitizes your draft: standardizes date formats, eliminates personal pronouns (I, me, my, we), and strips formatting-unfriendly special characters.

### 3. Print-Perfect Templates
Includes five professionally-crafted, ATS-compliant templates:
- **Classic:** Traditional serif layout (`Georgia`), recommended for corporate, finance, and legal fields.
- **Modern:** Contemporary clean sans-serif layout (`Arial`) with subtle color accents, ideal for tech and startups.
- **Executive:** Distinguished divider bar formatting for senior management and leadership.
- **Minimalist:** Airy padding and structured whitespace for maximum readability.
- **Creative:** Distinct layout tags with left-border accents for design and marketing roles.
- *Exports clean, text-readable PDFs utilizing your browser's print dialog (`Ctrl+P` / `Cmd+P`) combined with custom responsive CSS `@media print` stylesheets.*

---

## 🛠️ Tech Stack

- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (Vanilla CSS for theme custom variables)
- **Icons:** Lucide React
 
---

## 🚀 Getting Started

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/wacim-abdellli/seve.git
   cd seve
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Building for Production
To generate the production bundle:
```bash
npm run build
```
The static files will be generated in the `dist/` directory, ready to be hosted on Netlify, Vercel, GitHub Pages, or any static hosting service.
