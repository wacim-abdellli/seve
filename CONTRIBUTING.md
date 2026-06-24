# Contributing to Seve

Thanks for your interest! Seve is a free, open-source resume builder with a built-in ATS checker.

## Local setup

```bash
git clone https://github.com/wacim-abdellli/seve.git
cd seve
npm install
cp .env.example .env
# Open .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
# App runs at http://localhost:5173
```

## Running tests

```bash
npm test              # run all tests once
npm run test:watch    # watch mode while developing
```

## Commit style

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use when |
|--------|----------|
| `feat:` | Adding a new feature |
| `fix:` | Fixing a bug |
| `test:` | Adding or updating tests |
| `refactor:` | Restructuring code without changing behavior |
| `docs:` | Documentation only |
| `ci:` | CI/CD config changes |
| `clean:` | Removing files or dead code |
| `chore:` | Tooling or dependency updates |

## Before opening a PR

Run these three commands — all must pass with zero errors:

```bash
npm run lint    # must show 0 problems
npm test        # must show all tests passed
npm run build   # must complete without errors
```

Also check:
- No new `console.log` or unguarded `console.error` added to `src/`
- No `any` types — use `unknown` + type guards instead
- No ref mutations at component top level — always use `useEffect`

## Project structure

```
src/
  components/          UI components
  components/ats/      ATS checker sub-components
  components/form/     Form inputs per resume section
  components/templates/ The 10 resume templates
  context/             App state
    ResumeDataContext  Resume CRUD, undo/redo, local storage
    ResumeSyncContext  Supabase cloud sync
  hooks/               Custom React hooks
  layouts/             Page layout wrappers
  pages/               Route-level pages
  utils/               ATS scoring engine (pure TypeScript, no React)
  types/               TypeScript interfaces
```

## Architecture principles

- **Local-first:** All resume data lives in `localStorage`. Supabase sync is opt-in.
- **ATS engine is pure TS:** Everything in `src/utils/ats*.ts` has no React dependency and is fully unit-testable.
- **No `any` types:** Always use `unknown` with a type guard or `Record<string, unknown>`.
- **No ref-during-render:** Never write `ref.current = value` at component top level. Always do it inside `useEffect`.
- **No console in production:** Wrap all `console.*` calls with `if (import.meta.env.DEV)`.
