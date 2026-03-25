# Platform Roadmapping Tool — Claude Code Instructions

> Read this before touching any code.

---

## What This App Is

A roadmapping tool for RMG's Platform & Build function. It replaces PowerPoint-based roadmaps with a structured, live, interactive alternative — allowing the team to maintain, filter, and present platform roadmaps without the manual overhead of keeping slides up to date.

**Live URL:** https://platform-roadmap-poc.vercel.app
**Status:** PoC — two variants built, rewrite in progress with Claude
**Stack:** React (Vite), [Supabase / localStorage], Vercel

---

## Golden Rules

### 1. Always write unit tests
Every new component, hook, utility function, or data access function must have a unit test. Use Vitest. Tests live in `__tests__/` adjacent to the file they test. Do not ship untested code.

### 2. CRUD is always a requirement
If a user can **create** something, they can also **edit** and **delete** it. No exceptions. If you build an add form, you also build the edit form and delete confirmation. Always.

### 3. Confirm before destructive actions
Any delete must show a confirmation prompt. No silent deletes.

### 4. Dates in UK format
All user-facing dates in `en-GB` format: `24 Mar 2026`. Never ISO strings in the UI.

### 5. No hardcoded credentials
Secrets go in `.env.local` only. Never in source code.

### 6. Roadmap items have time horizons
Items on the roadmap are associated with a time period (quarter, half-year etc.). Display logic must respect this — don't show items in the wrong period.

### 7. Keep components focused
Files under 300 lines where possible.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Data | [Supabase / localStorage] |
| Deployment | Vercel (auto-deploys from main branch) |
| Testing | Vitest |

---

## Key Features

- Timeline / roadmap view by quarter or half
- Add, edit, delete roadmap items
- Filter by team, theme, or status
- Presentable in full-screen view
- Shareable / exportable

---

## History

This app was initially built with ChatGPT Codex (two variants) before being rewritten with Claude. The Claude version is the one to continue with. Do not reference or restore the ChatGPT variants.

---

## What Not to Do

- Do not hard delete records — soft delete only
- Do not hardcode credentials
- Do not build create without edit and delete
- Do not skip tests
- Do not reference or restore earlier ChatGPT-built variants

---

## Current Focus

Last session: [Date] — [What was done]
Next session: [What needs doing next]

---

*Last updated: 25 March 2026*
