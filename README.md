# Relo

Relo is a production-grade MVP for event relationship intelligence: attendee matching, QR meeting logging, offline capture, follow-up drafts, and organizer analytics.

## Stack

- Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn-style local UI primitives
- Supabase Auth, Postgres, Realtime-ready schema, Storage-ready profile photos, Row Level Security
- Small Zustand store for demo/session state, with typed Supabase repositories for production data access
- PWA manifest, service worker, IndexedDB offline meeting queue
- OpenAI-compatible AI abstraction with DeepSeek/OpenAI support and deterministic mock fallback
- PostHog hook wrapper

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app ships with realistic local demo data, so it can be demoed before Supabase keys are configured. Add keys from `.env.example` to enable live auth/data integration work.

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

## Demo Flow

1. Go to `/signup` or `/login` and use the demo access button.
2. Open `/dashboard/events` and create an event.
3. Open an event detail page and import attendees via CSV.
4. Visit `/events/relo-summit-2026/matches` to see ranked recommendations.
5. Visit `/events/relo-summit-2026/scan` to log meetings. Offline submissions queue in IndexedDB and sync when online.
6. Review organizer metrics on `/dashboard/events/relo-summit-2026` and attendee recap at `/events/relo-summit-2026/recap`.

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
