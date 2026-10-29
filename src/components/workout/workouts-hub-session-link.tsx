"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { DumbbellDoodle } from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { cn } from "@/lib/utils";

export function WorkoutsHubSessionLink({
  href,
  compact,
  eyebrow,
  title,
  titleClassName,
  footer,
  className,
}: {
  href: string;
  compact: boolean;
  eyebrow: ReactNode;
  title: ReactNode;
  titleClassName?: string;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "card-surface flex items-center gap-3 px-5 transition-colors hover:bg-muted/40",
        compact ? "py-3" : "py-4",
        className,
      )}
    >
      <MarkBadge>
        <DumbbellDoodle />
      </MarkBadge>
      <span className="min-w-0 flex-1">
        <div className="text-sm font-medium">{eyebrow}</div>
        <h2
          className={cn(
            "mt-0.5 text-xl font-semibold tracking-tight",
            titleClassName,
          )}
        >
          {title}
        </h2>
        {footer}
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
