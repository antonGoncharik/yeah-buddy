"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LOAD_FAILED, OPEN_VIA_BOT } from "@/lib/messages";

type GateState = "loading" | "ready" | "outside" | "error";

export function TelegramGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("loading");

  const authenticate = useCallback(async () => {
    setState("loading");

    try {
      const sdk = await import("@twa-dev/sdk");
      const webApp = sdk.default;
      webApp.ready();
      webApp.expand();

      const initData = webApp.initData;
      if (!initData) {
        setState("outside");
        return;
      }

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
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void authenticate();
  }, [authenticate]);

  if (state === "ready") {
    return children;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      {state === "loading" ? (
        <p className="text-base text-muted-foreground">Загрузка…</p>
      ) : null}
      {state === "outside" ? (
        <p className="text-lg font-medium">{OPEN_VIA_BOT}</p>
      ) : null}
      {state === "error" ? (
        <>
          <p className="text-lg font-medium">{LOAD_FAILED}</p>
          <Button
            className="h-12 min-w-40 text-base"
            onClick={() => void authenticate()}
          >
            Повторить
          </Button>
        </>
      ) : null}
    </main>
  );
}
