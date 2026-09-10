"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  packPath,
  peekPendingPackToken,
  takePendingPackToken,
} from "@/lib/share/pending";
import { isPackToken } from "@/lib/share/token";

export function PackCatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = peekPendingPackToken();
    if (!token || !isPackToken(token)) {
      return;
    }

    const target = packPath(token);
    if (pathname === target) {
      takePendingPackToken();
      return;
    }

    router.replace(target);
  }, [pathname, router]);

  return children;
}
