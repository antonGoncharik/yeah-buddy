import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AppHeader({
  title,
  subtitle,
  backHref,
  trailing,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-2 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
      {backHref ? (
        <Link
          href={backHref}
          className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
          aria-label="Назад"
        >
          <ChevronLeft className="size-6" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
      ) : null}
    </header>
  );
}
