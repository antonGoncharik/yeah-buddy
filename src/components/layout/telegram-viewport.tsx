"use client";

import { useEffect } from "react";

import { bindFieldReveal } from "@/lib/form/field-nav";
import {
  bindTelegramViewport,
  type TelegramViewportSource,
} from "@/lib/telegram/viewport";
import { loadTelegramWebApp } from "@/lib/telegram/webapp";

export function TelegramViewport() {
  useEffect(() => {
    let cancelled = false;
    let unbind: (() => void) | undefined;
    const releaseFields = bindFieldReveal();

    void loadTelegramWebApp().then((webApp) => {
      if (cancelled) {
        return;
      }
      unbind = bindTelegramViewport(webApp as TelegramViewportSource);
    });

    return () => {
      cancelled = true;
      unbind?.();
      releaseFields();
    };
  }, []);

  return null;
}
