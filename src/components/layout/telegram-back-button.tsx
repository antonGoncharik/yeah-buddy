"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { loadTelegramWebApp } from "@/lib/telegram/webapp";

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

    void loadTelegramWebApp().then((webApp) => {
      if (cancelled) {
        return;
      }

      const back = (
        webApp as {
          BackButton?: {
            show: () => void;
            hide: () => void;
            onClick: (cb: () => void) => void;
            offClick: (cb: () => void) => void;
          };
        }
      ).BackButton;
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
