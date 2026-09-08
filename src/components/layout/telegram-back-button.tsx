"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function TelegramBackButton({
  href,
  onBack,
}: {
  href?: string;
  onBack?: () => void;
}) {
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
        if (onBack) {
          onBack();
          return;
        }
        if (href) {
          router.push(href);
        }
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
  }, [href, onBack, router]);

  return null;
}
