# Client and server architecture

Yeah Buddy is a Telegram Mini App (Next.js App Router) with a cookie session and a client-side offline layer.

## Auth and session

- `POST /api/auth/telegram` validates Telegram `initData`, upserts `users`, and sets an HTTP-only session cookie (signed with `SESSION_SECRET`).
- Dev builds may use `POST /api/auth/dev` when Telegram is unavailable.
- API routes use `sessionRoute` / server helpers; unauthenticated requests get 401.

## Client data loading

- Screens load JSON from `/api/*` via `cachedGet` (`src/lib/api-cache.ts`).
- Cache keys include the authenticated `user_id` from `ensureCacheOwner` after login so accounts do not share entries.
- Stale-while-revalidate: cached data renders immediately; network refresh updates state in the background.

## Offline outbox

- Mutations enqueue `OutboxOp` records (`src/lib/outbox.ts`) and flush through `flushOutbox` (`src/lib/outbox-flush.ts`) after auth and on reconnect.
- Failed syncs emit `sync_failed` analytics and Sentry warnings (`reportOutboxSyncFailed`).
- Optimistic UI uses temp ids (`isTempId`) until the server returns real rows.

## Reminders (server)

- Vercel cron hits `/api/cron/reminders` hourly with `Authorization: Bearer CRON_SECRET`.
- Optional sharding: `?shard=0&shards=4` splits candidates by `user_id` hash, or set `REMINDER_SHARD_TOTAL=4` to run all shards in one cron invocation.
- Telegram sends go through a process-wide concurrency gate (5) and `withTelegramRetry` (429 + 5xx once). `reminder_fail_count` on `user_settings` pauses after 5 consecutive failures.
- Candidates: `user_settings` with `reminders_enabled`, `onboarding_completed_at` set, active Telegram user.
- Evening facts for a timezone batch-load day food, macros, and sessions before per-user send (`reminder-evening-batch.ts`); SQL helper `reminder_evening_facts` mirrors a subset for dashboards.
- Sunday photo cards render JPEG in-process (`renderShareCardJpeg`) instead of Telegram fetching `/api/share/card`.
- Timezone bucketing selects who is due for evening or midday messages; delivery uses the bot API with block detection (`reminder_blocked`).

## Share packs

- `pack_applications` records `(user_id, pack_token)` so repeat apply is idempotent.

## AI quotas

- Server routes (`/api/ai/*`) call `takeAiSlot` / `refundAiSlot` (`src/lib/ai/quota.ts`) backed by `ai_usage` rows.
- Quota exhaustion returns a typed `ReviewError` with code `QUOTA`; analytics records `ai_request` and `ai_failed` / `ai_empty`.

## Product analytics

- Server writes `product_events` via `trackEvent`; client posts allowlisted events to `POST /api/events` (rate limited per user).
- SQL views in migrations `0053`, `0059` power retention and feature dashboards in Supabase.

## Health

- `GET /api/health` returns `{ ok: true }` when the database is reachable (no secrets in the response).
