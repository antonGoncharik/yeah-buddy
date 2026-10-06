import type { ComponentType } from "react";

import {
  BARBELL_VIEWBOX,
  BarbellMark,
  BOOK_VIEWBOX,
  BookMark,
  COOKIE_VIEWBOX,
  CookieMark,
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
  FRIENDS_VIEWBOX,
  FriendsMark,
  MACRO_VIEWBOX,
  MacroMark,
  MEAL_DAY_VIEWBOX,
  MealDayMark,
  MUG_VIEWBOX,
  MugMark,
  PRODUCT_VIEWBOX,
  ProductMark,
} from "@/components/layout/doodles";
import { WiggleTap } from "@/components/layout/wiggle-tap";
import type { GuideDoodle, GuidePage } from "@/lib/guide";
import { cn } from "@/lib/utils";

export function GuidePageBody({
  page,
  className,
  omitLead = false,
  compact = false,
}: {
  page: GuidePage;
  className?: string;
  omitLead?: boolean;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        compact ? "flex flex-col gap-2" : "flex flex-col gap-4",
        className,
      )}
    >
      {compact ? null : <GuideDoodleIcon kind={page.doodle} />}
      {omitLead ? null : (
        <p
          className={cn(
            "font-medium leading-snug",
            compact ? "text-base" : "text-lg",
          )}
        >
          {page.lead}
        </p>
      )}
      {page.paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className={cn(
            "leading-snug text-muted-foreground",
            compact ? "text-sm" : "text-base leading-relaxed",
          )}
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
  friends: {
    className: "h-8 w-auto",
    viewBox: FRIENDS_VIEWBOX,
    Mark: FriendsMark,
  },
  mealday: {
    className: "h-8 w-auto",
    viewBox: MEAL_DAY_VIEWBOX,
    Mark: MealDayMark,
  },
  macro: {
    className: "h-9 w-auto",
    viewBox: MACRO_VIEWBOX,
    Mark: MacroMark,
  },
  product: {
    className: "h-9 w-auto",
    viewBox: PRODUCT_VIEWBOX,
    Mark: ProductMark,
  },
  book: {
    className: "h-8 w-auto",
    viewBox: BOOK_VIEWBOX,
    Mark: BookMark,
  },
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
