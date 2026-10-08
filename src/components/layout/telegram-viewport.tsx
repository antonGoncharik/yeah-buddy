"use client";

import { useEffect } from "react";

import {
  bindTelegramViewport,
  type TelegramViewportSource,
} from "@/lib/telegram/viewport";
import { loadTelegramWebApp } from "@/lib/telegram/webapp";

export function TelegramViewport() {
  useEffect(() => {
    let cancelled = false;
    let unbind: (() => void) | undefined;

    void loadTelegramWebApp().then((webApp) => {
      if (cancelled) {
        return;
      }
      unbind = bindTelegramViewport(webApp as TelegramViewportSource);
    });

    return () => {
      cancelled = true;
      unbind?.();
    };
  }, []);

  return null;
}
