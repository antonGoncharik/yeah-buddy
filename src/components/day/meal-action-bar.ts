/** Touch targets for meal logging actions (today card, add-food picker, etc.). */

export const mealActionBarClass =
  "flex items-stretch divide-x divide-border/80 overflow-hidden rounded-xl border border-border/90 bg-muted/25";

export const mealActionIconSegmentClass =
  "inline-flex size-12 shrink-0 items-center justify-center p-0 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0";

export const mealActionPrimarySegmentClass =
  "inline-flex h-12 min-h-12 min-w-0 flex-1 items-center justify-center gap-2 px-3 text-base font-medium leading-none whitespace-nowrap transition-colors";

export const mealActionButtonClass =
  "h-12 min-h-12 items-center justify-center gap-2 text-base leading-none";

export const mealActionFullButtonClass = `${mealActionButtonClass} w-full rounded-xl`;
