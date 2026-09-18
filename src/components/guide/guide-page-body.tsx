import {
  BARBELL_VIEWBOX,
  BarbellMark,
  COOKIE_VIEWBOX,
  CookieMark,
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
  MUG_VIEWBOX,
  MugMark,
} from "@/components/layout/doodles";
import { WiggleTap } from "@/components/layout/wiggle-tap";
import type { GuideDoodle, GuidePage } from "@/lib/guide";
import { cn } from "@/lib/utils";

export function GuidePageBody({
  page,
  className,
}: {
  page: GuidePage;
  className?: string;
}) {
  return (
    <article className={cn("flex flex-col gap-4", className)}>
      <GuideDoodleIcon kind={page.doodle} />
      <p className="text-lg font-medium leading-snug">{page.lead}</p>
      {page.paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="text-base leading-relaxed text-muted-foreground"
        >
          {paragraph}
        </p>
      ))}
      {page.points && page.points.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {page.points.map((point) => (
            <li
              key={point}
              className="flex gap-2 text-base leading-relaxed text-muted-foreground"
            >
              <span aria-hidden className="text-primary">
                ·
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {page.remember ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-3 text-base leading-relaxed">
          {page.remember}
        </p>
      ) : null}
    </article>
  );
}

export function GuideDoodleIcon({ kind }: { kind: GuideDoodle }) {
  if (kind === "mug") {
    return (
      <WiggleTap>
        <Doodle
          className="doodle-mug h-9 w-auto text-primary"
          viewBox={MUG_VIEWBOX}
        >
          <MugMark />
        </Doodle>
      </WiggleTap>
    );
  }
  if (kind === "cookie") {
    return (
      <WiggleTap>
        <Doodle className="h-9 w-auto text-primary" viewBox={COOKIE_VIEWBOX}>
          <CookieMark />
        </Doodle>
      </WiggleTap>
    );
  }
  if (kind === "dumbbell") {
    return (
      <WiggleTap>
        <Doodle className="h-8 w-auto text-primary" viewBox={DUMBBELL_VIEWBOX}>
          <DumbbellMark />
        </Doodle>
      </WiggleTap>
    );
  }
  return (
    <WiggleTap>
      <Doodle className="h-8 w-auto text-primary" viewBox={BARBELL_VIEWBOX}>
        <BarbellMark />
      </Doodle>
    </WiggleTap>
  );
}
