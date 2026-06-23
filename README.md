# Seve

Seve is a free, open-source, local-first resume builder designed to build clean, ATS-optimized resumes. It runs entirely in your browser, keeping your data local unless you choose to enable cloud sync.

## Key Features

- **Local-First & Offline Capable**: Your resume data is stored directly in your browser (`localStorage`). You can create, edit, and export resumes offline without signing in.
- **Privacy-First PDF Export**: PDFs are rendered locally using your browser's print engine (`Ctrl+P` / `Cmd+P`) combined with print-optimized CSS. No external APIs or servers process your resume text during rendering.
- **Optional Cloud Sync**: Sync resumes across devices via Supabase. Local changes sync automatically when online, with timezone-independent sync resolution.
- **Real-Time ATS Quality Scoring**: Instant feedback based on formatting guidelines:
  - **Completeness & Structure**: Ensures essential sections (summary, experience, education, skills, contact) are complete.
  - **Job Description Keyword Matching**: Checks target job descriptions against resume keywords in real time.
  - **Action Verbs & Impact Metrics**: Flags passive phrasing and counts quantified results (percentages, numbers).
  - **Formatting Safety Audit**: Flags tables, text boxes, and special symbols that interfere with ATS parsers.
  - **Date Validation**: Ensures date patterns match recruiter-friendly standards (`MM/YYYY`).
- **10 Professional Templates**: Built with print-safe CSS rules (`21cm` x `29.7cm` A4 layouts) and fine-tuned typography (Classic, Modern, Clean, Compact, Technical, Executive, Minimalist, Creative, Professional, Academic).

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Vanilla CSS Variables
- **Backend & Database**: Supabase (Auth & JSON-based profile storage)

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/wacim-abdellli/seve.git
   cd seve
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase URL and anonymous key inside `.env`.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

### Production Build

To build the static application bundle:
```bash
npm run build
```
The compiled output is saved to the `dist/` directory, ready to be deployed to static hosting providers (Vercel, Netlify, GitHub Pages, etc.).
