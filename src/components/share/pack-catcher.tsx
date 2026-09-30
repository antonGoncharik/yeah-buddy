"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  barbellPath,
  dismissPendingBarbell,
  packPath,
  peekPendingBarbell,
  peekPendingPackToken,
  peekPendingProgramId,
} from "@/lib/share/pending";
import { programPath } from "@/lib/share/program-start";
import { isPackToken } from "@/lib/share/token";

export function PackCatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (peekPendingBarbell()) {
      const target = barbellPath();
      if (pathname === target || pathname.startsWith(`${target}/`)) {
        dismissPendingBarbell();
        return;
      }
      router.replace(target);
      return;
    }

    const programId = peekPendingProgramId();
    if (programId) {
      const target = programPath(programId);
      if (pathname === target || pathname.startsWith(`${target}/`)) {
        return;
      }
      router.replace(target);
      return;
    }

    const token = peekPendingPackToken();
    if (!token || !isPackToken(token)) {
      return;
    }

    const target = packPath(token);
    if (pathname === target || pathname.startsWith(`${target}/`)) {
      return;
    }

    router.replace(target);
  }, [pathname, router]);

  return children;
}
