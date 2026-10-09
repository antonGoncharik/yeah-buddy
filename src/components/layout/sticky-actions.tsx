import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StickyActions({
  children,
  className,
  withNav = true,
  overlay = true,
}: {
  children: ReactNode;
  className?: string;
  withNav?: boolean;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "app-sticky-actions app-chrome-bar pointer-events-none fixed inset-x-0 z-[20]",
        overlay &&
          (withNav
            ? "bottom-[calc(var(--app-bottom-nav-block)+var(--app-fixed-bottom))]"
            : "app-fixed-bottom bottom-[var(--app-fixed-bottom)]"),
        withNav
          ? "py-3"
          : "pt-3 pb-[max(1.25rem,var(--app-safe-bottom))]",
        className,
      )}
    >
      <div
        className="pointer-events-auto mx-auto flex w-full max-w-lg flex-col items-stretch gap-2 px-4 [&_a]:w-full [&_button]:w-full"
      >
        {children}
      </div>
    </div>
  );
}
