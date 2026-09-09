import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StickyActions({
  children,
  className,
  withNav = true,
}: {
  children: ReactNode;
  className?: string;
  withNav?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[9] mx-auto max-w-lg bg-gradient-to-t from-background from-40% to-transparent px-4 pt-8",
        withNav
          ? "pb-[calc(4.5rem+var(--app-safe-bottom))]"
          : "pb-[max(1.25rem,var(--app-safe-bottom))]",
        className,
      )}
    >
      <div className="pointer-events-auto flex flex-col gap-2">{children}</div>
    </div>
  );
}
