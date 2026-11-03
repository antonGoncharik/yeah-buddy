"use client";

import { PlateDoodle } from "@/components/layout/doodles";
import { cn } from "@/lib/utils";

export function PlateFill({ filled }: { filled: number }) {
  const count = Math.max(0, Math.min(4, filled));

  return (
    <div className="flex items-center gap-3 px-1" aria-hidden>
      <PlateDoodle className="size-8 text-primary" />
      <span className="flex gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "size-2.5 rounded-full",
              index < count ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </span>
    </div>
  );
}
