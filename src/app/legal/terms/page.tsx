import type { Metadata } from "next";
import Link from "next/link";

import { PublicSiteFooter } from "@/components/layout/public-site-footer";
import { APP_NAME } from "@/lib/brand";
import { PROGRAM_PAGE_BACK, PUBLIC_FOOTER_TERMS } from "@/lib/messages";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PUBLIC_FOOTER_TERMS,
  alternates: { canonical: "/legal/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
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
          {PUBLIC_FOOTER_TERMS}
        </h1>
        <p className="text-muted-foreground">
          Используя {APP_NAME}, ты соглашаешься с правилами ниже. Сервис не
          является медицинской услугой.
        </p>
        <h2>Как пользоваться</h2>
        <p>
          Ты сам выбираешь цели по еде и нагрузке. Рекомендации в приложении —
          ориентиры, а не назначение врача. При болезнях и беременности сверяйся
          со специалистом.
        </p>
        <h2>Доступ третьим лицам</h2>
        <p>
          Режимы «тренер» и «пара» открывают только те данные, которые ты
          отправляешь по ссылке. Отозвать доступ можно в настройках.
        </p>
        <h2>ИИ и лимиты</h2>
        <p>
          Автоматический разбор еды ограничен по числу запросов в день. Лимиты
          могут меняться; актуальные значения показываются перед отправкой.
        </p>
        <h2>Изменения</h2>
        <p>
          Функции и условия могут обновляться. Продолжая пользоваться ботом
          после публикации новой версии на этой странице, ты принимаешь
          обновления.
        </p>
        <div className="not-prose mt-10">
          <PublicSiteFooter />
        </div>
      </article>
    </main>
  );
}
