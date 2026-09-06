# Yeah Buddy

Telegram Mini App: дневник еды и тренировок для армрестлинга. Один деплой Next.js на Vercel — фронт Mini App (русский мобильный UI), HTTP API и вебхук бота.

## Что умеет

Нижняя навигация: **Сегодня · Тренировки · Настройки**. Продукты — не отдельная вкладка, а раздел настроек.

**Еда**

- День: отдых или тренировка. От этого зависят цели БЖУ и какие приёмы пищи видны (на отдыхе полдник, в тренировочный — до/после тренировки).
- Приёмы: завтрак, обед, полдник / до-после, ужин. Продукт → граммы → БЖУ и ккал.
- Своя база продуктов: CRUD, поиск, избранное, недавние. Внешних каталогов нет.
- Новый день собирается из шаблонов еды (их правят в Настройках) или копируется со вчера.
- История еды: БЖУ по дням и среднее. Цели отдыха/тренировки — в настройках.

**Зал**

- Очередь шаблонов (динамика/статика), не расписание по дням недели.
- «Не это» сдвигает круг, дату не занимает; можно вернуть шаблон обратно.
- Макроцикл и фазы: разгон → набор → рывок → сброс. Круг шаблонов фазу сам не закрывает.
- Сессия зала — шпаргалка и дневник: веса из схемы, факт в истории и на графиках. Схему правишь в Настройках. Стол — отдельная запись в тот же день, круг не занимает.
- Прогресс (рабочие веса), история сессий, справочник упражнений.

Экраны сначала показывают последний успешный ответ API из `localStorage` (`src/lib/api-cache.ts`), потом обновляются с сети. Без сети остаётся последнее известное.

## Стек

Next.js App Router, TypeScript, Tailwind, shadcn/ui, grammY. Postgres в Supabase — только с сервера, service role. Авторизация: Telegram `initData` → HTTP-only cookie (`session`, JWT, 7 дней).

## Запуск

```bash
cp .env.example .env.local
npm install
npm run dev
```

Переменные (см. `.env.example` и `src/lib/env.ts`):

| Переменная | Нужна | Назначение |
|---|---|---|
| `SUPABASE_URL` | да | проект Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | да | серверный ключ, не в клиент |
| `TELEGRAM_BOT_TOKEN` | да | бот, не в клиент |
| `SESSION_SECRET` | да | подпись сессии, ≥ 32 символов |
| `NEXT_PUBLIC_APP_URL` | нет | URL приложения; fallback для Mini App |
| `TELEGRAM_MINI_APP_URL` | нет | HTTPS URL Mini App (приоритетнее) |

Миграции: `supabase/migrations/0001_init.sql` … `0007_session_kind.sql` — по порядку в SQL Editor или через Supabase CLI.

Бот: `/start` и кнопка «Открыть дневник», если задан **https**-URL (`TELEGRAM_MINI_APP_URL` или `NEXT_PUBLIC_APP_URL`). Вебхук: `POST /api/telegram/webhook`.

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<домен>/api/telegram/webhook
```

Вне Telegram `next dev` логинит через `POST /api/auth/dev` (в production 404). После логина сидятся стартовые продукты, шаблоны еды и упражнения.

Скрипты: `npm run dev` · `build` · `start` · `lint` (`biome check`) · `format`.

## Карта репозитория

```text
src/app/(app)/     экраны Mini App
src/app/api/       HTTP API и вебхук бота
src/components/    day, foods, workout, settings, layout, ui
src/lib/           домен, auth, telegram, supabase, кэш
src/lib/workout/   шаблоны, сессии, макроциклы, формулы
supabase/migrations/
```

## Ограничения

- Только своя база продуктов. Нет внешних API, штрихкодов, парсеров.
- Браузер в Supabase не ходит. `SUPABASE_SERVICE_ROLE_KEY` и `TELEGRAM_BOT_TOKEN` только на сервере.
- UI рассчитан на Telegram Mini App, русский, узкий экран.
