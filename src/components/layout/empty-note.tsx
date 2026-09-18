import type { ReactNode } from "react";

import { MarkBadge } from "@/components/layout/mark-badge";

export function EmptyNote({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col items-center gap-3 px-5 py-8 text-center">
      <MarkBadge className="size-14 rounded-3xl">{icon}</MarkBadge>
      <p className="text-lg font-medium">{title}</p>
      {hint ? (
        <p className="text-base leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {action ? <div className="w-full pt-1">{action}</div> : null}
    </section>
  );
}
