import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { AppHeaderBack } from "@/components/layout/app-header-back";
import { cn } from "@/lib/utils";

export function AppHeader({
  title,
  subtitle,
  backHref,
  mark,
  trailing,
  onTitleClick,
  titleExpanded = false,
  className,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  mark?: ReactNode;
  trailing?: ReactNode;
  onTitleClick?: () => void;
  titleExpanded?: boolean;
  className?: string;
}) {
  const headingClass = "truncate text-2xl font-semibold tracking-tight";

  return (
    <header
      className={cn("flex w-full items-center gap-2 px-4 py-4", className)}
    >
      {backHref ? <AppHeaderBack href={backHref} /> : null}
      <div className="min-w-0 flex-1">
        {onTitleClick ? (
          <h1>
            <button
              type="button"
              className="-ml-2 flex max-w-full items-center gap-1.5 rounded-xl px-2 py-1 text-left transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-[0.98]"
              aria-haspopup="dialog"
              aria-expanded={titleExpanded}
              aria-label={`Выбрать день, ${title}`}
              onClick={onTitleClick}
            >
              {mark}
              <span className={`min-w-0 ${headingClass}`}>{title}</span>
              <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
            </button>
          </h1>
        ) : mark ? (
          <div className="flex min-w-0 items-center gap-1.5">
            {mark}
            <h1 className={headingClass}>{title}</h1>
          </div>
        ) : (
          <h1 className={headingClass}>{title}</h1>
        )}
        {subtitle ? (
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? (
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {trailing}
        </div>
      ) : null}
    </header>
  );
}
