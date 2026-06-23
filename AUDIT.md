# Seve — Deep Audit Findings

Generated 2026-06-23. 80+ issues found across 25 files.

---

## 🔴 Critical (must fix — correctness or security)

| File | Line | Issue |
|------|------|-------|
| `src/context/ResumeContext.tsx` | 398-404 | **History corruption after 30 entries**: `historyRef.current.shift()` removes oldest but `historyIndexRef.current` not decremented — undo/redo jumps to wrong entries after the 31st push |
| `src/context/ResumeContext.tsx` | 297-314 | **Hash collision in dirty checking**: `computeResumeHash` only checks array *lengths* for experience/education/skills/languages. Changing content within a fixed-length array produces same hash. `hasUnsavedChanges` returns false → data silently not saved |
| `src/context/ResumeContext.tsx` | 67, 199, 189 | **10+ unsafe `as` casts**: `as ResumeProfile`, `as Record<string, unknown>` on parsed localStorage JSON. Corrupted or schema-mismatched data causes silent runtime failures |
| `src/hooks/usePageViews.ts` | 53-55 | **Silent error swallowing**: ALL Supabase RPC errors caught with empty `catch {}` — network failure results in `null` displayed to user forever |
| `src/hooks/usePageViews.ts` | 60 | **30s infinite polling with no backoff/max-retries**: If Supabase is unreachable, fires every 30s per visitor tab indefinitely |
| `src/utils/atsEvaluator.ts` | 120 | `JSON.parse(JSON.stringify(resume)) as ResumeData` — zero runtime validation, corrupted data passes through silently |
| `src/utils/atsEvaluator.ts` | 1481-1489 | **Date format assumption**: `startDate.split('/')[1]` assumes `MM/YYYY`. Dates in `Month YYYY` or `YYYY-MM` format produce year `0` silently |
| `src/utils/atsEvaluator.ts` | 1022, 1025 | `matchedWeight += weightsMap[kw] \|\| 1.0` — if weight is `0`, `\|\|` makes it `1.0`. Should use `??` |
| `src/utils/atsEvaluator.ts` | 606 | Issue IDs contain spaces when section name has spaces (e.g. `'Work Experience'`), invalid for DOM `id` and selectors |
| `src/components/form/ExperienceForm.tsx` | 136-141 | **Stale closure in `updateStarField`**: updater function reads render-time `starFields` via `getStarFields(expId)` instead of `prev`. Two rapid STAR field updates silently lose data |
| `src/components/form/ExperienceForm.tsx` | 359 | **Mobile-invisible remove button**: `opacity-0 group-hover:opacity-100` on bullet remove — permanently invisible on touch devices |
| `src/components/form/SkillsForm.tsx` | 274-280 | **Touch target 16px**: skill chip remove button `w-4 h-4` — WCAG minimum is 44px |
| `src/layouts/EditorLayout.tsx` | 465-478 | **Keyboard listener re-registered on every keystroke**: `keydown` effect depends on `[user, resumeData, pageCount, …]` — detach/reattach listener hundreds of times per session |
| `src/layouts/EditorLayout.tsx` | 490 | **`useMemo` fully defeated**: `openDrawer` defined as inline arrow inside the memo — new reference every render, entire context re-created every render |
| `src/components/ResumePreview.tsx` | 595 | **Context value new object every render**: `SectionReorderProvider value={{ moveSection: handleMoveSection }}` — cascading re-renders to all `useSectionReorder` consumers |
| `src/components/AtsChecker.tsx` | 275-277 | **User draft edits silently overwritten**: `useEffect` calls `setJdDraft(jobDescription)` unconditionally every render. Any parent re-reference destroys user's in-progress edits |
| `src/components/AtsChecker.tsx` | 441-443 | `criticalIssues + warningIssues + suggestionIssues` when all `undefined` (report is null) = `NaN` badge |
| `src/components/AtsChecker.tsx` | 1397, 1492, 1537 | `navigator.clipboard.writeText()` promise never caught — silent failure on permission denied |

---

## 🟠 High (reliability, UX, performance, a11y)

| File | Line | Issue |
|------|------|-------|
| `src/context/ResumeContext.tsx` | 150 | Transient DB error on SELECT aborts entire sync loop — one resume failure blocks all |
| `src/context/ResumeContext.tsx` | 206 | Timestamp comparison `new Date(cloud) > new Date(local)` — **no timezone normalization** |
| `src/context/ResumeContext.tsx` | 250-276 | `setTimeout` retry not captured for cleanup — fires after abort/component unmount |
| `src/context/ResumeContext.tsx` | 370 | `window.confirm()` — blocking dialog, not stylable, no custom modal |
| `src/context/ResumeContext.tsx` | 453-460 | Effect has `resumeData` in dependency array but body only checks `resumeData`-independent condition — re-runs on every keystroke |
| `src/context/ResumeContext.tsx` | 385 | `createDefaultResume()` runs every render when resume list is empty — phantom resume never persisted |
| `src/context/ResumeContext.tsx` | 623 | `setTimeout(() => setCanUndo(false))` with no cleanup — state update on unmounted component |
| `src/context/AuthContext.tsx` | 33-35 | `window.history.replaceState` called inside Supabase `onAuthStateChange` callback — side effect during render |
| `src/context/AuthContext.tsx` | 54 | Google OAuth `prompt: 'consent'` forces consent screen every time. Should be `'select_account'` or omitted |
| `src/context/AuthContext.tsx` | 57-58 | Error messages may contain sensitive OAuth details — no sanitization before exposing to user |
| `src/hooks/usePageViews.ts` | 47-52 | `Promise.all` for two RPCs: if monthly query fails, `totalViews` never updates. Should use `Promise.allSettled` |
| `src/hooks/usePageViews.ts` | 9-10 | `crypto.randomUUID()` not available in insecure contexts (HTTP) or older browsers — no fallback |
| `src/hooks/usePageViews.ts` | 60-63 | TOCTOU: between `ac.abort()` and `clearInterval`, a pending promise can call setState on unmounted component |
| `src/components/Toast.tsx` | 35 | Toast container has no `role="alert"` or `aria-live` — screen readers never announce toasts |
| `src/components/Toast.tsx` | 15-24 | Toast ID uses `Date.now() + Math.random()` — collision possible if two toasts fire in same millisecond |
| `src/components/SectionDrawer.tsx` | 82-88 | **No focus trap** — drawer open, focus stays on trigger element, tab navigates through background |
| `src/components/SectionDrawer.tsx` | 96-226 | `<motion.div>` has no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby` |
| `src/components/SectionDrawer.tsx` | 96-226 | **No body scroll lock** — users can scroll background content while drawer is open |
| `src/components/ResumeForm.tsx` | 226-257 | Tab sidebar: no `role="tablist"`, no `role="tab"`, no `aria-selected`, no arrow-key navigation |
| `src/components/ResumeForm.tsx` | 32-37 | `updateSection` function recreated every render, passed as inline arrow to every sub-form's `onChange` — defeats any `React.memo` on child forms |
| `src/components/ResumeForm.tsx` | 78-92 | `tabs` array literal recreated every render — static constant, hoist to module scope |
| `src/layouts/EditorLayout.tsx` | 510 | `select-none` on root `<div>` — no text selectable anywhere in the editor |
| `src/layouts/EditorLayout.tsx` | 627, 634 | AI Fill button (`hidden sm:flex`) and ATS button (`hidden md:flex`) — **no mobile alternative** for these features |
| `src/layouts/EditorLayout.tsx` | 287 | `e.target as HTMLInputElement` — `e.target` can be `null`, use `e.currentTarget` |
| `src/layouts/EditorLayout.tsx` | 292 | `ev.target?.result as string` — `FileReader.result` is `string \| ArrayBuffer \| null`, no runtime guard |
| `src/components/ResumePreview.tsx` | 207-244 | `fitToOnePage` defined in component body without `useCallback` — new reference every render |
| `src/components/ResumePreview.tsx` | 277-312 | `handleDragStart`, `handleDragOver`, `handleDrop`, `handleMoveSection` — none wrapped in `useCallback` |
| `src/components/ResumePreview.tsx` | 142-146 | `A4_PX`, `A4_SCREEN_THRESHOLD`, `TEMPLATE_VERTICAL_PADDING` defined inside component — recreated every render |
| `src/components/ResumePreview.tsx` | 255 | `resumeData[key as keyof ResumeData]` — unsafe cast, `key` is a loose `string` |
| `src/components/ResumePreview.tsx` | 157, 167, 209 | Direct DOM `querySelector('.resume-page')` — tight coupling to template class naming |
| `src/components/ResumePreview.tsx` | 505-515 | "Page Break" indicators not hidden from screen readers (`aria-hidden` missing) |
| `src/components/BentoDashboard.tsx` | 148-312 | Interactive `<div>` with `onClick` but no `role="button"`, no `tabIndex`, no keyboard handler |
| `src/components/BentoDashboard.tsx` | 116-130 | `sections` array literal recreated every render — hoist to module scope |
| `src/components/BentoDashboard.tsx` | 92-114 | `getStatusBadge` defined inside component — new elements every render, should be a separate component or `useMemo` |
| `src/components/AtsChecker.tsx` | passim | **20+ non-standard Tailwind values** that silently do nothing: `zinc-555`, `zinc-650`, `zinc-405`, `zinc-505`, `zinc-855`, `red-550`, `indigo-650`, `emerald-450`, `amber-450`, `rose-450`, `-ml-1.75` |
| `src/components/AtsChecker.tsx` | 906-1024 | Expandable issue `<div>` uses `onClick` with no `role="button"`, no `tabIndex`, no keyboard handler, no `aria-expanded`, no `aria-controls` |
| `src/components/AtsChecker.tsx` | 559 | Close button on JD accordion: `<XCircle size={14} />` with no `aria-label` — screen reader reads "button" with no meaning |
| `src/components/AtsChecker.tsx` | passim | **Tiny font sizes**: `text-[7px]` through `text-[10.5px]` used extensively — WCAG 1.4.4 requires text resizable to 200% |
| `src/components/AtsChecker.tsx` | 662 | Non-standard `text-zinc-650` may produce insufficient contrast on `bg-zinc-950` |
| `src/components/AtsChecker.tsx` | 1704-1721 | Keyword weight badges use color-only (rose/amber/zinc) — color-blind users cannot differentiate |
| `src/components/form/SkillsForm.tsx` | 102-104 | `setTimeout` with no cleanup — state update on unmounted component |
| `src/components/form/LanguagesForm.tsx` | 68 | Delete button: `p-1` (~20px touch target) — WCAG 44px minimum |
| `src/components/form/EducationForm.tsx` | 197, 209 | Visual validation styling (red border) with no `aria-invalid` — validation invisible to screen readers |
| `src/components/form/AllForms.tsx` | passim | **No `htmlFor`/`id`** on any input, textarea, or select — labels associated by DOM proximity only |
| `src/components/PreviewSectionWrapper.tsx` | 106 | `tabIndex={0}` on `<div>` without a `role` |
| `src/components/PreviewSectionWrapper.tsx` | 107 | `aria-roledescription="resume section"` used without a valid `role` — silently ignored by all screen readers |
| `src/components/ErrorBoundary.tsx` | 26-28 | No focus management after "Try Again" — focus stays on button, not returned to error context |
| `src/components/ErrorBoundary.tsx` | 32-42 | Error container has no `role="alert"` — screen readers don't announce the error |
| `src/index.css` | 41-43 vs 84-86 | CSS custom properties `--text-*` defined **twice** with different values. Later declarations win |
| `src/index.css` | 886-901 | **Hardcoded `!important` overrides** of standard Tailwind utilities: `.text-red-400 { color: #ff4d6d !important }` — completely different from Tailwind's `#f87171` |
| `src/index.css` | 286-301 | `:has()` pseudo-class used 4× for section spacing. ~5% browser breakage (no IE, no old Safari) |
| `src/index.css` | 1058 | Fixed `794px` width on `.resume-page` — horizontal overflow on every phone viewport |
| `src/index.css` | 433-478 | Form panel scrollbar hidden by default, visible only on hover — fails WCAG 2.5.8, keyboard-undiscoverable |
| `src/index.css` | 1108 | `@media (prefers-reduced-motion: reduce) { * { animation: none !important } }` — kills loading spinners and progress bars which don't cause motion sickness |
| `src/index.css` | 313 | `var(--template-divider-color)` used in `border-top` shorthand but **never defined** in `:root` or static CSS — entire shorthand invalid when property not set |
| `src/index.css` | 1058 | `width: 794px; min-height: 1123px` — fixed A4 pixel dimensions break at non-default browser zoom |

---

## 🟡 Medium (maintainability, performance, patterns)

| File | Line | Issue |
|------|------|-------|
| `src/context/ResumeContext.tsx` | 99, 238, 360, 562 | `console.error` in production code (4 occurrences) |
| `src/context/ResumeContext.tsx` | 163 | Entire `ResumeProfile` object stored in `resume_data` JSON column while `title`, `updated_at`, etc. are also top-level columns — data duplication |
| `src/context/ResumeContext.tsx` | 286-292 | Debounced localStorage write: technically possible for timer to fire after unmount |
| `src/context/ResumeContext.tsx` | 316-342 | `// eslint-disable-next-line react-hooks/exhaustive-deps` — suppressed lint rule masks stale deps |
| `src/context/ResumeContext.tsx` | 558-575 | Cloud delete fails → resume deleted locally but not in cloud. Toast warns, but local state is already gone on next sync |
| `src/context/ResumeContext.tsx` | 627-665 | `cloudStatus` in context value changes frequently, cascading re-renders to every consumer |
| `src/context/ResumeContext.tsx` | 482-494 | `updateActiveResume` fallback to `Object.values(prev.resumes)[0]` returns `undefined` when no resumes exist |
| `src/context/AuthContext.tsx` | 24 | `setTimeout(() => setLoading(false))` — brief flash of loading state before resolving |
| `src/context/AuthContext.tsx` | 53 | `redirectTo: window.location.origin + '/editor'` — breaks if deployed under subpath |
| `src/hooks/usePageViews.ts` | 39-41, 48-49 | `as Record<string, unknown>` on Supabase RPC options — suppresses API compatibility checking |
| `src/hooks/usePageViews.ts` | 17-18 | Initial `null \| null` — callers must handle null state, some may render `null` directly |
| `src/hooks/useCountUp.ts` | 7 | `let raf: number` — initially `undefined`, `cancelAnimationFrame(undefined)` called if unmount before first frame |
| `src/utils/atsEvaluator.ts` | 1859-1969 vs 2168-2328 | `generateAtsReport` and `generateAtsReportV2` are ~80% duplicate (~110 identical lines each generate with same 12 scoring function calls, same categories, same total calc) |
| `src/utils/atsEvaluator.ts` | 636-653 vs 660-690 | `extractResumeText` and `countContentWords` are near-duplicates — different filter sets but same iteration pattern |
| `src/utils/atsEvaluator.ts` | 288, 1135, 1983 | Duplicate characters inside regex character classes (`●`, `◆` appear twice each) — sloppy maintenance |
| `src/utils/atsEvaluator.ts` | 991 | `extractResumeText` called ~8× per evaluation. Each scoring function (`scoreKeywords`, `scoreSemantic`, `scoreFormatting`, `scoreReadability`) calls it independently — call once and pass result |
| `src/utils/atsEvaluator.ts` | 384-405 | `SKILL_CATEGORIES_CONFIG` defined inside `calculateSkillsMatrix` — recreated on every call, should be module-level constant |
| `src/utils/atsEvaluator.ts` | 312 | `injectMetricPlaceholder(replaceWeakVerbs(cleanSpecialChars(removePronounsAndEnhance(b))))` — deeply nested, impossible to debug. Use function pipeline |
| `src/utils/atsEvaluator.ts` | 2330 | File is 2330 lines — should be split into `atsScoring.ts`, `atsReport.ts`, `atsUtils.ts`, `atsBullets.ts`, `atsMatrix.ts` |
| `src/utils/atsEvaluator.ts` | 430 | `requiredScore = Math.min(100, 50 + jdWords.length * 10)` — with only 5 JD keywords, requiredScore = 100 (max). Skills matrix always hits ceiling |
| `src/utils/atsEvaluator.ts` | 1565 | `let index = 0` runs across ALL experience entries (not per-entry) — ambiguous `bulletIndex` values in UI |
| `src/utils/atsEvaluator.ts` | 77 | Return type declares `{ language: 'en' \| 'fr' }` but issues include extra properties (`type`, `details`) not in the `AtsIssue` interface |
| `src/components/TemplateRenderer.tsx` | 32 | `React.ComponentType<any>` — defeats TypeScript checking |
| `src/components/TemplateRenderer.tsx` | 46 | `useMemo(() => TEMPLATES[type], [type])` — overkill for constant-time lookup, `useMemo` overhead > lookup cost |
| `src/components/TemplateRenderer.tsx` | 51 | `type` prop leaked to every template (spread in `<Template {...props} />`) — unused prop clutters DOM |
| `src/components/templates/useTemplateData.ts` | 48-64 | All section data (contact, summary, experience, etc.) computed every render, no `useMemo` |
| `src/components/templates/useTemplateData.ts` | 78 | `getPageBreakSections(data, sectionOrder)` never memoized — runs every render |
| `src/components/templates/useTemplateData.ts` | 80-94 | `sectionData` object literal created every render — new reference forces all template consumers to re-render |
| `src/components/templates/useTemplateData.ts` | 81-82 | `atsRating: ''` and `atsFeedback: ''` — always empty, dead code |
| `src/components/templates/useTemplateData.ts` | 86-89 | Three `as` type assertions that do nothing (types already match) |
| `src/components/templates/ModernTemplate.tsx` | 53, 55 | Inline arrow closures for `onDragStart`/`onDrop` created every render inside `renderPreviewWrapper` — called 13× per section, defeats memo on `PreviewSectionWrapper` |
| `src/components/templates/ModernTemplate.tsx` | 61-249 | `sectionsMap` massive object literal rebuilt from scratch every render |
| `src/components/templates/ModernTemplate.tsx` | 25-32 | `SectionHeading` local component not wrapped in `React.memo` — used 13× and receives same `color` prop |
| `src/components/templates/ModernTemplate.tsx` | 98-99 | `formatDate(edu.graduationDate)` — no fallback if `graduationDate` is undefined/empty, could produce "Invalid Date" |
| `src/components/templates/ModernTemplate.tsx` | 30 | Default `sectionOrder` duplicates `useTemplateData.ts` line 30 and `ResumePreview.tsx` fallback — 3 sources of truth |
| `src/components/form/ExperienceForm.tsx` | 22 | `rafRefs` Map never cleaned up on unmount — rAF callbacks fire on detached DOM elements |
| `src/components/form/ExperienceForm.tsx` | 344 | `key={bIdx}` (array index) for bullet list — breaks if bullets ever reordered or filtered |
| `src/components/form/ExperienceForm.tsx` | 209 | Header card uses `onClick` for expand/collapse with no `onKeyDown` handler — keyboard-only users cannot toggle |
| `src/components/form/ExperienceForm.tsx` | 284, 296 | Date fields use `type="text"` with `"MM/YYYY"` placeholder — no `inputmode="numeric"` or `type="month"` |
| `src/components/form/ExperienceForm.tsx` | 299, 308 | End date input `disabled` when `exp.current` is true — `disabled` not focusable by screen readers |
| `src/components/form/ExperienceForm.tsx` | 313 | End date displays `"Present"` visually but `endDate` field may contain stale data — visual-only override |
| `src/components/form/ExperienceForm.tsx` | 213, 236 | Grip handle 16×16px, delete button 36px — both below 44px WCAG touch target |
| `src/components/form/EducationForm.tsx` | 167-174 | Delete button has `title="Delete School"` but no `aria-label` — `title` not exposed to all AT |
| `src/components/form/EducationForm.tsx` | 169 | Delete button `p-1.5` — ~26px touch target |
| `src/components/form/EducationForm.tsx` | 240-247 | GPA input uses `type="text"` — should be `type="number"` with `step="0.1"`, `min="0"`, `max="4"` |
| `src/components/form/EducationForm.tsx` | 250-254 | GPA warning uses emoji `⚠️` with no `role="alert"` or `aria-live="polite"` |
| `src/components/form/SkillsForm.tsx` | 122 | `allAvailableSkills.filter(s => skills.some(...))` — O(n×m) lookup, use `Set` for O(1) |
| `src/components/form/SkillsForm.tsx` | 138, 141 | `e.target as Node` — no null guard, could fail if `e.target` is not a `Node` |
| `src/components/form/SkillsForm.tsx` | 172-178 | `addSkill` captures `skills` from render closure — rapid clicks may cause duplicates |
| `src/components/form/SkillsForm.tsx` | 220-230 | Input uses `placeholder` as only label — no `aria-label` or associated `<label>` |
| `src/components/form/SkillsForm.tsx` | 245-246 | "Press Enter" hint visible on mobile (no keyboard) — use `hidden sm:inline` |
| `src/components/form/SkillsForm.tsx` | 267 | Skills container `max-h-[160px] overflow-y-auto` with no scroll indicator |
| `src/components/form/SkillsForm.tsx` | 277 | Remove chip button has no accessible name — `aria-label="Remove {skill}"` missing |
| `src/components/form/SkillsForm.tsx` | 309 | Industry dropdown `w-[200px]` may overflow on small screens |
| `src/components/form/SkillsForm.tsx` | 1 | `import React` unused (automatic JSX runtime) |
| `src/components/form/LanguagesForm.tsx` | 23 | `proficiency: 'Intermediate'` is hardcoded `string` — should be union type of valid values |
| `src/components/form/LanguagesForm.tsx` | 77 | Language name `<input>` has no `aria-label`, no `<label>`, no `id` |
| `src/components/form/LanguagesForm.tsx` | 84 | Proficiency `<select>` has no `aria-label`, no `<label>`, no `id` |
| `src/components/form/LanguagesForm.tsx` | 32-41 | `handleChange` captures `languages` from closure — rapid mutations use stale data |
| `src/components/form/LanguagesForm.tsx` | 46-52 | "Add Language" button ~36px — below 44px touch target |
| `src/components/PreviewSectionWrapper.tsx` | 1 | `eslint-disable react-refresh/only-export-components` disables rule for entire file — prefer per-line |
| `src/components/PreviewSectionWrapper.tsx` | 85, 88 | `sectionId as SectionKey` — unsafe cast, arbitrary string to union type |
| `src/components/PreviewSectionWrapper.tsx` | 96 | `aria-label` announces "Alt+Arrow keys to reorder" — doesn't work on Mac VoiceOver (uses Option+Arrow) |
| `src/components/PreviewSectionWrapper.tsx` | 116 | `onClick` on focusable `<div>` with no `onKeyDown` for Enter/Space |
| `src/components/PreviewSectionWrapper.tsx` | 137-164 | Floating controls: `pointerEvents: 'none'` but elements still in DOM — use `hidden` or `aria-hidden` |
| `src/components/PreviewSectionWrapper.tsx` | 155-164 | Edit button has `title` but no `aria-label` |
| `src/components/PreviewSectionWrapper.tsx` | 184 | `aria-label` constructed from props without sanitization — risk if props contain user text |
| `src/components/templates/TemplateSectionWrapper.tsx` | 13 | `onDrop?: () => void` — TypeScript allows (fewer params) but actual handler never receives `DragEvent`, breaking features needing `e.dataTransfer` |
| `src/components/templates/ModernTemplate.tsx` | 264 | `getFullName(contact) \|\| 'YOUR NAME'` — fallback text visible in printed PDF |
| `src/components/AtsChecker.tsx` | 243-257 | `useState` initializer captures `resumeData` only on mount — loading a new resume without page refresh reuses old scan state |
| `src/components/AtsChecker.tsx` | 280-282 | `hashResume` is `useCallback` wrapping a pure module-level function — pointless indirection |
| `src/components/AtsChecker.tsx` | 292-300 | Side-effect during render (`dataRef.current = ...`, localStorage reads) — should be `useEffect` |
| `src/components/AtsChecker.tsx` | 302-306 | `hasInitializedRef` set to `true` but never read anywhere — dead code |
| `src/components/AtsChecker.tsx` | 389 | `resumeDomain as RoleDomain`, `jdDomain as RoleDomain` — unsafe casts, no runtime validation |
| `src/components/AtsChecker.tsx` | 436-438 | `toggleExpandIssue` plain function — new reference every render, defeats memo on hundreds of child issue items |
| `src/components/AtsChecker.tsx` | 1461-1555 | Large `(() => { ... })()` IIFE inside JSX evaluated every render — contains `.reduce()`, `.filter()`, `.map()` over 150+ verb entries |
| `src/components/AtsChecker.tsx` | 1516-1526 | Verb category buttons re-create filter + map every render |
| `src/components/AtsChecker.tsx` | 1392-1400 | `setTimeout(() => setCopiedBullet(false), 2000)` with no cleanup — rapid clicks accumulate timers |
| `src/components/AtsChecker.tsx` | 1704 | Skill overview cards use color-only match indicators — color-blind users cannot differentiate |
| `src/components/AtsChecker.tsx` | passim | All SVG icons (`lucide-react`) lack `aria-hidden="true"` — decorative elements read by screen readers |
| `src/components/AtsChecker.tsx` | passim | No `role="tablist"`/`role="tab"`/`aria-selected` on tab navigation bars |
| `src/components/AtsChecker.tsx` | 658-683 | Scan log terminal is purely visual — no `aria-live="polite"`, screen readers never announce stage updates |
| `src/components/AtsChecker.tsx` | passim | Hardcoded `w-24 h-24` for scan progress ring — may overflow on <360px screens |
| `src/components/AtsChecker.tsx` | 863-892 | `report?.categories.map(...)` — if `report` is truthy but `categories` is missing, throws `Cannot read properties of undefined` |
| `src/components/Toast.tsx` | 56-57 | Status icon has no `aria-hidden="true"` |
| `src/components/Toast.tsx` | 10-13 | Timer cleanup during unmount: `timersRef.current.delete(timer)` could run after unmount |
| `src/components/ErrorBoundary.tsx` | 3-5 | `fallback: ReactNode` should be `ReactElement` to avoid rendering raw strings |
| `src/components/ErrorBoundary.tsx` | 12 | No `onError` callback prop to notify parent components |
| `src/components/ErrorBoundary.tsx` | 18-20 | `getDerivedStateFromError` receives `error` but ignores it — no log or storage |
| `src/components/BentoDashboard.tsx` | 161-164 | Section titles use `uppercase` — screen readers may read abbreviations letter-by-letter |
| `src/components/BentoDashboard.tsx` | 222-228 | Skills badges use color-only for "+N more" label |
| `src/components/BentoDashboard.tsx` | 308 | `border-border/40` — non-standard Tailwind utility, depends on undefined CSS custom property |
| `src/components/BentoDashboard.tsx` | 155 | Icon backgrounds use color-only (`bg-red-500/10 border border-red-500/20`) |
| `src/components/BentoDashboard.tsx` | 271 | Interest badges `bg-pink-500/10 text-pink-400` — verify contrast on dark bg |
| `src/layouts/EditorLayout.tsx` | 298 | `URL.createObjectURL(blob)` revoked immediately at line 279 before download starts — Firefox may cancel |
| `src/layouts/EditorLayout.tsx` | 228 | `EMPTY_RESUME_TEMPLATE` defined at module scope but only used in `SimpleSettingsModal` — co-locate |
| `src/layouts/EditorLayout.tsx` | 460 | `handlePrint` useCallback depends on `resumeData` — invalidates on every edit |
| `src/layouts/EditorLayout.tsx` | 662 | User dropdown uses `onBlur` + `setTimeout(150)` — fragile, not keyboard-friendly |
| `src/layouts/EditorLayout.tsx` | 355 | `e.target.value as Template` — unsafe cast on select value |
| `src/layouts/EditorLayout.tsx` | 486 | `importResumeData({ ...projects: [] })` — partial ResumeData missing optional fields |
| `src/layouts/EditorLayout.tsx` | 516 | `<header>` is `sticky top-0` but parent `h-screen overflow-hidden` makes `sticky` inert |
| `src/layouts/EditorLayout.tsx` | 641 | Settings button uses `title` attribute instead of `aria-label` for icon-only button |
| `src/layouts/EditorLayout.tsx` | 538 | Resume name button `max-w-[160px]` — long titles unreadably clipped on mobile |
| `src/layouts/EditorLayout.tsx` | 659 | User avatar `alt=""` — should be descriptive or `role="presentation"` |
| `src/types/resume.ts` | 41-44, 91-93 | `Project` has both `date` and `startDate`/`endDate` — confusing. `Volunteer` has `period` AND `startDate`/`endDate` — duplicate date representation |
| `src/types/resume.ts` | 96 | `skills: string[]` required — `EMPTY_RESUME_TEMPLATE` uses `['']` (empty string array) instead of `[]`, making `""` appear in keyword matching |
| `src/types/resume.ts` | 148 | `sectionCutStyle: 'none'` maps to `cut-style-none` — no CSS rule exists for `cut-style-none` (no style applied, acceptable but inconsistent) |

---

## 🔵 Low (cosmetic, conventions, minor)

- 30+ additional items: unused imports, `text-[7px]`–`text-[10.5px]` font sizes, inline styles creating new refs per render, hardcoded route strings (x3), `new Date().getFullYear()` in render path, repeated `@media (prefers-reduced-motion)` with different approaches, inconsistent file naming (`ToastContext.ts` vs `.tsx`), `select-none` preventing text copy, mix of English and French UI text, magic number `1` at EditorLayout:293, `as const` not used where applicable, etc.

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 18 |
| 🟠 High | 46 |
| 🟡 Medium | 74 |
| 🔵 Low | 30+ |

Key themes:
- **Zero tests** — not a single unit, integration, or e2e test
- **No screen reader support** — toasts, modals, drawers, tabs, error states all lack proper ARIA
- **God object ResumeContext** (674 lines) — undo, localStorage, cloud sync, merge in one blob
- **Correctness bugs** — history index, hash collision, stale closure in STAR fields
- **2330-line ATS evaluator** — 80% duplication, ~8× redundant text extraction
- **20+ non-standard Tailwind classes** that silently do nothing
- **React performance issues** — inline functions everywhere, no `useCallback` on 10+ handlers, context values created per render, no `React.memo` on any component
