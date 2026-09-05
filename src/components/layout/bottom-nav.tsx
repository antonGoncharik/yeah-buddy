"use client";

import { CalendarDays, Dumbbell, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/today", label: "Сегодня", icon: CalendarDays },
  { href: "/workouts", label: "Тренировки", icon: Dumbbell },
  { href: "/settings", label: "Настройки", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border/70 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {ITEMS.map((item) => {
          const active =
            item.href === "/settings"
              ? pathname.startsWith("/settings") ||
                pathname.startsWith("/foods") ||
                pathname.startsWith("/food/")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-xs font-medium transition-colors duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none sm:text-sm",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-[transform,background-color] duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
                    active ? "scale-100 bg-primary/12" : "scale-90",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition-transform duration-300 ease-[var(--ease-out-soft)]",
                      active && "scale-105",
                    )}
                  />
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
