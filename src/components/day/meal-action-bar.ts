/** Touch targets for meal logging actions (today card, add-food picker, etc.).
 * Segments use min-height and stretch instead of a fixed h-12. Compact density
 * rewrites h-12 to 38px, while a real button keeps a 44px minimum, so a locked
 * height sticks to the top of the row and the icon leaves the center.
 */

export const mealActionBarClass =
  "flex items-stretch divide-x divide-border/80 overflow-hidden rounded-xl border border-border/90 bg-muted/25";

export const mealActionIconSegmentClass =
  "inline-grid h-auto min-h-12 w-12 shrink-0 place-items-center self-stretch p-0 leading-none text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0";

export const mealActionPrimarySegmentClass =
  "inline-flex h-auto min-h-12 min-w-0 flex-1 items-center justify-center gap-2 self-stretch px-3 text-base leading-none font-medium whitespace-nowrap transition-colors [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0";

export const mealActionButtonClass =
  "h-12 min-h-12 items-center justify-center gap-2 text-base leading-none [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0";

export const mealActionFullButtonClass = `${mealActionButtonClass} w-full rounded-xl`;
