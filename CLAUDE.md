# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

No test suite exists in this project.

## Environment

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FLIGHTAWARE_API_KEY=      # optional — enables auto-population in FlightForm
```

Users must be created manually via the Supabase Auth dashboard (no self-registration).

## Architecture

Next.js 14 App Router + Supabase (Postgres + Auth) + FlightAware AeroAPI. Deployed on Vercel.

### Route structure

- `(auth)/` — public login page, redirects to `/dashboard` on auth
- `dashboard/` — protected; server components fetch flights with RLS-scoped Supabase client
- `shared/` — public read-only view gated by share token (no auth required)
- `api/flights/` — CRUD for flights (auth required)
- `api/flight-lookup/` — proxy to FlightAware AeroAPI (auth required)
- `api/share-tokens/` — create/delete share tokens (auth required)

`middleware.ts` refreshes session cookies on every request and redirects:
- unauthenticated → `/dashboard` becomes → `/`
- authenticated → `/` becomes → `/dashboard`

### Supabase clients

Two clients in `src/lib/supabase/`:
- `client.ts` — browser client (`createBrowserClient`), respects RLS, used in client components
- `server.ts` — exports `createClient()` (RLS-scoped, for most server operations) and `createServiceClient()` (service role, bypasses RLS — use sparingly)

### Data models (`src/lib/types.ts`)

`FlightStatus`: `'scheduled' | 'in_air' | 'landed' | 'cancelled'`

`Flight` stores IATA codes for `origin`/`destination`, ISO timestamps for `departure_time`/`arrival_time`, and an optional `seat` and `notes`.

`ShareToken` links a user to a short random token; the `/shared` page validates the token and renders flights in read-only mode.

### FlightAware integration

`src/lib/flightaware.ts` wraps the AeroAPI. Called from `/api/flight-lookup` with `?fn=<flight_number>&date=<YYYY-MM-DD>`. Returns enriched flight details used to pre-fill `FlightForm`. Gracefully returns `null` on 404 (flight not found).

### Database

Migrations live in `supabase/migrations/`. RLS policies ensure users can only access their own rows in `flights` and `share_tokens`. The service role client is required for any operation that crosses user boundaries.
