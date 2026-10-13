# Yeah Buddy

Telegram Mini App: a food diary and a gym log. One Next.js app — the diary, the HTTP API, and the bot.

Bottom nav: **Today · Workouts · Settings**. Your food list lives in Settings.

## Food

A day is rest or training. That switches calorie targets and which meals show up: a snack on a rest day, pre- and post-workout on a training day. Body weight is one number for the day. Waist is optional and is not copied from yesterday.

Pick a food, enter grams, get protein, fat, carbs, and calories. A card with a usual portion goes straight into the meal. A name that is not in your list can be a one-off row for that portion. With a plate, voice, or text key the same screen can read a photo, a spoken list, or a line like «овсянка 80 г». Without those keys the diary is filled by hand. Each of those three is capped at three uses a day.

The list is yours: search, favorites, recents. A shop catalog can copy a card in. A barcode is looked up in that catalog, then Open Food Facts.

**Еда на день** in Settings is a template. It does not fill every new calendar day. A new day starts with empty meals. You log, copy yesterday, or tap **Подставить из шаблона**.

Today opens as an empty rest day. Switch to training, or copy yesterday onto an empty day. Today and the two days before it stay editable. Empty days a little further back can still be filled and are marked «догонял».

While today is empty, the first weeks show a habit card: food streak, protein, gyms this week. Once food is logged, **Итог дня** sits with the meals. After about two weeks of weigh-ins and a dense log, Today can suggest a new calorie target from how the scale moved and the pace you chose. Nothing changes until you apply it.

Older days are view-only. The week and food history sit under the date.

## Gym

Workouts are a queue, not a weekday calendar. Ready-made programs fill it; you can edit the days after. Programs that run in weeks advance on their own after a full round.

**Пропустить** on the hub moves the queue without taking the date. **Не сегодня** inside a started session only drops that entry.

A session is the plan and the log: weights from the scheme, one **Готово**. Sets you do not touch close as planned. Working weight steps up when the work sets meet the plan, and steps down after several holds on the same weight. How it felt is asked after you finish.

Progress is working weight, estimated one-rep max, and relative strength when body weight is logged.

**Мышцы** is a weekly volume and recovery map. The next session’s muscles are outlined. A finished session can share a week card: top muscles and sets, no body weight and no kilograms.

**Собери штангу** is one plate-math puzzle a day, with a streak. The same loader is used for rest between real sets.

## People

Round session counts and a week of closed protein can go to a chat you pick: a short card and a link to the diary. Ordinary finishes stay quiet. Body weight, the plate, and one-rep maxes stay off the message. Working kilograms are opt-in.

A meal on Today can be sent as **Вот обед**. Meal templates and the gym queue share as a snapshot — a QR or a bot link. A friend saves the pack and applies it later. Logged days and working weights stay private.

**Тренер** is a read-only link to the athlete’s current week: meals, gym status, latest morning weight. **Пара** is the same idea without numbers: whether today has food, whether protein is at the goal, and whether the gym happened.

Listed programs have a public page and a bot link that puts that preset in the queue. Featured on the landing: full body, home glutes, 5×5, and push / pull / legs.

The bot can nudge once in the afternoon during the first two weeks, and once in the evening at the hour you set. Sunday’s evening message is a 14-day card. Both follow the same reminder toggle.

## Outside the diary

Opening the site outside Telegram shows a landing and the program pages. Inside Telegram the same address opens the diary. Settings can export the diary as JSON or delete the account.

The diary works from the last successful response on the phone, then refreshes. Logging food, opening a day, and finishing a session can wait out a dropped network and sync when it returns. A plate photo still needs the network.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Required keys are the Supabase URL and service role, the bot token, and a session secret. Optional keys (Gemini, Sentry, cron, inbox) are listed in `.env.example`. Apply `supabase/migrations/` in order. How auth, offline sync, and reminders fit together is in `docs/architecture.md`.

`npm run dev` · `build` · `verify` (lint, tests, types) · `test` · `e2e`.
