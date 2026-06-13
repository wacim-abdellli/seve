# Seve — Free ATS Resume Builder & Career Coach

**Seve** is a premium, 100% free single-page web application designed to help job seekers create professional, ATS-optimized resumes. It features a live-updating ATS Score Engine, job description tailoring tools, a step-by-step career coach AI agent, and multiple layout templates, all running entirely in the browser at **$0 hosting and API costs**.

## ✨ Key Features

1. **Seve Career Coach Agent**: An interactive AI chat assistant that guides you step-by-step through the process of building, detailing, and scoring your resume.
2. **ATS Scoring Engine**: Evaluates your resume in real-time out of 100 points based on:
   - Section Completeness (20 pts)
   - Keyword Match (25 pts)
   - Formatting Safety (20 pts)
   - Action Verbs (10 pts)
   - Quantified Results (10 pts)
   - Contact Info (5 pts)
   - Date Consistency (5 pts)
   - Length Appropriateness (5 pts)
3. **One-Click Auto-Fix**: Instantly fixes ATS-breaking formatting errors, removes personal pronouns, and standardizes date formats to `MM/YYYY`.
4. **Job Description Tailoring**: Paste a job description to extract top keywords, view missing terms in real-time, and get AI-generated bullet point rewrites to increase your ATS match rate.
5. **Print-Perfect Templates**: Choose between:
   - **Classic**: Traditional single column (Serif / Georgia) for maximum compatibility.
   - **Modern**: Clean, accented layout (Sans-serif / Arial) for Tech/Marketing.
   - **Executive**: Structured header and divider bars for senior leadership.
   - Exports directly to a clean, text-readable PDF using custom `@media print` stylesheets.
6. **100% Free / Local First**: No servers, no database, no signups. All data is saved securely in your browser's `localStorage` and never leaves your device.

---

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Engine**: Hybrid (local heuristic word-mapping generator + optional Google Gemini / Claude cloud API keys)
- **PDF Generation**: Browser print-to-PDF via custom CSS print stylesheets

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/wacim-abdellli/seve.git
   cd seve
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173` to start building!

### Building for Production
To build the static files for Vercel, Netlify, or GitHub Pages deployment:
```bash
npm run build
```
The compiled assets will be located in the `dist/` directory.
