# Relo

Relo is a production-grade MVP for event relationship intelligence: attendee matching, QR meeting logging, offline capture, follow-up drafts, and organizer analytics.

## Stack

- Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn-style local UI primitives
- Supabase Auth, Postgres, Realtime-ready schema, Storage-ready profile photos, Row Level Security
- Client workspace store synchronized through typed Supabase-backed API routes
- PWA manifest, service worker, IndexedDB offline meeting queue
- OpenAI-compatible AI abstraction with DeepSeek/OpenAI support and deterministic mock fallback
- PostHog hook wrapper

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Configure Supabase keys from `.env.example` before running the app. Auth, event creation, attendee imports, check-ins, meeting logs, and intro requests use live workspace data.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run db:migrate
npm run db:verify
npm run seed
```

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Optionally run `supabase/seed.sql`.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. Enable magic link auth and add Google OAuth credentials in Supabase Auth providers.
6. For direct migration runs, set `SUPABASE_DB_URL` to a Supabase pooler Postgres URI and run `npm run db:migrate`.

## Live Flow

1. Go to `/signup` or `/login` and authenticate with magic link or Google.
2. Open `/dashboard/events` and create an event.
3. Open an event detail page and import attendees via CSV.
4. Open the attendee event URL to see ranked recommendations.
5. Visit the scan page to log meetings. Offline submissions queue in IndexedDB and sync when online.
6. Review organizer metrics in the admin event view and attendee recap from the participant event view.

## Demo Accounts

Seed real Supabase Auth demo accounts with:

```bash
npm run seed:demo-accounts
```

Then sign in from `/login` with one of the demo account buttons:

```text
Organizer: organizer@relo.demo / ReloDemo2026!
Participant: participant@relo.demo / ReloDemo2026!
```

These are real Supabase password accounts backed by seeded organization, event, attendee, meeting, check-in, and intro-request records.

## CSV Columns

```csv
name,email,company,title,linkedin_url,bio
```

## Production Notes

- RLS policies are included in the migration and scoped by organization membership, attendee identity, and organizer role.
- `src/lib/ai/provider.ts` uses DeepSeek when `DEEPSEEK_API_KEY` is available, OpenAI when `OPENAI_API_KEY` is available, otherwise polished deterministic drafts.
- `src/lib/offline/meeting-queue.ts` owns offline persistence and sync hooks.
- `src/lib/posthog.ts` is safe when analytics keys are absent.
- `src/lib/data/*` contains typed Supabase repositories and snake_case/camelCase mappers.
