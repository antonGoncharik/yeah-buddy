import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function NavRow({
  href,
  title,
  hint,
  detail,
  className,
  style,
}: {
  href: string;
  title: string;
  hint?: ReactNode;
  detail?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 py-2.5 transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40",
        className,
      )}
      style={style}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-lg font-medium">{title}</span>
          {detail ? (
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {detail}
            </span>
          ) : null}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
