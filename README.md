# Yeah Buddy

Telegram Mini App: food diary and gym log. One Next.js deploy on Vercel — Mini App UI (Russian, mobile), HTTP API, and the bot webhook.

## What it does

Bottom nav: **Today · Workouts · Settings**. Foods live under Settings, not as their own tab.

**Food**

- A day is rest or training. That switches macro targets and which meals show (snack on rest days; pre/post workout on training days). Body weight is one number on the day, next to leftover protein.
- Meals: breakfast, lunch, snack / pre–post, dinner. Pick a food, enter grams, get protein / fat / carbs / kcal. A name that is not in your list can be a one-off row: protein / fat / carbs for the portion, not a catalog card. A plate photo lives on the add-food screen: known foods get grams, unknown food becomes that same one-off row.
- Your own food list: CRUD, search, favorites, recents. A shop catalog can copy a card into that list. No barcodes or live external food APIs.
- Today opens itself as a rest day from the meal template. Switch to training if you are going to the gym, or copy yesterday onto an empty day. On a meal, extra copy actions sit behind «Ещё». Today plus the two previous calendar days stay fully writable in the user's timezone. Empty days up to seven days back can still be filled, marked «догонял»; already logged days in that extra window stay locked.
- Older days on Today are view-only. Food history and the week live in Settings. The day screen shows leftover recipe grams vs the template. Catch-up days keep the «догонял» mark in the week and history.

**Gym**

- A queue of workout days (not a weekday calendar). Ready-made programs fill the queue; you can edit days after. Programs with weeks (tables, 5/3/1, two-week press) start those weeks with the days; after a full round the next week starts itself. A 1ПМ bump and the last week still wait for a tap.
- «Пропустить» on the hub moves the queue without taking the date; you can put the skipped day back. «Не сегодня» inside a started session just removes that entry; the day stays next in the queue.
- Optional weeks can also be picked later: ramp → volume → peak → deload, or a percent/kg wave. Starting weeks can omit 1ПМ — the session asks. Weights move when the week changes, not after a single session.
- A session is a cheatsheet and a log: planned weights from the scheme (default 3×5), one «Готово». Untouched sets close as planned and stay labeled that way in history and on charts; edited sets are the real log. Exercises without a working weight are listed in the session and get a plan as soon as you type the weight there. How it felt is asked after you finish. Edit the scheme in Settings.
- Progress (working weights and relative strength when body weight is logged), session history, exercise list.

**Share**

- After «Готово», when protein is closed, on a 10/50/100th session, or «Сотня. Круглая.»: **В чат** puts a short message in a chat the person picks — doodle, one line, **Поставить дневник**. Mini App `shareMessage` / prepared inline, not `t.me/share/url`. Body weight, the plate, and 1ПМ stay off the message. Working kg is opt-in: **Написать кг**.
- Meal templates and the gym queue share separately as snapshots, as a QR or a t.me bot link. A friend saves the pack and applies it later. Logged days and working weights stay private. The app invite QR lives after the first closed session and on the gym hub («Показать программу другу»), not in Settings.

Screens first show the last successful API response from `localStorage` (`src/lib/api-cache.ts`), then refresh from the network. Food items and finishing a workout (`Готово`) stay on the phone if the network is down and sync when it comes back. Approaches typed in a session survive closing the Mini App. Offline writes need that day or session to have been loaded once while online.

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
| `NEXT_PUBLIC_APP_URL` | no | public HTTPS app host; Mini App fallback and doodle/sticker files |
| `TELEGRAM_MINI_APP_URL` | no | Mini App HTTPS URL (takes priority) |
| `CRON_SECRET` | yes for cron | Vercel Cron sends `Authorization: Bearer CRON_SECRET` |

Migrations: `supabase/migrations/0001_init.sql` … `0026_set_logged.sql` — apply in order in the SQL Editor or with the Supabase CLI.

Bot: `/start` sends the T-rex sticker, then the diary text and an “Open diary” button when an **https** URL is set (`TELEGRAM_MINI_APP_URL` or `NEXT_PUBLIC_APP_URL`). Enable **inline mode** in @BotFather so «В чат» and `@bot` stickers work. `NEXT_PUBLIC_APP_URL` must be the public HTTPS app host — Telegram fetches `/share/*.jpg` and `/stickers/trex.webp` from there. At 20:00 in the user’s timezone (from Settings, or the Mini App, otherwise `Europe/Moscow`) the bot sends **one** snapshot of that evening: empty food, a training day without «Готово» if there is a queue, or «Yeah buddy» when food is logged and the gym is closed or it is a rest day. A later hourly run still delivers that same evening if 20:00 already passed. Closing after 20:00 does not send a second message. On Sunday the same message adds a 14-day scoreboard from the diary review. Not a broadcast. Toggle and timezone: Settings → Evening reminders. Cron: `GET /api/cron/reminders` once per UTC hour (`0 0-23 * * *` as 24 daily jobs so Vercel Hobby can deploy) with `CRON_SECRET`. Webhook: `POST /api/telegram/webhook`. On Bot API 8.0+ the Mini App requests fullscreen; in @BotFather enable fullscreen on the Main Mini App / Menu Button (or use `mode=fullscreen` on the t.me link) if the client still shows the header.

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram/webhook
```

Outside Telegram, `next dev` logs in via `POST /api/auth/dev` (404 in production). A new account gets starter foods, meal templates, and exercises without maxes. The gym queue is empty until onboarding (or the queue screen) applies a program. First visit with no history opens onboarding: how the diary works, protein (100 / 120 / 150), then a program. 1ПМ is not part of that setup — a workout can start as soon as the day has at least one exercise with a set scheme, and missing working weights are asked inside the session (`POST /api/sessions/:id/maxes`). The recommended start is the full-body program.

Scripts: `npm run dev` · `build` · `start` · `lint` (`biome check`) · `format` · `test` (`*.check.ts`).

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

- The diary logs your food list. A shop catalog copies a card into it. No barcodes, parsers, or live external food APIs. A friend pack copies foods into your list.
- The browser never talks to Supabase. `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_BOT_TOKEN` stay on the server.
- UI is built for Telegram Mini App, Russian, narrow screen.
- Settings → «Данные»: JSON export of the diary, or delete the account. Admin: `npm run user:delete -- <telegram-username>`.

Share links: meal templates and gym queue are separate snapshots (`share_packs`), shown as QR plus a bot `start` link. Apply replaces templates (and food/gym settings), not logged days or working weights. The app invite is `https://t.me/<bot>` so a friend lands in the chat and presses Start. Opening the HTTPS app URL outside Telegram shows a button to that same bot link.
