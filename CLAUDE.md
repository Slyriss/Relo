# Relo — CLAUDE.md

## What this project is

Relo is a production-grade MVP for event relationship intelligence. Core features: attendee matching (scored by goals, industry, seniority), QR badge scanning, offline meeting logging via IndexedDB, AI-generated follow-up drafts, and organizer analytics. It ships with demo data so it runs without any backend configured.

## Stack

- **Next.js 14 App Router** — all pages under `src/app/`. Use the App Router pattern; no `pages/` directory.
- **TypeScript strict** — all types live in `src/types/index.ts`. Keep them lean; no DTOs duplicating the same shape.
- **Tailwind CSS** with local UI primitives in `src/components/ui/` (shadcn-style, not the shadcn CLI).
- **Zustand v5** (`src/lib/store.ts`) is the sole client state store — demo data + session state. No server fetching is wired up yet.
- **Supabase** — client in `src/lib/supabase/client.ts` returns `null` when env vars are absent (safe for demo mode).
- **OpenAI** abstracted behind `src/lib/ai/provider.ts`. Falls back to deterministic mock when `OPENAI_API_KEY` is absent.
- **PWA** — `public/manifest.webmanifest` + `public/sw.js` (cache-first service worker, generic shell only).
- **Vitest** + jsdom for unit tests. **Playwright** for E2E tests.

## Running the project

```bash
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:3000
```

The app works fully offline with demo data — no env vars needed to explore it. Open http://localhost:3000 and click **Launch demo** or **Attendee mode**.

## Running tests

```bash
npm test                  # Vitest unit tests (fast, no browser)
npm run test:e2e          # Playwright E2E — auto-starts the dev server, runs 22 tests
npm run test:e2e:ui       # Playwright interactive UI (pick tests, watch DOM live)
npm run test:e2e:report   # Open the last HTML test report in a browser
npm run seed              # Seed a live Supabase DB (requires SUPABASE_SERVICE_ROLE_KEY)
```

## Key file map

| Path | Purpose |
|---|---|
| `src/types/index.ts` | Canonical domain types |
| `src/lib/store.ts` | Zustand store + selector hooks (`useEvent`, `useRecommendations`) |
| `src/lib/demo-data.ts` | Seed data — 20 attendees, 1 event, 3 meetings |
| `src/lib/ai/matching.ts` | Pure scoring logic — no side effects |
| `src/lib/ai/provider.ts` | AI provider abstraction (server-side, OpenAI or mock) |
| `src/lib/ai/followup.ts` | Deterministic mock follow-up text |
| `src/lib/csv.ts` | CSV import parser + goal/industry inference |
| `src/lib/offline/meeting-queue.ts` | IndexedDB offline queue |
| `src/lib/env.ts` | Zod-validated env vars |
| `middleware.ts` | Route protection (Supabase session check) |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema + RLS policies |
| `supabase/migrations/002_meetings_add_note.sql` | Adds `note` column to meetings (run on existing DBs) |
| `e2e/fixtures.ts` | Playwright auth fixture (injects fake `sb-*` cookie) |

## Zustand selector rule — always use `useShallow` for arrays

**This is the most important code convention in this project.**

Zustand v5 uses `Object.is` equality on selector results. A selector like:
```ts
useAppStore((state) => state.attendees.filter(...))
```
creates a **new array reference on every call**. When any part of the store mutates (e.g. `logMeeting`, `addAttendees`), Zustand re-runs the selector, gets a new array, and schedules a re-render — which re-runs the selector again, causing an infinite loop ("Maximum update depth exceeded").

**Always wrap array/object selectors with `useShallow`:**
```ts
import { useShallow } from "zustand/react/shallow";

// Wrong — causes infinite re-renders after any store mutation
const attendees = useAppStore((state) => state.attendees.filter(...));

// Correct — shallow compares array elements, re-renders only when content changes
const attendees = useAppStore(useShallow((state) => state.attendees.filter(...)));
```

Scalar selectors (strings, numbers, functions) are fine without `useShallow` because `Object.is` compares them by value/reference and they don't change.

## AI follow-up API

`POST /api/followup` — accepts `{ meeting, sender, recipient }` (typed from `src/types/index.ts`). Returns `{ draft: string }`. Calls `aiProvider.generateFollowup` server-side; falls back to the deterministic mock when `OPENAI_API_KEY` is absent. `ScanPanel` calls this automatically after logging an online meeting and renders the draft inline.

## Conventions

- Route params typed as `{ params: { id: string } }` — Next.js 14 plain objects.
- All client components that touch the store need `"use client"` at the top.
- Env vars accessed only via `src/lib/env.ts`, never raw `process.env`.
- CSS class merging via `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge).
- Dashboard auth in tests uses the `authedPage` fixture from `e2e/fixtures.ts` — it injects a fake `sb-*` cookie so middleware lets the test through without a real Supabase session.

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need:

| Variable | Required for | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Absolute URLs in emails | `http://localhost:3000` |
| `NEXT_PUBLIC_DEMO_MODE` | Bypass auth in middleware | `false` |
| `NEXT_PUBLIC_SUPABASE_URL` | Live auth + data | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Live auth + data | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script | — |
| `OPENAI_API_KEY` | Real AI follow-ups | uses mock |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics | silent no-op |
| `NEXT_PUBLIC_POSTHOG_HOST` | Analytics | `https://app.posthog.com` |

> **Never set `NEXT_PUBLIC_DEMO_MODE=true` in staging or production.** It bypasses all authentication.

## Supabase setup (optional)

1. Create a project at supabase.com.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
3. Run `supabase/migrations/002_meetings_add_note.sql` if upgrading an existing DB.
4. Enable Magic Link and Google OAuth in Supabase Auth → Providers.
5. Set the four Supabase env vars in `.env.local`.
6. Optionally run `npm run seed` to populate sample data.
