import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Heading for a group of cards on a screen. One look everywhere: title on the
 * left, an optional hint under it, an optional link or action on the right.
 */
export function SectionHeading({
  title,
  hint,
  href,
  linkLabel,
  trailing,
  className,
}: {
  title: string;
  hint?: ReactNode;
  href?: string;
  linkLabel?: string;
  trailing?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-semibold">{title}</span>
        {hint ? (
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
      {href ? (
        <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-muted-foreground">
          {linkLabel}
          <ChevronRight className="size-4" aria-hidden />
        </span>
      ) : (
        trailing
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-1 transition-opacity active:opacity-70",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 px-1", className)}>{body}</div>
  );
}
