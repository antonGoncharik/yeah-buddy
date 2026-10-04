# Yeah Buddy

Telegram Mini App: food diary and gym log. One Next.js deploy on Vercel — Mini App UI (Russian, mobile), HTTP API, and the bot webhook.

## What it does

Bottom nav: **Today · Workouts · Settings**. Foods live under Settings, not as their own tab.

**Food**

- A day is rest or training. That switches macro targets and which meals show (snack on rest days; pre/post workout on training days). Body weight is one number on the day, next to leftover protein. Waist is optional on the day (not copied from yesterday); when it is logged, «Как прошло» can talk about it next to weight.
- Pick a food, enter grams, get protein / fat / carbs / kcal. If the card has a usual portion and no raw/dry yield, a tap on Today puts that portion in the meal and returns. Otherwise the grams screen. A name that is not in your list can be a one-off row: protein / fat / carbs for the portion, not a catalog card. A plate photo lives on the add-food screen when `GEMINI_PLATE_API_KEY` is set: known foods get grams, unknown food becomes that same one-off row. Without that key the diary still logs by hand. Daily photo cap is shown on the plate screen. Spoken food on that screen when `GEMINI_DICTATE_API_KEY` is set uses the same draft: say the foods and the grams, then confirm. Without that key the button is hidden. The spoken cap is separate from photos.
- Your own food list: CRUD, search, favorites, recents. After a food shows up two or three times, the add-food screen offers to favourite it once. A shop catalog can copy a card into that list. Search scans a barcode from the camera or takes 8–14 digits: the EAN is looked up in that catalog, then Open Food Facts, and the hit is cached. Name search stays on the local catalog.
- Today opens as an empty rest day. Switch to training if you are going to the gym, or copy yesterday onto an empty day. «Еда на день» fills a new day only after you set that template. On a filled meal, **Вот обед** sits on the card; extra copy actions stay behind «Ещё». Today plus the two previous calendar days stay fully writable in the user's timezone. Empty days up to seven days back can still be filled, marked «догонял»; already logged days in that extra window stay locked. If yesterday is still empty, Today says «Вчера пустой — можно догнать» — except in the first three days after onboarding, when an empty Today asks to repeat yesterday or scan a daily food instead.
- Older days on Today are view-only. Food history and the week open from Today's calendar. After a calendar week in the diary, and seven logged days or four gyms, «Как прошло» appears once on Today; Sunday the bot already adds that 14-day scoreboard to the evening reminder. The day screen shows leftover recipe grams vs the template. Catch-up days keep the «догонял» mark in the week and history.

**Gym**

- A queue of workout days (not a weekday calendar). Ready-made programs fill the queue; you can edit days after. Programs with weeks (tables, 5/3/1, two-week press) start those weeks with the days; after a full round the next week starts itself. A максимум на раз bump and the last week still wait for a tap.
- «Пропустить» on the hub moves the queue without taking the date; you can put the skipped day back. «Не сегодня» inside a started session just removes that entry; the day stays next in the queue.
- Optional weeks can also be picked later: ramp → volume → peak → deload, or a percent/kg wave. Starting weeks can omit максимум на раз — the session asks. Weights move when the week changes, not after a single session.
- A session is a cheatsheet and a log: planned weights from the scheme (default 3×5), one «Готово». Untouched sets close as planned and stay labeled that way in history and on charts; edited sets are the real log. Exercises without a working weight are listed in the session and get a plan as soon as you type the weight there. How it felt is asked after you finish. Edit the scheme in Settings.
- Progress (working weights and relative strength when body weight is logged), session history, exercise list.
- **Собери штангу** (`/workouts/barbell`): one plate-math puzzle per calendar day (60–140 kg), streak in `localStorage`. Rest between sets still uses the same loader for the real working weight. After a solve: **В чат** / **Сторис** with a T-rex card and **Поставить дневник**; `@bot` inline `barbell …` or queries like «собери штангу». Mini App deep link: `startapp=barbell`.

**Share**

- The 1st, 10th, 50th, and 100th session, «Сотня. Круглая.», or protein closed seven days in a row: **В чат** puts a short message in a chat the person picks — doodle, one line, **Поставить дневник**. Ordinary «Готово» and a closed protein day stay quiet. Mini App `shareMessage` / prepared inline, not `t.me/share/url`. Body weight, the plate, and максимум на раз stay off the message. Working kg is opt-in: **Написать кг**.
- Meal templates and the gym queue share separately as snapshots, as a QR or a t.me bot link. A filled meal on Today has **Вот обед** on the card: the chat picker opens from the meal, four lines in chat, Start. A friend saves the pack and applies it later. Logged days and working weights stay private. **Бот другу** in Settings is a QR to the bot itself (no food or gym log), separate from those snapshots.
- Settings → **Тренер**: the athlete shares a bot `start` link (`c_<token>`, 30 days, up to three live links at once). One coach claims each link; the board is read-only — the athlete’s current calendar week (meals, gym status, latest morning weight). It refreshes about every 30s while open. Renew or revoke from Settings. The coach never writes into the athlete’s diary.
- Listed ready programs have bot start links `p_<id>` (for example `p_full_body`, `p_home_floor`, `p_starting_strength`, `p_ppl`) and public pages on the site: `/p/full-body`, `/p/doma`, `/p/doma-3`, `/p/doma-turnik`, `/p/doma-verh-niz`, `/p/doma-ganteli`, `/p/doma-yagodicy`, `/p/5x5`, `/p/3x5`, `/p/2-silovyh`, `/p/verh-niz`, `/p/ppl`, `/p/spina-nogi-grud`. The same thirteen show in the Mini App at `/programs/<id>` and in onboarding (home ones also on their own «Дома» step). The landing lists all of them under «Программы». Each page has a preview and a button into the bot link. `/start` with a program payload replies with the days and **Поставить**. `@bot` with an empty query lists all listed programs in inline search; a typed query narrows by name or alias (`5x5`, `верх низ`, `дома`, `турник`, …). Apply puts the preset, not a personal snapshot. Other presets stay in the app only after `program:grant`. максимум на раз is still asked in the gym; the home programs plan from reps and do not need one.
- **Собери штангу** has a public page `/p/barbell` (OG, QR, **Собрать в Telegram** with `startapp=barbell`) and a block on the landing under «Задача дня».

Screens first show the last successful API response from `localStorage` (`src/lib/api-cache.ts`), then refresh from the network. Opening a day, starting a workout from a template already on the phone, a one-off food row, ordinary grams, and finishing a session (`Готово`) stay on the phone if the network is down and sync when it comes back. Approaches typed in a session survive closing the Mini App. A plate photo still needs the network. New catalog foods and other writes that are not that gym/food gesture stay online. Offline writes need that day or template to have been loaded once while online.

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
| `INBOX_CHAT_ID` | no | author's Telegram id. Settings → Написать delivers there. Reply to that message and the bot sends the answer back. Without it the button is hidden |
| `GEMINI_API_KEY` | no | text review «Как прошло». Up to three comma-separated keys, each from its own Google project (one project shares one Gemini quota). A limited key is skipped for the next call. Without a key the screen still shows numbers |
| `GEMINI_PLATE_API_KEY` | no | plate photo, same pool of up to three keys from separate projects. Without a key the camera link is hidden, food still logs by hand |
| `GEMINI_DICTATE_API_KEY` | no | spoken food «Голосом», same pool of up to three keys from separate projects. Without a key the button is hidden, food still logs by hand |

Migrations: `supabase/migrations/0001_init.sql` … `0040_ease_week.sql` — apply in order in the SQL Editor or with the Supabase CLI. Notable later files: `0034` inbox for Написать; `0035` sex / goal / training age on settings; `0038` coach read-only grants; `0039` separate AI quota kind for dictate; `0040` one-shot lighter week after three misses.

Bot: `/start` sends the T-rex sticker, then the diary text and an “Open diary” button when an **https** URL is set (`TELEGRAM_MINI_APP_URL` or `NEXT_PUBLIC_APP_URL`). Enable **inline mode** in @BotFather so «В чат» and `@bot` stickers work. `NEXT_PUBLIC_APP_URL` must be the public HTTPS app host — Telegram fetches `/share/*.jpg` and `/stickers/trex.webp` from there. At 21:00 in the user’s timezone (from Settings, or the Mini App, otherwise `Europe/Moscow`) the bot sends **one** photo of that evening: protein, kcal, whether the gym happened, plus a caption (empty food, a gym still in the queue, or «Yeah buddy»). The first three evenings after onboarding say empty food and the queued gym more plainly. **В чат** on that photo throws it into a gym chat — no body weight, максимум на раз, or plate. A later hourly run still delivers that same evening if 21:00 already passed. Closing after 21:00 does not send a second message. On Sunday the same caption adds a 14-day scoreboard from the diary review. Not a broadcast. Toggle and timezone: Settings → Evening reminders. Cron: `GET /api/cron/reminders` once per UTC hour (`0 0-23 * * *` as 24 daily jobs so Vercel Hobby can deploy) with `CRON_SECRET`. Webhook: `POST /api/telegram/webhook`. On Bot API 8.0+ the Mini App requests fullscreen; in @BotFather enable fullscreen on the Main Mini App / Menu Button (or use `mode=fullscreen` on the t.me link) if the client still shows the header.

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram/webhook
```

Outside Telegram, `next dev` logs in via `POST /api/auth/dev` (404 in production). A new account gets starter foods and exercises without maxes — no meal template is seeded, so the first day stays empty until the person logs food (or later sets «Еда на день»). The gym queue is empty until onboarding (or the queue screen) applies a program. First visit with no history opens onboarding: a short guide tour, then sex / weight / goal / training age → suggested protein and calories, ration hint, lifts, then a program. максимум на раз is not part of that setup — a workout can start as soon as the day has at least one exercise with a set scheme, and missing working weights are asked inside the session (`POST /api/sessions/:id/maxes`). The recommended start is the full-body program.

Scripts: `npm run dev` · `build` · `start` · `lint` (`biome check`) · `format` · `test` (`*.check.ts`) · `catalog:import` · `user:delete` · `program:grant`.

## Repo map

```text
src/app/(app)/     Mini App screens
src/app/api/       HTTP API and bot webhook
src/components/    day, foods, workout, settings, layout, ui
src/lib/           domain, auth, telegram, supabase, cache
src/lib/coach/     read-only coach board and grants
src/lib/workout/   templates, sessions, macrocycles, formulas
supabase/migrations/
```

## Limits

- The diary logs your food list. A shop catalog copies a card into it. A barcode (camera or 8–14 digits) resolves in that catalog, then Open Food Facts (ODbL). A hit is cached in the shop. A miss stays out of the shop: name and macros go on your own food, with the code. A friend pack copies foods into your list.
- The browser never talks to Supabase. `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_BOT_TOKEN` stay on the server.
- The diary UI is the Telegram Mini App: Russian, narrow screen. In production, opening the HTTPS app URL outside Telegram shows a landing on `/`: Yeah Buddy, food / gym / barcode, **Задача дня** (link to `/p/barbell`), programs, how to start, a QR, and a button to `https://t.me/<bot>`. Inside Telegram, `/` goes straight to the diary. `next dev` skips that landing and opens `/today`.
- Settings → «Данные»: JSON export of the diary, or delete the account. Admin: `npm run user:delete -- <telegram-username>`. A hidden program shows up for one person after `npm run program:grant -- <telegram-username> <preset-id>` (`--revoke` takes it back). The general list does not need a grant. Apply `0033_program_grants.sql` before the first grant; coach sharing needs `0038_coach_grants.sql`.

Share links: meal templates and gym queue are separate snapshots (`share_packs`), shown as QR plus a bot `start` link. Apply replaces templates (and food/gym settings), not logged days or working weights. Coach links use `start=c_<token>` (`coach_grants`), not packs. Ready programs use a stable `start=p_<id>` for every listed preset (`full_body`, `home_floor`, `home_three`, `home_bar`, `home_split`, `home_db`, `home_glutes`, `five_by_five`, `starting_strength`, `strength`, `upper_lower`, `ppl`, `three_day`) — no pack row — plus public `/p/*` and in-app `/programs/*`. The app invite is `https://t.me/<bot>` so a friend lands in the chat and presses Start. The diary routes stay out of the search index; `/` and `/p/*` do not.

Anonymous first-occurrence funnel (`funnel_events`, no food / weights / telegram_id): `onboarding_done`, `first_food`, `first_session`, `share`, `program_start`. `program_start` is a bot/program link apply, not an ordinary onboarding pick.
