import type { Metadata } from "next";
import Link from "next/link";

import { PublicSiteFooter } from "@/components/layout/public-site-footer";
import { APP_NAME, APP_TITLE } from "@/lib/brand";
import {
  PROGRAM_PAGE_BACK,
  PUBLIC_PROGRAMS_INDEX_LEAD,
  PUBLIC_PROGRAMS_INDEX_TITLE,
} from "@/lib/messages";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumb-json-ld";
import { publicProgramCards } from "@/lib/share/program-public";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: `${PUBLIC_PROGRAMS_INDEX_TITLE} — ${APP_NAME}` },
  description: PUBLIC_PROGRAMS_INDEX_LEAD,
  alternates: { canonical: "/p" },
  openGraph: {
    title: `${PUBLIC_PROGRAMS_INDEX_TITLE} — ${APP_TITLE}`,
    description: PUBLIC_PROGRAMS_INDEX_LEAD,
    url: "/p",
  },
};

export default function PublicProgramsIndexPage() {
  const programs = publicProgramCards();
  const jsonLd = breadcrumbJsonLd([
    { name: "Главная", path: "/" },
    { name: PUBLIC_PROGRAMS_INDEX_TITLE, path: "/p" },
  ]);

  return (
    <main className="app-viewport-min flex flex-col items-center overflow-y-auto px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <div className="my-auto w-full max-w-3xl py-10 sm:py-14">
        <div className="animate-rise flex flex-col gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {PROGRAM_PAGE_BACK}
          </Link>
          <header>
            <h1 className="text-3xl font-semibold tracking-tight">
              {PUBLIC_PROGRAMS_INDEX_TITLE}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {PUBLIC_PROGRAMS_INDEX_LEAD}
            </p>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2">
            {programs.map((program) => (
              <li key={program.id}>
                <a
                  href={program.path}
                  className="card-surface flex h-full flex-col p-5 text-left transition-transform hover:-translate-y-0.5"
                >
                  <h2 className="text-lg font-semibold">{program.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {program.summary}
                  </p>
                </a>
              </li>
            ))}
          </ul>
          <PublicSiteFooter />
        </div>
      </div>
    </main>
  );
}
