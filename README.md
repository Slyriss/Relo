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
5. Enable email/password auth and add Google OAuth credentials in Supabase Auth providers.
6. For direct migration runs, set `SUPABASE_DB_URL` to a Supabase pooler Postgres URI and run `npm run db:migrate`.

### Google OAuth production branding

Google OAuth branding is configured outside this repo:

1. Add a custom Supabase auth domain such as `auth.relo.app`.
2. In Google Cloud Console, set the OAuth consent app name/logo to the production Relo brand.
3. Add Supabase callback URLs for local and production, including `http://localhost:3000/auth/callback` and `https://auth.relo.app/auth/v1/callback`.
4. In Supabase Auth, enable Google and confirm the provider uses the same Client ID/secret and redirect domain.

## Live Flow

1. Go to `/signup` or `/login` and authenticate with email/password or Google.
2. Open `/dashboard/events` and create an event.
3. Open an event detail page and import attendees via CSV.
4. Open the attendee event URL to see ranked recommendations.
5. Visit the scan page to log meetings. Offline submissions queue in IndexedDB and sync when online.
6. Review organizer metrics in the admin event view and attendee recap from the participant event view.

## Internal QA Seed

For local QA, seed internal Supabase Auth accounts and sample event data with:

```bash
npm run seed:demo-accounts
```

These accounts are for internal testing only. The public product UI does not expose sample access or sample credentials.

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
