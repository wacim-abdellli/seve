# Architectural & UX Audit: Seve Resume Builder

This audit report presents a deep-dive evaluation of **Seve**, an AI-powered local-first resume builder and ATS checker built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

Overall, the application is highly polished, styled with premium aesthetics (cinematic grids, mesh animations, modern typography), and functions offline using rule-based local heuristics. However, our technical deep dive has revealed **critical mathematical anomalies, dead code pathways, significant UX bottlenecks, and sync edge cases** that need correction before production readiness.

---

## 🔍 Key Findings Dashboard

| Audit Area | Severity | Impact | Key Issue | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Semantic Scoring** | 🔴 Critical | Artificially suppresses match scores | TF-IDF on a 2-document corpus mathematically penalizes matched terms. | Replace with term-frequency cosine overlap or Jaccard overlap. |
| **Core Features** | 🔴 Critical | Inaccessible core feature | "One-Click Auto-Fix" is implemented in utilities but missing from the UI. | Wire the `autoFix` utility to a button in the ATS checklist. |
| **User Experience** | 🟡 High | Sluggish feedback feel | Artificial 6-second scan delay blocks editing workflow. | Remove fake delays; update score instantly (under 50ms). |
| **Performance & Bundling** | 🟢 Medium | Unused bloat dependency | `html2pdf.js` is a heavy dependency that produces non-searchable PDFs. | Delete `pdfExport.ts` and clean up `package.json`. |
| **Data Sync** | 🟢 Medium | Potential data drift | Deletion failures are unhandled; state can drift on reconnect. | Implement a retry queue for database sync actions. |

---

## 1. Mathematical Flaw: Local TF-IDF Scorer (`semanticScorer.ts`)

> [!WARNING]
> The local semantic relevance calculation in `src/utils/semanticScorer.ts` contains a logic skew that penalizes common terms and deflates matches.

### How the Current Implementation Works
The function `computeSemanticRelevance` builds a TF-IDF matrix using a corpus consisting *only* of the candidate's resume and the target Job Description:
```typescript
const corpus = [resumeTokens, jdTokens]
```

### The Mathematical Flaw
The Inverse Document Frequency (IDF) is calculated as:
$$\text{IDF} = \log\left(\frac{N + 1}{\text{DF} + 1}\right) + 1$$
Where $N = 2$ (the size of the corpus).

* **Case 1: Word appears in BOTH documents (A Match):**
  $\text{DF} = 2$.
  $$\text{IDF} = \log\left(\frac{2 + 1}{2 + 1}\right) + 1 = \log(1) + 1 = 1.0$$
* **Case 2: Word appears in ONLY ONE document (A Mismatch):**
  $\text{DF} = 1$.
  $$\text{IDF} = \log\left(\frac{2 + 1}{1 + 1}\right) + 1 = \log(1.5) + 1 \approx 0.405 + 1 = 1.405$$

### Impact
Words that do *not* match (unique to the resume or unique to the JD) are given a **40.5% higher weight** than words that actually match! 

Because the cosine similarity denominator ($\|A\| \|B\|$) is computed using all terms, the mismatched words inflate the vector norms disproportionately, dragging down the similarity percentage:
$$\text{denominator} = \sqrt{\sum (v_{A, i} \cdot \text{IDF}_i)^2} \cdot \sqrt{\sum (v_{B, i} \cdot \text{IDF}_i)^2}$$

### Action Plan
Replace TF-IDF on a 2-document corpus. Instead, use a simplified **Jaccard Similarity** index or **Normalized Term Frequency Cosine Similarity** (treating all terms with a uniform IDF = 1):

```typescript
export function computeSemanticRelevance(resumeText: string, jdText: string): number {
  if (!jdText.trim()) return 0
  const resumeTokens = new Set(tokenize(resumeText))
  const jdTokens = new Set(tokenize(jdText))
  
  let intersection = 0
  for (const token of jdTokens) {
    if (resumeTokens.has(token)) intersection++
  }
  
  // Return percentage overlap
  return Math.round((intersection / jdTokens.size) * 100)
}
```

---

## 2. Inaccessible Feature: Dead "One-Click Auto-Fix" Integration

The project has a highly detailed `autoFix` helper function written in `src/utils/atsEvaluator.ts` (lines 119-337). This function:
* Automatically strips formatting-unfriendly special characters.
* Standardizes date strings (e.g. converting wordy months to standard numeric `MM/YYYY`).
* Translates weak action verbs (e.g., "managed", "held") to power verbs (e.g., "spearheaded", "directed").
* Strips personal pronouns (e.g. "I", "me", "my", "we").

> [!IMPORTANT]
> **No visual component in the entire codebase calls or binds this function.**
> The "One-Click ATS Auto-Fix" highlighted in the README is completely disconnected and unreachable by the user.

### Action Plan
Add an **Auto-Fix** action button inside the `AtsChecker.tsx` sidebar (in the Audit Checklist or Overview tabs) that:
1. Grabs the active resume data.
2. Runs it through `autoFix(resumeData)`.
3. Calls the context's `updateResumeData(fixedData)` to apply the corrections.
4. Shows a success toast with the list of sanitized elements.

---

## 3. Performance Bottleneck: Artificial 6-Second Scan Delay

> [!CAUTION]
> The real-time feedback loop is artificially throttled. Users must wait over 6 seconds for the scan to finish on every single keystroke.

In `src/components/AtsChecker.tsx` (lines 339-380), the code triggers a series of timeouts during scanning:
```typescript
const delays = [800, 650, 600, 550, 500, 480, 450, 420, 400, 380, 350, 300]
```
The sum of these timeouts is **6,030 milliseconds**. 

While this simulation makes the auditor look like it is doing heavy processing, it renders the "real-time" editing feedback useless. The actual `evaluateResume` function is synchronous, highly optimized, and runs in **less than 10 milliseconds**.

### Impact
Every time the user updates their resume, they are blocked by a 6-second loading overlay. This breaks the flow of interactive editing.

### Action Plan
* **Solution A (Recommended):** Make the fake scanning animation a **one-time onboarding event** when the page is first loaded or when a brand new Job Description is uploaded.
* **Solution B:** Drastically cut the delay to a micro-animation of **300ms–500ms** total to maintain the sense of "checking" without degrading the editing experience, or compute the score instantly and show it in a live sidebar badge.

---

## 4. Architectural Cleanup: Unused PDF Export Library (`html2pdf.js`)

In `src/utils/pdfExport.ts`, there is an implementation of `exportResumeToPdf` that imports `html2pdf.js`. 

### The Problem
1. **Never Called:** The function is dead code and is never imported or used.
2. **Text Layer Extraction Failures:** `html2pdf.js` operates by rasterizing the HTML elements to a canvas image and rendering it inside a PDF sheet. This destroys the PDF's text layer. If recruiters upload this PDF to an ATS scanner, the scanner will read it as a blank image.

### The Correct Path Already Implemented
The application correctly triggers the browser's native `window.print()` (using customized print media CSS styles defined in `index.css` under `@media print`). Native browser printing outputs a true vector PDF that preserves the text layer, ensuring **100% ATS readability**.

### Action Plan
* Delete the `src/utils/pdfExport.ts` file.
* Run `npm uninstall html2pdf.js` to strip out the unused heavy dependency.

---

## 5. Local-First Synchronization & Concurrency Edge Cases

### A. Delete Synchronization Gaps
In `ResumeContext.tsx`, `deleteResume` makes a one-time API call to Supabase to delete a resume from the cloud database:
```typescript
await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id)
```
If this call fails (e.g., because the user is temporarily offline), it displays a toast and continues deleting the resume locally.
* **The bug:** The resume is deleted from local storage but remains in the cloud. The next time the user logs in, `fetchAndMergeCloud` will pull the deleted resume back down from the cloud and recreate it in local storage.

### B. Clock Skew and Timestamp Conflicts
The cloud merge logic (`fetchAndMergeCloud`) resolves differences between local and cloud resumes by comparing `updatedAt` strings:
```typescript
if (new Date(cloudProfile.updatedAt) > new Date(merged[id].updatedAt)) {
  merged[id] = cloudProfile
}
```
* **The bug:** This logic relies entirely on the client's local system time. If the client's system clock is incorrect, local changes could overwrite newer cloud edits, or vice-versa, without warning.

### Action Plan
* **Delete Sync:** Keep a `deletedResumeIds` array in `localStorage` to track deletes that occur offline. When the app detects connection recovery, issue sync calls for all items in that queue.
* **Version Vector / Hash Matching:** Transition from raw client timestamps to a simple revision counter (`rev: number`) or prompt the user with a visual conflict resolution modal when there is a mismatch.

---

## 6. Accessibility (a11y) & UX Review

Following our design checklist, the following minor UX issues should be resolved:
* **Interactive Elements:** Icon buttons (like the Font Size Zoom-In/Zoom-Out controls) need explicit `aria-label` tags for screen readers.
* **Contrast in Dark Mode:** Several description texts and logs in `AtsChecker.tsx` use colors like `text-zinc-650` and `text-zinc-700` which do not meet the WCAG AA contrast ratio of `4.5:1` against the black background.
* **Keyboard Navigation:** Modals (like `AiOnboardingModal` and `DownloadGuideModal`) do not trap keyboard focus or support dismissing on the Escape key natively.

---

## Next Steps

We recommend tackling these improvements in the following priority order:
1. **Mathematical Correction:** Fix the IDF calculation in `semanticScorer.ts` to restore accurate semantic match percentages.
2. **Feature Restoration:** Wire up the "Auto-Fix" button to the UI to expose the offline sanitization heuristics.
3. **UX Optimization:** Shorten or remove the artificial 6-second scanning loop.
4. **Dependency Cleanup:** Prune the dead `html2pdf.js` library.
5. **Reliability Check:** Improve the deletion sync loop to prevent revived resumes.
