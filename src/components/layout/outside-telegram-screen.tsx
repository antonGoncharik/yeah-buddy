import type { ReactNode } from "react";

import {
  BarbellDoodle,
  DumbbellDoodle,
  MealDayDoodle,
} from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { NavRow } from "@/components/layout/nav-row";
import { ShareQr } from "@/components/share/share-qr";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";
import {
  BARBELL_SHELF_LEAD,
  BARBELL_SHELF_TITLE,
  OPEN_VIA_BOT_CTA,
  OPEN_VIA_BOT_EYEBROW,
  OPEN_VIA_BOT_FAQ,
  OPEN_VIA_BOT_FAQ_TITLE,
  OPEN_VIA_BOT_FEATURES_TITLE,
  OPEN_VIA_BOT_HERO,
  OPEN_VIA_BOT_LEAD,
  OPEN_VIA_BOT_NOTE,
  OPEN_VIA_BOT_PILLS,
  OPEN_VIA_BOT_POINTS,
  OPEN_VIA_BOT_QR_CAPTION,
  OPEN_VIA_BOT_STEPS,
  OPEN_VIA_BOT_STEPS_TITLE,
  PROGRAM_SHELF_LEAD,
  PROGRAM_SHELF_TITLE,
} from "@/lib/messages";
import { publicBarbellCard } from "@/lib/share/barbell-public";
import { landingProgramCards } from "@/lib/share/program-public";
import { isTelegramMeUrl } from "@/lib/telegram/share-url";
import { cn } from "@/lib/utils";

const POINT_ICONS = {
  "День отдыха": <MealDayDoodle />,
  "День зала": <DumbbellDoodle />,
  Программа: <BarbellDoodle />,
} as const;

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
          <p className="text-sm leading-relaxed text-muted-foreground">{lead}</p>
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

export function OutsideTelegramScreen({ openUrl }: { openUrl: string | null }) {
  const showQr = openUrl != null && isTelegramMeUrl(openUrl);
  const programs = landingProgramCards();
  const barbell = publicBarbellCard();

  return (
    <div className="animate-rise flex w-full flex-col items-center gap-10">
      <header className="flex w-full flex-col gap-4">
        <div
          className="card-surface relative overflow-hidden px-6 py-7 text-center"
          style={{
            backgroundImage:
              "linear-gradient(145deg, color-mix(in oklch, var(--primary) 14%, transparent), transparent 55%)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-1.5 bg-primary"
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {OPEN_VIA_BOT_EYEBROW}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {OPEN_VIA_BOT_HERO}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
            {OPEN_VIA_BOT_LEAD}
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {OPEN_VIA_BOT_PILLS.map((pill) => (
              <li key={pill}>
                <span className="inline-flex rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground">
                  {pill}
                </span>
              </li>
            ))}
          </ul>
          {openUrl ? (
            <div className="mt-6">
              <OpenInTelegramCta openUrl={openUrl} />
            </div>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">{APP_NAME}</p>
        </div>
      </header>

      <LandingSection title={OPEN_VIA_BOT_FEATURES_TITLE}>
        <ul className="grid w-full gap-3">
          {OPEN_VIA_BOT_POINTS.map((point) => (
            <li key={point.title} className="card-surface flex gap-3 px-4 py-4">
              <MarkBadge className="size-10 rounded-xl">
                {POINT_ICONS[point.title]}
              </MarkBadge>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-base font-semibold">
                  {point.title}
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </LandingSection>

      <LandingSection title={OPEN_VIA_BOT_STEPS_TITLE}>
        <ol className="flex w-full flex-col gap-3">
          {OPEN_VIA_BOT_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="card-surface flex items-start gap-4 px-4 py-4 text-left"
            >
              <span
                aria-hidden
                className="text-2xl font-bold tabular-nums text-primary/35"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="block text-base font-semibold">
                  {step.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </LandingSection>

      <LandingSection title={PROGRAM_SHELF_TITLE} lead={PROGRAM_SHELF_LEAD}>
        <ul className="card-surface w-full divide-y divide-border/70 px-5 py-1 text-left">
          {programs.map((program) => (
            <li key={program.id}>
              <NavRow
                href={program.path}
                title={program.name}
                hint={program.summary}
              />
            </li>
          ))}
        </ul>
      </LandingSection>

      <LandingSection title={BARBELL_SHELF_TITLE} lead={BARBELL_SHELF_LEAD}>
        <div className="card-surface w-full px-5 py-1 text-left">
          <NavRow
            href={barbell.path}
            title={barbell.name}
            hint={barbell.summary}
            icon={<BarbellDoodle />}
          />
        </div>
      </LandingSection>

      <LandingSection title={OPEN_VIA_BOT_FAQ_TITLE}>
        <ul className="flex w-full flex-col gap-3">
          {OPEN_VIA_BOT_FAQ.map((item) => (
            <li key={item.question} className="card-surface px-5 py-4 text-left">
              <h3 className="text-base font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </li>
          ))}
        </ul>
      </LandingSection>

      {openUrl ? <OpenInTelegramCta openUrl={openUrl} /> : null}

      <p className="px-2 text-center text-sm leading-relaxed text-muted-foreground">
        {OPEN_VIA_BOT_NOTE}
      </p>

      {showQr && openUrl ? (
        <ShareQr url={openUrl} caption={OPEN_VIA_BOT_QR_CAPTION} compact />
      ) : null}
    </div>
  );
}
