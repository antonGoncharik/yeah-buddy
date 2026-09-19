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
        "app-sticky-actions app-chrome-bar pointer-events-none pt-3",
        overlay && "app-fixed-bottom fixed inset-x-0 z-[9]",
        withNav
          ? "pb-[var(--app-nav-clearance)]"
          : "pb-[max(1.25rem,var(--app-safe-bottom))]",
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-lg flex-col gap-2 px-4">
        {children}
      </div>
    </div>
  );
}
