import type { ComponentType } from "react";

import {
  BARBELL_VIEWBOX,
  BarbellMark,
  COOKIE_VIEWBOX,
  CookieMark,
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
  LINK_VIEWBOX,
  LinkMark,
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

const GUIDE_DOODLE_ICON: Record<
  GuideDoodle,
  {
    className: string;
    viewBox: string;
    Mark: ComponentType<{ ink?: string }>;
  }
> = {
  mug: {
    className: "doodle-mug h-9 w-auto",
    viewBox: MUG_VIEWBOX,
    Mark: MugMark,
  },
  cookie: {
    className: "h-9 w-auto",
    viewBox: COOKIE_VIEWBOX,
    Mark: CookieMark,
  },
  dumbbell: {
    className: "h-8 w-auto",
    viewBox: DUMBBELL_VIEWBOX,
    Mark: DumbbellMark,
  },
  barbell: {
    className: "h-8 w-auto",
    viewBox: BARBELL_VIEWBOX,
    Mark: BarbellMark,
  },
  link: { className: "h-8 w-auto", viewBox: LINK_VIEWBOX, Mark: LinkMark },
};

export function GuideDoodleIcon({ kind }: { kind: GuideDoodle }) {
  const icon = GUIDE_DOODLE_ICON[kind];
  const Mark = icon.Mark;

  return (
    <WiggleTap>
      <Doodle
        className={cn("text-primary", icon.className)}
        viewBox={icon.viewBox}
      >
        <Mark />
      </Doodle>
    </WiggleTap>
  );
}
