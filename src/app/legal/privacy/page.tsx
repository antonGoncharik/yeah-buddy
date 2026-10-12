import type { Metadata } from "next";
import Link from "next/link";

import { PublicSiteFooter } from "@/components/layout/public-site-footer";
import { APP_NAME } from "@/lib/brand";
import { PROGRAM_PAGE_BACK, PUBLIC_FOOTER_PRIVACY } from "@/lib/messages";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PUBLIC_FOOTER_PRIVACY,
  alternates: { canonical: "/legal/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="app-viewport-min overflow-y-auto px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
      <article className="mx-auto w-full max-w-2xl py-10 prose prose-neutral dark:prose-invert">
        <Link
          href="/"
          className="not-prose text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {PROGRAM_PAGE_BACK}
        </Link>
        <h1 className="not-prose mt-6 text-3xl font-semibold">
          {PUBLIC_FOOTER_PRIVACY}
        </h1>
        <p className="text-muted-foreground">
          Кратко: {APP_NAME} хранит данные дневника для твоего аккаунта в
          Telegram. Мы не продаём их и не показываем чужим людям без твоего
          действия (ссылка тренеру, пара, шаринг в чат).
        </p>
        <h2>Что собираем</h2>
        <ul>
          <li>Идентификатор Telegram и имя из профиля для входа.</li>
          <li>
            Записи еды, веса, тренировок и настройки целей, которые ты вводишь.
          </li>
          <li>
            Технические события (ошибки, аналитика продукта) без текста
            переписки.
          </li>
        </ul>
        <h2>ИИ-разбор</h2>
        <p>
          Фото, голос и текст для КБЖУ отправляются в модель распознавания
          только когда ты явно запускаешь разбор. Результат сохраняется в твоём
          дневнике.
        </p>
        <h2>Удаление</h2>
        <p>
          В настройках дневника можно экспортировать данные и удалить аккаунт с
          подтверждением. После удаления записи убираются с сервера в рамках
          обычного резервного цикла хостинга.
        </p>
        <h2>Контакт</h2>
        <p>
          Вопросы по данным — через бота{" "}
          <a href="https://t.me/yeahbuddy_bot">@yeahbuddy_bot</a> (тема
          «Написать» в приложении).
        </p>
        <div className="not-prose mt-10">
          <PublicSiteFooter />
        </div>
      </article>
    </main>
  );
}
