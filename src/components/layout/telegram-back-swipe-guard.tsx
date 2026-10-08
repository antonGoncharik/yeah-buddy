"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  bindTelegramBackSwipeGuard,
  EXIT_ARM_MS,
  isExactTabRoot,
} from "@/lib/telegram/back-swipe-guard";
import { EXIT_TO_CHATS_HINT } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";

export function TelegramBackSwipeGuard() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const [exitHint, setExitHint] = useState(false);
  const exitHintTimer = useRef(0);

  useEffect(() => {
    return bindTelegramBackSwipeGuard(
      () => {
        haptic("warn");
        setExitHint(true);
        window.clearTimeout(exitHintTimer.current);
        exitHintTimer.current = window.setTimeout(
          () => setExitHint(false),
          EXIT_ARM_MS,
        );
      },
      () => pathnameRef.current,
    );
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(exitHintTimer.current);
    };
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

  if (!exitHint) {
    return null;
  }

  return (
    <>
      <div className="h-11" aria-hidden />
      <p
        role="status"
        className="app-fixed-bottom pointer-events-none fixed inset-x-0 z-[11] mx-auto max-w-lg px-4 pb-[var(--app-nav-clearance)] text-center text-sm text-foreground"
      >
        <span className="mb-1 block rounded-xl bg-background/95 py-2 shadow-sm">
          {EXIT_TO_CHATS_HINT}
        </span>
      </p>
    </>
  );
}
