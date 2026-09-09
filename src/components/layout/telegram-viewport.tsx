"use client";

import { useEffect } from "react";

import {
  bindTelegramViewport,
  type TelegramViewportSource,
} from "@/lib/telegram/viewport";

export function TelegramViewport() {
  useEffect(() => {
    let cancelled = false;
    let unbind: (() => void) | undefined;

    void import("@twa-dev/sdk").then((sdk) => {
      if (cancelled) {
        return;
      }
      unbind = bindTelegramViewport(sdk.default as TelegramViewportSource);
    });

    return () => {
      cancelled = true;
      unbind?.();
    };
  }, []);

  return null;
}
