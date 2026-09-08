"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function TelegramBackButton({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("@twa-dev/sdk").then((sdk) => {
      if (cancelled) {
        return;
      }

      const back = sdk.default.BackButton;
      if (!back) {
        return;
      }

      const go = () => {
        router.push(href);
      };
      back.onClick(go);
      back.show();
      cleanup = () => {
        back.offClick(go);
        back.hide();
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [href, router]);

  return null;
}
