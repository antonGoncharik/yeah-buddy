import { ChevronDown, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { TelegramBackButton } from "@/components/layout/telegram-back-button";

export function AppHeader({
  title,
  subtitle,
  backHref,
  trailing,
  onTitleClick,
  titleExpanded = false,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  trailing?: ReactNode;
  onTitleClick?: () => void;
  titleExpanded?: boolean;
}) {
  const headingClass = "truncate text-2xl font-semibold tracking-tight";

  return (
    <header className="flex items-center gap-2 px-4 py-4">
      {backHref ? (
        <>
          <TelegramBackButton href={backHref} />
          <Link
            href={backHref}
            className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
            aria-label="Назад"
          >
            <ChevronLeft className="size-6" />
          </Link>
        </>
      ) : null}
      <div className="min-w-0 flex-1">
        {onTitleClick ? (
          <h1>
            <button
              type="button"
              className="-ml-2 flex max-w-full items-center gap-1 rounded-xl px-2 py-1 text-left transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-[0.98]"
              aria-haspopup="dialog"
              aria-expanded={titleExpanded}
              aria-label={`Выбрать день, ${title}`}
              onClick={onTitleClick}
            >
              <span className={`min-w-0 ${headingClass}`}>{title}</span>
              <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
            </button>
          </h1>
        ) : (
          <h1 className={headingClass}>{title}</h1>
        )}
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
