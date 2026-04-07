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
FLIGHTAWARE_API_KEY=        # optional — enables auto-population in FlightForm
AVIATIONSTACK_API_KEY=      # optional — fallback for flights >3 days out
```

Users must be created manually via the Supabase Auth dashboard (no self-registration).

**Important:** `NEXT_PUBLIC_` vars are baked in at build time. Changing them in Vercel requires a full rebuild triggered by a new commit — the Vercel "Redeploy" button reuses the cached build artifact and will not pick up changes.

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

`FlightStatus`: `'scheduled' | 'taxiing' | 'in_air' | 'landed' | 'cancelled'`

`Flight` core fields: IATA codes for `origin_code`/`destination_code`, ISO timestamps for `departure_time`/`arrival_time`, optional `seat` and `notes`.

`Flight` tracking fields (populated from FlightAware, all nullable):
- `actual_departure_time` / `actual_arrival_time` — wheels-up / wheels-down times
- `estimated_arrival_time` — live ETA
- `progress_percent` — FA's 0–100 progress value
- `departure_delay` / `arrival_delay` — delay in minutes
- `departure_gate` / `arrival_gate`
- `route` — raw waypoint string
- `fa_flight_id` — FlightAware's stable flight ID (used for track fetches)
- `last_lat` / `last_lon` / `last_heading` / `last_altitude` — current position
- `track_points` — JSONB array of `{lat, lon}` objects for the flight path polyline

`ShareToken` links a user to a short random token; the `/shared` page validates the token and renders flights in read-only mode.

### FlightAware integration

`src/lib/flightaware.ts` wraps the AeroAPI. Called from `/api/flight-lookup` with `?fn=<flight_number>&date=<YYYY-MM-DD>`. Populates both the form fields and all tracking fields. Delay values from the API are in seconds and converted to minutes on ingest. Returns `null` on 404, **throws** for dates outside FlightAware's data range.

`getFlightTrack(faFlightId)` fetches the `GET /flights/{id}/track` endpoint and returns an array of `{lat, lon}` objects.

The cron route (`api/cron/check-flights`) skips FlightAware API calls for scheduled flights whose departure is >3 hours away. For in-air/taxiing flights it also calls `getFlightTrack` and saves the result to `track_points`.

### AviationStack fallback

`src/lib/aviationstack.ts` is called by `/api/flight-lookup` when FlightAware throws (out-of-range date) or returns null. It uses the `/flights?flight_iata=` endpoint. Free-tier quirks:

- The `flight_date` filter returns HTTP 403 — this is caught and treated as "try without date"
- Returned times are labeled `+00:00` but are actually **local airport times**. The module extracts raw HH:MM and returns them as bare ISO strings (e.g. `"2026-04-13T07:25:00"` with no timezone suffix) so `toDatetimeLocal` in `FlightForm.tsx` passes them through without a UTC offset conversion.

### Flight map

`src/components/FlightMap.tsx` uses Leaflet + react-leaflet with CartoDB Dark Matter tiles. It is always imported via `next/dynamic` with `ssr: false` because Leaflet requires `window`. Displays a green polyline for `track_points` and a rotated ✈ icon at the current position. The map renders below the `FlightCard` for in-air flights.

### Background data refresh (macOS)

**Do not use crontab.** The cron daemon can't read files from iCloud Drive (`~/Library/Mobile Documents/`). A LaunchAgent runs instead:

- Plist: `~/Library/LaunchAgents/com.flighthomi.notify.plist`  
- Script: `~/.local/bin/flighthomi-notify.sh` (non-iCloud path)
- Interval: every 300 seconds

The `RefreshBar` component does not call the API — it only reloads the page. The LaunchAgent is the sole updater of live flight data in the database.

### Database

Migrations live in `supabase/migrations/`. RLS policies ensure users can only access their own rows in `flights` and `share_tokens`. The service role client is required for any operation that crosses user boundaries.

Migration `002_flight_track.sql` added `fa_flight_id`, `last_lat`, `last_lon`, `last_heading`, `last_altitude`, `track_points` columns and updated the status constraint to include `'taxiing'`.
