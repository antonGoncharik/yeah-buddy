"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ComponentType, type MouseEvent, useEffect, useState } from "react";
import {
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
  MealDayDoodle,
} from "@/components/layout/doodles";
import { peekJson } from "@/lib/api-cache";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

function DumbbellNavIcon({ className }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={DUMBBELL_VIEWBOX}>
      <DumbbellMark />
    </Doodle>
  );
}

const BASE_ITEMS: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  gymOnly?: boolean;
}> = [
  { href: "/today", label: "Сегодня", icon: MealDayDoodle },
  { href: "/workouts", label: "Тренировки", icon: DumbbellNavIcon, gymOnly: true },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const from = useSearchParams().get("from");
  const [gymEnabled, setGymEnabled] = useState(true);
  const activeHref = navActiveHref(pathname, from, gymEnabled);
  const [wiggleHref, setWiggleHref] = useState<string | null>(null);

  useEffect(() => {
    const settings = readSettingsPayload(peekJson("/api/settings"));
    if (settings) {
      setGymEnabled(settings.gym_enabled);
    }
  }, [pathname]);

  const items = BASE_ITEMS.filter((item) => !item.gymOnly || gymEnabled);

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
    <nav className="app-bottom-nav app-chrome-bar app-fixed-bottom fixed inset-x-0 z-10 overflow-hidden">
      <ul
        className={cn(
          "mx-auto grid h-16 w-full max-w-lg",
          items.length === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {items.map((item) => {
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

function navActiveHref(
  pathname: string,
  from: string | null,
  gymEnabled: boolean,
): string {
  if (pathname.startsWith("/coach")) {
    return "/coach";
  }
  if (pathname.startsWith("/progress")) {
    if (from === "gym" || from === "workouts") {
      return gymEnabled ? "/workouts" : "/today";
    }
    return "/today";
  }
  if (
    (pathname.startsWith("/today/history") ||
      pathname.startsWith("/today/week")) &&
    from === "settings"
  ) {
    return "/settings";
  }
  if (pathname.startsWith("/settings/formulas")) {
    return gymEnabled ? "/workouts" : "/settings";
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
    return gymEnabled ? "/workouts" : "/today";
  }
  return "/today";
}
