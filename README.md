# Flighthomi ✈

A personal flight tracker with family sharing. Add your upcoming flights, track their status, and share a read-only view with family via a private link.

**Live:** https://flighthomi.vercel.app

## Features

- **Flight dashboard** — add, edit and delete upcoming flights
- **Auto-fill** — enter a flight number and date to pull live data from FlightAware AeroAPI
- **Status tracking** — scheduled, in air, landed, cancelled
- **Family sharing** — generate a private share link; recipients see a read-only view with no account required
- **Auth** — email/password login via Supabase Auth, protected by Row Level Security

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) — Postgres database, Auth, Row Level Security
- [FlightAware AeroAPI](https://www.flightaware.com/commercial/aeroapi/) — live flight data (optional)
- [Tailwind CSS](https://tailwindcss.com)
- Deployed on [Vercel](https://vercel.com)

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/micbou80/flighthomi.git
cd flighthomi
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` key |
| `FLIGHTAWARE_API_KEY` | FlightAware AeroAPI dashboard (optional) |

### 3. Run the database migration

In the Supabase SQL editor, run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates the `flights` and `share_tokens` tables with Row Level Security policies.

### 4. Create your user account

In Supabase → Authentication → Users → Add user, create an account with your email and password. There is no public sign-up form by design.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database schema

```
flights        — user's flights (RLS: owner only)
share_tokens   — private share links (RLS: owner only)
auth.users     — managed by Supabase Auth
```

## Deployment

The app is deployed on Vercel connected to the `main` branch. Set the four environment variables in **Vercel → Settings → Environment Variables**, then redeploy for `NEXT_PUBLIC_*` values to be baked into the client bundle.
