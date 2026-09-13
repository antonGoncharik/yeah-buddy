"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

import { shouldResetWindowScroll } from "@/lib/scroll-policy";

function resetWindowScroll() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo(0, 0);
}

export function ResetWindowScroll() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!shouldResetWindowScroll(pathname)) {
      return;
    }

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    resetWindowScroll();
    const frame = window.requestAnimationFrame(resetWindowScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.history.scrollRestoration = previous;
    };
  }, [pathname]);

  return null;
}
