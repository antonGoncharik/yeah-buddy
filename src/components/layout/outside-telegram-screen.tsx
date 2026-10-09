import type { ReactNode } from "react";

import {
  BarbellDoodle,
  DumbbellDoodle,
  MealDayDoodle,
} from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { ShareQr } from "@/components/share/share-qr";
import { buttonVariants } from "@/components/ui/button";
import {
  OPEN_VIA_BOT_CTA,
  OPEN_VIA_BOT_EYEBROW,
  OPEN_VIA_BOT_FAQ,
  OPEN_VIA_BOT_FAQ_TITLE,
  OPEN_VIA_BOT_FINAL_LEAD,
  OPEN_VIA_BOT_FINAL_TITLE,
  OPEN_VIA_BOT_HERO,
  OPEN_VIA_BOT_LEAD,
  OPEN_VIA_BOT_NOTE,
  OPEN_VIA_BOT_POINTS,
  OPEN_VIA_BOT_POINTS_TITLE,
  OPEN_VIA_BOT_PREVIEW,
  OPEN_VIA_BOT_QR_CAPTION,
  OPEN_VIA_BOT_STEPS,
  OPEN_VIA_BOT_STEPS_TITLE,
  PROGRAM_SHELF_LEAD,
  PROGRAM_SHELF_TITLE,
} from "@/lib/messages";
import { landingProgramCards } from "@/lib/share/program-public";
import { isTelegramMeUrl } from "@/lib/telegram/share-url";
import { cn } from "@/lib/utils";

const POINT_ICONS = [
  <MealDayDoodle key="meal" />,
  <DumbbellDoodle key="workout" />,
  <BarbellDoodle key="program" />,
] as const;

function LandingSection({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {lead ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {lead}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function OpenInTelegramCta({
  openUrl,
  className,
}: {
  openUrl: string;
  className?: string;
}) {
  return (
    <a
      href={openUrl}
      className={cn(buttonVariants(), "h-14 w-full text-lg", className)}
    >
      {OPEN_VIA_BOT_CTA}
    </a>
  );
}

function DayPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        aria-hidden
        className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-primary/10 blur-2xl"
      />
      <div className="card-surface overflow-hidden rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
              {OPEN_VIA_BOT_PREVIEW.eyebrow}
            </p>
            <p className="mt-1 text-lg font-semibold">Дневник</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            YB
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-2xl bg-muted/65 p-4">
            <div className="flex items-start gap-3">
              <MarkBadge className="size-10 rounded-xl bg-background">
                <MealDayDoodle />
              </MarkBadge>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {OPEN_VIA_BOT_PREVIEW.mealTitle}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {OPEN_VIA_BOT_PREVIEW.mealBody}
                </p>
                <p className="mt-3 text-sm font-semibold text-primary">
                  {OPEN_VIA_BOT_PREVIEW.mealValue}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/12">
                <BarbellDoodle />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {OPEN_VIA_BOT_PREVIEW.workoutTitle}
                </p>
                <p className="mt-0.5 text-sm text-primary-foreground/70">
                  {OPEN_VIA_BOT_PREVIEW.workoutBody}
                </p>
                <p className="mt-3 text-xl font-semibold">
                  {OPEN_VIA_BOT_PREVIEW.workoutValue}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OutsideTelegramScreen({ openUrl }: { openUrl: string | null }) {
  const showQr = openUrl != null && isTelegramMeUrl(openUrl);
  const programs = landingProgramCards().slice(0, 3);

  return (
    <div className="animate-rise flex w-full flex-col gap-16 md:gap-24">
      <header className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-14">
        <div className="flex flex-col items-start">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            <span className="size-2 rounded-full bg-primary" aria-hidden />
            {OPEN_VIA_BOT_EYEBROW}
          </p>
          <h1 className="mt-5 max-w-xl text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
            {OPEN_VIA_BOT_HERO}
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            {OPEN_VIA_BOT_LEAD}
          </p>
          {openUrl ? (
            <OpenInTelegramCta
              openUrl={openUrl}
              className="mt-7 w-full sm:w-auto sm:min-w-64"
            />
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground">
            {OPEN_VIA_BOT_NOTE}
          </p>
        </div>
        <DayPreview />
      </header>

      <LandingSection title={OPEN_VIA_BOT_POINTS_TITLE}>
        <ul className="grid gap-6 md:grid-cols-3 md:gap-8">
          {OPEN_VIA_BOT_POINTS.map((point, index) => (
            <li
              key={point.title}
              className="border-t border-border pt-5 text-left"
            >
              <MarkBadge>{POINT_ICONS[index]}</MarkBadge>
              <h3 className="mt-5 text-lg font-semibold">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {point.body}
              </p>
            </li>
          ))}
        </ul>
      </LandingSection>

      <section className="overflow-hidden rounded-[2rem] bg-foreground px-6 py-8 text-background sm:px-8 sm:py-10">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-14">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-background/55 uppercase">
              Без лишнего ритуала
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
              {OPEN_VIA_BOT_STEPS_TITLE}
            </h2>
          </div>
          <ol className="divide-y divide-background/15 border-y border-background/15">
            {OPEN_VIA_BOT_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4 py-5">
                <span className="text-sm font-semibold text-background/40">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-background/65">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <LandingSection title={PROGRAM_SHELF_TITLE} lead={PROGRAM_SHELF_LEAD}>
        <ul className="grid gap-3 md:grid-cols-3">
          {programs.map((program) => (
            <li key={program.id}>
              <a
                href={program.path}
                className="card-surface group flex h-full min-h-40 flex-col p-5 text-left transition-transform hover:-translate-y-1"
              >
                <span className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
                  Готовая программа
                </span>
                <h3 className="mt-4 text-xl font-semibold">{program.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {program.summary}
                </p>
                <span className="mt-auto pt-5 text-sm font-semibold text-primary">
                  Посмотреть <span aria-hidden>→</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </LandingSection>

      <LandingSection title={OPEN_VIA_BOT_FAQ_TITLE}>
        <div className="border-y border-border">
          {OPEN_VIA_BOT_FAQ.map((item) => (
            <details
              key={item.question}
              className="group border-b border-border last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold">
                {item.question}
                <span
                  aria-hidden
                  className="text-xl font-normal text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </LandingSection>

      <section className="rounded-[2rem] bg-primary px-6 py-8 text-center text-primary-foreground sm:px-10 sm:py-12">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">
          {OPEN_VIA_BOT_FINAL_TITLE}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-primary-foreground/75">
          {OPEN_VIA_BOT_FINAL_LEAD}
        </p>
        {openUrl ? (
          <OpenInTelegramCta
            openUrl={openUrl}
            className="mt-6 w-full bg-background text-foreground hover:bg-background/90 sm:w-auto sm:min-w-64"
          />
        ) : null}
      </section>

      {showQr && openUrl ? (
        <ShareQr url={openUrl} caption={OPEN_VIA_BOT_QR_CAPTION} compact />
      ) : null}
    </div>
  );
}
