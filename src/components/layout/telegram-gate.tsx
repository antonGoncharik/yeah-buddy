"use client";

import { useCallback, useEffect, useState } from "react";
import { ScreenLoading } from "@/components/layout/screen-status";
import { TelegramViewport } from "@/components/layout/telegram-viewport";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED, OPEN_VIA_BOT } from "@/lib/messages";

type GateState = "loading" | "ready" | "outside" | "error";

const TELEGRAM_FULLSCREEN_API = "8.0";

function enterTelegramFullscreen(webApp: {
  isVersionAtLeast?: (version: string) => boolean;
  isFullscreen?: boolean;
  requestFullscreen?: () => void;
}) {
  // Bot API 8.0+; expand() only fills height — the Mini App header still takes space.
  if (typeof webApp.requestFullscreen !== "function") {
    return;
  }
  if (!webApp.isVersionAtLeast?.(TELEGRAM_FULLSCREEN_API)) {
    return;
  }
  if (webApp.isFullscreen) {
    return;
  }

  try {
    webApp.requestFullscreen();
  } catch {
    // Telegram 6.0 mock and old clients throw WebAppMethodUnsupported.
  }
}

export function TelegramGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("loading");

  const authenticate = useCallback(async () => {
    setState("loading");

    try {
      const sdk = await import("@twa-dev/sdk");
      const webApp = sdk.default;
      webApp.ready();
      webApp.expand();
      enterTelegramFullscreen(webApp);

      const initData = webApp.initData;
      if (initData) {
        const response = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        if (response.status === 401) {
          setState("outside");
          return;
        }

        if (!response.ok) {
          throw new Error("auth failed");
        }

        setState("ready");
        return;
      }

      const devResponse = await fetch("/api/auth/dev", { method: "POST" });
      if (devResponse.ok) {
        setState("ready");
        return;
      }

      setState("outside");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void authenticate();
  }, [authenticate]);

  return (
    <>
      <TelegramViewport />
      {state === "ready" ? (
        children
      ) : (
        <main className="app-viewport-min flex flex-col items-center justify-center gap-5 px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)] text-center">
          {state === "loading" ? <ScreenLoading /> : null}
          {state === "outside" ? (
            <p className="animate-rise max-w-xs text-xl font-semibold leading-snug">
              {OPEN_VIA_BOT}
            </p>
          ) : null}
          {state === "error" ? (
            <div className="animate-rise flex flex-col items-center gap-4">
              <p className="text-xl font-semibold">{LOAD_FAILED}</p>
              <Button
                className="h-14 min-w-40 text-lg"
                onClick={() => void authenticate()}
              >
                Повторить
              </Button>
            </div>
          ) : null}
        </main>
      )}
    </>
  );
}
