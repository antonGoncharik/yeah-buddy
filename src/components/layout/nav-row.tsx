import { ChevronRight, Share2 } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface NavRowBase {
  title: string;
  hint?: ReactNode;
  detail?: string;
  className?: string;
  style?: CSSProperties;
}

type NavRowProps =
  | (NavRowBase & { href: string; onClick?: undefined; busy?: undefined })
  | (NavRowBase & { href?: undefined; onClick: () => void; busy?: boolean });

export function NavRow(props: NavRowProps) {
  const className = cn(
    "flex w-full items-center gap-3 py-2.5 text-left transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40",
    props.busy && "pointer-events-none opacity-60",
    props.className,
  );
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-lg font-medium">{props.title}</span>
          {props.detail ? (
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {props.detail}
            </span>
          ) : null}
        </span>
        {props.hint ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {props.hint}
          </span>
        ) : null}
      </span>
      {props.href ? (
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      ) : (
        <Share2 className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      )}
    </>
  );

  if (props.href) {
    return (
      <Link href={props.href} className={className} style={props.style}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={props.style}
      disabled={props.busy}
      onClick={props.onClick}
    >
      {body}
    </button>
  );
}
