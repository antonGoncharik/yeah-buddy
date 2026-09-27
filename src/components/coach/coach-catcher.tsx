"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { peekPendingCoachToken } from "@/lib/share/pending";

export function CoachCatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!peekPendingCoachToken()) {
      return;
    }
    if (pathname === "/coach/open") {
      return;
    }
    router.replace("/coach/open");
  }, [pathname, router]);

  return children;
}
