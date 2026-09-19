"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ComponentType, type MouseEvent, useState } from "react";
import {
  CookieDoodle,
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
} from "@/components/layout/doodles";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

function DumbbellNavIcon({ className }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={DUMBBELL_VIEWBOX}>
      <DumbbellMark />
    </Doodle>
  );
}

const ITEMS: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { href: "/today", label: "Сегодня", icon: CookieDoodle },
  { href: "/workouts", label: "Тренировки", icon: DumbbellNavIcon },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const from = useSearchParams().get("from");
  const activeHref = navActiveHref(pathname, from);
  const [wiggleHref, setWiggleHref] = useState<string | null>(null);

  function onTabClick(href: string, event: MouseEvent<HTMLAnchorElement>) {
    haptic("tap");
    if (pathname !== href) {
      return;
    }
    event.preventDefault();
    setWiggleHref(null);
    requestAnimationFrame(() => setWiggleHref(href));
  }

  return (
    <nav className="app-bottom-nav app-chrome-bar app-fixed-bottom fixed inset-x-0 z-10 overflow-hidden pb-[var(--app-safe-bottom)]">
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-3">
        {ITEMS.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          const workouts = item.href === "/workouts";

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={(event) => onTabClick(item.href, event)}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 px-1 text-center text-xs font-medium transition-colors duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none sm:text-sm",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full transition-[transform,background-color] duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
                    active ? "scale-100 bg-primary/12" : "scale-90",
                  )}
                >
                  <span
                    className={cn(
                      wiggleHref === item.href && "animate-nav-wiggle",
                    )}
                    onAnimationEnd={() => setWiggleHref(null)}
                  >
                    <Icon
                      className={cn(
                        workouts ? "size-7" : "size-5",
                        "transition-transform duration-300 ease-[var(--ease-out-soft)]",
                        active && "scale-105",
                      )}
                    />
                  </span>
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function navActiveHref(pathname: string, from: string | null): string {
  if (pathname.startsWith("/progress")) {
    if (from === "gym" || from === "workouts") {
      return "/workouts";
    }
    if (from === "today" || from === "food" || from === "week") {
      return "/today";
    }
    return "/settings";
  }
  if (
    (pathname.startsWith("/today/history") ||
      pathname.startsWith("/today/week")) &&
    from === "settings"
  ) {
    return "/settings";
  }
  // The set scheme lives under /settings in the URL but is only reachable
  // from the gym, so the gym tab stays lit.
  if (pathname.startsWith("/settings/formulas")) {
    return "/workouts";
  }
  if (
    pathname.startsWith("/settings") ||
    pathname.startsWith("/foods") ||
    pathname.startsWith("/food/") ||
    pathname.startsWith("/packs/")
  ) {
    return "/settings";
  }
  if (pathname === "/today" || pathname.startsWith("/today/")) {
    return "/today";
  }
  if (pathname === "/workouts" || pathname.startsWith("/workouts/")) {
    return "/workouts";
  }
  return "/today";
}
