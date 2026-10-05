import { ChevronDown, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { TelegramBackButton } from "@/components/layout/telegram-back-button";
import { cn } from "@/lib/utils";

export function AppHeader({
  title,
  subtitle,
  backHref,
  trailing,
  onTitleClick,
  titleExpanded = false,
  titleAlign = "start",
  className,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  trailing?: ReactNode;
  onTitleClick?: () => void;
  titleExpanded?: boolean;
  titleAlign?: "start" | "center" | "inset";
  className?: string;
}) {
  const headingClass = "truncate text-2xl font-semibold tracking-tight";
  const centered = titleAlign === "center" && !backHref;
  const inset = titleAlign === "inset" && !backHref;

  const titleBlock = onTitleClick ? (
    <h1 className={centered ? "flex justify-center" : undefined}>
      <button
        type="button"
        className={cn(
          "flex max-w-full items-center gap-1 rounded-xl py-1 transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-[0.98]",
          centered
            ? "justify-center px-2 text-center"
            : inset
              ? "pl-0 pr-2 text-left"
              : "-ml-2 px-2 text-left",
        )}
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
    <h1 className={cn(headingClass, centered && "text-center")}>{title}</h1>
  );

  const subtitleBlock = subtitle ? (
    <p
      className={cn(
        "truncate text-sm text-muted-foreground",
        centered && "text-center",
      )}
    >
      {subtitle}
    </p>
  ) : null;

  if (inset) {
    return (
      <header
        className={cn(
          "grid w-full grid-cols-[var(--app-tg-close-clearance,0px)_minmax(0,1fr)_auto] items-center gap-2 px-4 py-4",
          className,
        )}
      >
        <div aria-hidden className="min-w-0" />
        <div className="min-w-0">
          {titleBlock}
          {subtitleBlock}
        </div>
        {trailing ? (
          <div className="flex shrink-0 items-center gap-1">{trailing}</div>
        ) : (
          <div aria-hidden className="min-w-0" />
        )}
      </header>
    );
  }

  if (centered) {
    return (
      <header
        className={cn(
          "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-1 px-4 py-4",
          className,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none flex min-w-0 items-center justify-self-stretch justify-end gap-1 opacity-0"
        >
          {trailing}
        </div>
        <div className="min-w-0 max-w-full justify-self-center">
          {titleBlock}
          {subtitleBlock}
        </div>
        <div className="flex min-w-0 items-center justify-self-stretch justify-end gap-1">
          {trailing}
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn("flex w-full items-center gap-2 px-4 py-4", className)}
    >
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
        {titleBlock}
        {subtitleBlock}
      </div>
      {trailing ? (
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {trailing}
        </div>
      ) : null}
    </header>
  );
}
