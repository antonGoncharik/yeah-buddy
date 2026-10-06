"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { peekPendingBuddyToken } from "@/lib/share/pending";

export function BuddyCatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!peekPendingBuddyToken()) {
      return;
    }
    if (pathname === "/buddy/open") {
      return;
    }
    router.replace("/buddy/open");
  }, [pathname, router]);

  return children;
}
