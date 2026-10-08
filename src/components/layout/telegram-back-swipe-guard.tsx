"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  bindTelegramBackSwipeGuard,
  isExactTabRoot,
} from "@/lib/telegram/back-swipe-guard";
import { haptic } from "@/lib/telegram/haptic";

export function TelegramBackSwipeGuard() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    return bindTelegramBackSwipeGuard(
      () => {
        haptic("warn");
      },
      () => pathnameRef.current,
    );
  }, []);

  useEffect(() => {
    if (!isExactTabRoot(pathname) || typeof window === "undefined") {
      return;
    }
    const current = window.history.state as Record<string, unknown> | null;
    if (current?.ybExitAnchor) {
      return;
    }
    try {
      window.history.pushState({ ...current, ybExitAnchor: true }, "");
    } catch {
      // ignore
    }
  }, [pathname]);

  return null;
}
