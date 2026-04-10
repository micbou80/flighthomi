# FlightHomi

A personal flight tracker with live status, family sharing, and iMessage notifications.

**Live:** https://flighthomi.vercel.app

---

## Features

### Dashboard
- **Flight dashboard** — add, edit and delete flights; grouped into trips
- **Auto-fill** — enter a flight number and date to pull live data from FlightAware AeroAPI
- **Status tracking** — scheduled, taxiing, in air, landed, cancelled
- **Past trips** — collapsed history view with per-trip stats (air time, delay, aircraft)
- **Flight calendar** — sidebar calendar view with departure dots

### Live flight data (updated every 5 min)
- **Status badges** — scheduled / taxiing / in air / landed / cancelled
- **Progress bar** — live position on timeline when airborne, elapsed and remaining time
- **Live map** — interactive Leaflet map with track history, plane position, and projected route to destination
- **Delay tracking** — departure and arrival delays shown in amber; strikethrough original time with updated ETA
- **Gate info** — departure and arrival gates with red highlight on gate changes
- **Baggage carousel** — shown on landing
- **Weather at destination** — temperature and weather emoji, updated hourly, hidden after landing

### Notifications (iMessage via LaunchAgent)
- **New flight registered** — immediate confirmation when a flight is added
- **Pre-flight brief** — 3h before departure: gate, timing status, inbound aircraft delay, weather at destination
- **Boarding alert** — ~45 min before departure when gate is assigned: "Head to the gate now"
- **Status changes** — taxiing, airborne, landed, cancelled
- **Gate changes** — departure and arrival gate updates
- **Delay alerts** — when delay increases (or clears)
- **Catch-up alerts** — if a briefing was missed and the flight is already airborne
- **Connection risk** — warns when a delay makes a connection tight (< 45 min buffer)

### Extra info on the card
- **Gate countdown** — when gate is assigned and departure is < 2h away, shows "Boarding in Xm" with traffic-light colours (green → amber → red)
- **On-time stats** — "73% on time" shown on scheduled flights, based on last 60 days of FlightAware history
- **Live approach** — when a flight is < 20 min from landing, a "Live approach →" link opens Flightradar24 for that flight

### Sharing
- **Family share links** — generate a private token; recipients see a read-only view with no account required
- **Share itinerary** — one tap shares or copies a clean text summary of upcoming flights for pasting into Messages

---

## iMessage notification pipeline

```
LaunchAgent (every 5 min)
  └─ ~/.local/bin/flighthomi-notify.sh
       ├─ curl → /api/cron/check-flights        (refresh Supabase from FlightAware)
       ├─ claude -p → JSON array to stdout       (detect changes, write ~/.flighthomi-state.json)
       └─ osascript → iMessage                   (deliver each notification)
```

State is persisted at `~/.flighthomi-state.json`. Multi-user: one `user_profiles.imessage_handle` row per person, no script changes needed.

---

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) — Postgres, Auth, Row Level Security
- [FlightAware AeroAPI](https://www.flightaware.com/commercial/aeroapi/) — live flight data, history
- [AviationStack](https://aviationstack.com) — fallback for flights > 3 days out
- [Open-Meteo](https://open-meteo.com) — free weather API (no key required)
- [Leaflet.js](https://leafletjs.com) — interactive flight maps
- [Tailwind CSS](https://tailwindcss.com)
- Deployed on [Vercel](https://vercel.com)

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/micbou80/flighthomi.git
cd flighthomi
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `FLIGHTAWARE_API_KEY` | FlightAware AeroAPI dashboard |
| `AVIATIONSTACK_API_KEY` | AviationStack dashboard (optional) |
| `CRON_SECRET` | Any secret string — used to authenticate the cron route |

### 3. Run migrations

In the Supabase SQL editor, run in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_share_tokens.sql
supabase/migrations/003_flight_tracking.sql
supabase/migrations/004_user_profiles.sql
supabase/migrations/005_baggage_weather.sql
```

### 4. Create your user account

Supabase → Authentication → Users → Add user. No public sign-up by design.

### 5. Start dev server

```bash
npm run dev
```

---

## iMessage notification setup

Requires macOS with Messages signed in to iMessage.

1. Install Claude Code CLI
2. Copy the notify script: `~/.local/bin/flighthomi-notify.sh`
3. Create `~/.flighthomi.env` with `CRON_SECRET=your_secret`
4. Set up the LaunchAgent plist at `~/Library/LaunchAgents/com.flighthomi.notify.plist`
5. Load it: `launchctl load ~/Library/LaunchAgents/com.flighthomi.notify.plist`

---

## Database schema

```
flights        — user flights (RLS: owner only)
share_tokens   — read-only share links (RLS: owner only)
user_profiles  — imessage_handle per user for notifications
auth.users     — managed by Supabase Auth
```

---

## Deployment

Auto-deploys from the `main` branch on Vercel. Set all environment variables in Vercel → Settings → Environment Variables, then trigger a redeploy for `NEXT_PUBLIC_*` values to take effect.
