# Yeah Buddy

Telegram Mini App: food diary and gym log. One Next.js deploy on Vercel — Mini App UI (Russian, mobile), HTTP API, and the bot webhook.

## What it does

Bottom nav: **Today · Workouts · Settings**. Foods live under Settings, not as their own tab.

**Food**

- A day is rest or training. That switches macro targets and which meals show (snack on rest days; pre/post workout on training days).
- Meals: breakfast, lunch, snack / pre–post, dinner. Pick a food, enter grams, get protein / fat / carbs / kcal.
- Your own food list: CRUD, search, favorites, recents. No external catalogs.
- A new day is copied from the rest or training meal template (edited in Settings), or from yesterday.
- Past days on Today are view-only. Food history: macros by day and averages. Rest/training targets live in Settings.

**Gym**

- A queue of templates (dynamic / static), not a weekday calendar.
- Skip moves the circle without taking the date; you can put a template back.
- Optional macrocycle: ramp → volume → peak → deload. Finishing a queue loop does not close the phase by itself.
- A session is a cheatsheet and a log: planned weights from the scheme, actuals in history and on charts. Edit the scheme in Settings.
- Progress (working weights), session history, exercise list.

Screens first show the last successful API response from `localStorage` (`src/lib/api-cache.ts`), then refresh from the network. Offline, the last known data stays.

## Stack

Next.js App Router, TypeScript, Tailwind, shadcn/ui, grammY. Postgres in Supabase — server only, service role. Auth: Telegram `initData` → HTTP-only cookie (`session`, JWT, 7 days).

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Variables (see `.env.example` and `src/lib/env.ts`):

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server key, never in the client |
| `TELEGRAM_BOT_TOKEN` | yes | bot token, never in the client |
| `SESSION_SECRET` | yes | session signing key, ≥ 32 characters |
| `NEXT_PUBLIC_APP_URL` | no | app URL; fallback for the Mini App button |
| `TELEGRAM_MINI_APP_URL` | no | Mini App HTTPS URL (takes priority) |

Migrations: `supabase/migrations/0001_init.sql` … `0011_drop_session_kind.sql` — apply in order in the SQL Editor or with the Supabase CLI.

Bot: `/start` and an “Open diary” button when an **https** URL is set (`TELEGRAM_MINI_APP_URL` or `NEXT_PUBLIC_APP_URL`). Webhook: `POST /api/telegram/webhook`. On Bot API 8.0+ the Mini App requests fullscreen; in @BotFather enable fullscreen on the Main Mini App / Menu Button (or use `mode=fullscreen` on the t.me link) if the client still shows the header.

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram/webhook
```

Outside Telegram, `next dev` logs in via `POST /api/auth/dev` (404 in production). A new account gets starter foods, meal templates, and exercises without maxes. First visit with no history opens onboarding.

Scripts: `npm run dev` · `build` · `start` · `lint` (`biome check`) · `format`.

## Repo map

```text
src/app/(app)/     Mini App screens
src/app/api/       HTTP API and bot webhook
src/components/    day, foods, workout, settings, layout, ui
src/lib/           domain, auth, telegram, supabase, cache
src/lib/workout/   templates, sessions, macrocycles, formulas
supabase/migrations/
```

## Limits

- Own food list only. No external APIs, barcodes, or parsers.
- The browser never talks to Supabase. `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_BOT_TOKEN` stay on the server.
- UI is built for Telegram Mini App, Russian, narrow screen.
