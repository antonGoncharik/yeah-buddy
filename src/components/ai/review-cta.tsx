"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { reviewHref } from "@/lib/ai/review-nav";
import { REVIEW_CTA_HINT } from "@/lib/messages";
import { REVIEW_LABEL } from "@/lib/workout/labels";

export function ReviewCta({
  from,
  onOpen,
}: {
  from: string;
  onOpen?: () => void;
}) {
  return (
    <Link
      href={reviewHref(from)}
      className="card-surface animate-rise flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
      onClick={onOpen}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium">{REVIEW_LABEL}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {REVIEW_CTA_HINT}
        </span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
