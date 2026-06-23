# Seve Implementation Guide: Step-by-Step Refactoring Instructions
**For: Implementer Agent (DeepSeek v4 Flash)**

This guide provides step-by-step implementation plans to resolve the mathematical skews, UI omissions, UX throttles, dead dependencies, and sync issues highlighted in the audit. 

Execute these tasks **one-by-one**. Verify each task before moving to the next.

---

## Task 1: Fix TF-IDF Cosine Similarity Flaw
* **Target File:** `src/utils/semanticScorer.ts`
* **Problem:** Standard TF-IDF on a 2-document corpus treats words that match as common (assigns IDF = 1.0) and words that mismatch as unique (assigns IDF = 1.405). This inflates mismatch values and skews the cosine similarity denominator, artificially lowering the score.

### Step-by-Step Instructions
1. Replace the corpus-based TF-IDF logic in `semanticScorer.ts` with a **Normalized Term Frequency (TF) Cosine Overlap** or a **Jaccard Similarity index**.
2. If using Jaccard Similarity, calculate the intersection of unique tokens between the resume and the Job Description, divided by the total number of unique tokens in the Job Description (percentage overlap):
   $$\text{Score} = \text{round}\left(\frac{|T_{\text{resume}} \cap T_{\text{jd}}|}{|T_{\text{jd}}|} \times 100\right)$$
3. Ensure the tokenization logic remains accent-friendly and splits tokens cleanly by space and punctuation.
4. If the Job Description is empty or only whitespace, immediately return `0`.

### Verification Code Symbol
Verify that [computeSemanticRelevance](file:///C:/Users/pc/Desktop/seve/src/utils/semanticScorer.ts#L39) returns 100 when text match is identical, and scales linearly with keyword coverage.

---

## Task 2: Connect the "One-Click Auto-Fix" Feature to the UI
* **Target Files:** `src/components/AtsChecker.tsx`
* **Utility Reference:** `src/utils/atsEvaluator.ts` ([autoFix](file:///C:/Users/pc/Desktop/seve/src/utils/atsEvaluator.ts#L119))

### Step-by-Step Instructions
1. Import the `autoFix` function from `../utils/atsEvaluator` in `src/components/AtsChecker.tsx`.
2. In the "Overview" and "Audit Checklist" tabs of the `AtsChecker`, add a prominent, styled call-to-action banner or button (e.g. "One-Click Auto-Fix Resume").
3. Use a check to determine if there are fixable issues in the report:
   ```typescript
   const hasFixableIssues = report?.critical.some(i => i.autoFixable) || report?.warnings.some(i => i.autoFixable)
   ```
4. Only show the button/banner if `hasFixableIssues` is true.
5. In the button click handler:
   * Execute `const fixedData = autoFix(resumeData)`.
   * Call `updateResumeData(fixedData)` (available through `useResume` context or props) to update the parent state.
   * Fire a success toast using `showToast('Applied one-click ATS fixes to your resume!', 'success')`.

---

## Task 3: Eliminate the 6-Second Artificial Scan Delay
* **Target File:** `src/components/AtsChecker.tsx`
* **Code Reference:** Scanning `useEffect` hook (lines 339-380)

### Step-by-Step Instructions
1. Locate the `delays` array in `AtsChecker.tsx`:
   ```typescript
   const delays = [800, 650, 600, 550, 500, 480, 450, 420, 400, 380, 350, 300]
   ```
2. Refactor the logic so that real-time typing edits skip this artificial delay entirely. 
3. *Approach:* Maintain a `isInitialScan` state. 
   * On initial load or when a user uploads a new Job Description, show a quick scanning transition (limit it to **300ms–500ms** total to keep it responsive).
   * For subsequent keystroke edits (when typing in text fields), bypass the delays entirely: set `isScanning` to `false` instantly and update the calculated score synchronously inside 10ms.
4. Ensure typing does not cause the UI to flicker or freeze.

---

## Task 4: Remove Unused `html2pdf.js` Dependency & Dead Code
* **Target Files:**
  * Delete: `src/utils/pdfExport.ts`
  * Modify: `package.json`

### Step-by-Step Instructions
1. Safely delete the file `src/utils/pdfExport.ts`.
2. Verify that native browser print controls in `src/hooks/usePrintResume.ts` and `src/components/ResumePreview.tsx` continue to work without referencing `pdfExport.ts`.
3. In `package.json`, remove `html2pdf.js` from the `dependencies` list.
4. Run `npm install` (or the equivalent package clean command) in your terminal to sync package locks.

---

## Task 5: Handle Offline Resume Deletions & Sync Conflicts
* **Target File:** `src/context/ResumeContext.tsx`
* **Code Reference:** `deleteResume` (line 558) and `fetchAndMergeCloud` (line 181)

### Step-by-Step Instructions
1. **Offline Deletion Queue:**
   * Inside `deleteResume`, if the network is offline or the Supabase delete fails, catch the error.
   * Add the deleted resume ID to a `seve_deleted_ids` array in `localStorage`.
   * When connection is restored (or during the initial login synchronization), read `seve_deleted_ids` and issue deletion API calls to Supabase for each queued ID. Once successful, empty the queue.
2. **Clock Skew Mitigation:**
   * In `fetchAndMergeCloud`, instead of relying solely on comparing `new Date(cloudProfile.updatedAt) > new Date(merged[id].updatedAt)` (which is sensitive to mismatched local device clocks), add a transaction revision counter (`revision: number`) to the resume schema/state.
   * Increment `revision` on every update.
   * When merging, choose the version with the higher revision counter. If there's a revision conflict with different hashes, keep the local version but notify the user or create a backup copy.
