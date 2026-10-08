"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BootSplashProvider,
  useBootSplash,
} from "@/components/layout/boot-splash";
import { OutsideTelegramScreen } from "@/components/layout/outside-telegram-screen";
import { ScreenLoading } from "@/components/layout/screen-status";
import { TelegramViewport } from "@/components/layout/telegram-viewport";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";
import { LOAD_FAILED } from "@/lib/messages";
import { hasLocalDiary } from "@/lib/offline";
import { readInvitePayload } from "@/lib/share/invite";
import { rememberIncomingStart } from "@/lib/share/pending";
import { startPayloadFromLocation } from "@/lib/share/start-param";
import {
  bindTelegramFullscreen,
  type TelegramFullscreenHost,
} from "@/lib/telegram/fullscreen";
import {
  captureTelegramLaunchFromLocation,
  clearTelegramInitReloadFlag,
  loadTelegramWebApp,
  recoverTelegramInitOnce,
  waitForTelegramInitData,
} from "@/lib/telegram/webapp";

type GateState = "loading" | "ready" | "outside" | "error";

export function TelegramGate({ children }: { children: React.ReactNode }) {
  return (
    <BootSplashProvider>
      <TelegramGateBody>{children}</TelegramGateBody>
    </BootSplashProvider>
  );
}

function TelegramGateBody({ children }: { children: React.ReactNode }) {
  const boot = useBootSplash();
  const [state, setState] = useState<GateState>("loading");
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const releaseFullscreen = useRef<(() => void) | undefined>(undefined);

  const authenticate = useCallback(async () => {
    setState("loading");

    try {
      captureTelegramLaunchFromLocation();
      let webApp: Awaited<ReturnType<typeof loadTelegramWebApp>>;
      try {
        webApp = await loadTelegramWebApp();
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "telegram init reload"
        ) {
          return;
        }
        throw error;
      }
      if (!releaseFullscreen.current) {
        releaseFullscreen.current = bindTelegramFullscreen(
          webApp as TelegramFullscreenHost,
        );
      }
      rememberIncomingStart(
        startPayloadFromLocation({
          telegramStartParam: webApp.initDataUnsafe?.start_param,
          search: window.location.search,
          hash: window.location.hash,
        }),
      );

      const initData = await waitForTelegramInitData();
      if (!initData && recoverTelegramInitOnce()) {
        return;
      }
      if (initData) {
        let response: Response;
        try {
          response = await fetch("/api/auth/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              initData,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
          });
        } catch {
          if (hasLocalDiary()) {
            setState("ready");
            return;
          }
          setState("error");
          return;
        }

        if (response.status === 401) {
          setOpenUrl(await loadOpenUrl());
          setState("outside");
          return;
        }

        if (!response.ok) {
          throw new Error("auth failed");
        }

        clearTelegramInitReloadFlag();
        setState("ready");
        return;
      }

      let devResponse: Response;
      try {
        devResponse = await fetch("/api/auth/dev", { method: "POST" });
      } catch {
        if (hasLocalDiary()) {
          setState("ready");
          return;
        }
        setState("error");
        return;
      }
      if (devResponse.ok) {
        setState("ready");
        return;
      }

      setOpenUrl(await loadOpenUrl());
      setState("outside");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void authenticate();
  }, [authenticate]);

  useEffect(() => {
    return () => {
      releaseFullscreen.current?.();
      releaseFullscreen.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (state === "ready") {
      boot?.armIfIdle();
    }
  }, [boot, state]);

  const showSplash = state === "loading" || (state === "ready" && boot?.active);

  return (
    <>
      <TelegramViewport />
      {state === "ready" ? children : null}
      {state === "outside" || state === "error" ? (
        <main className="app-viewport-min flex flex-col items-center overflow-y-auto px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
          {state === "outside" ? (
            <div className="my-auto w-full max-w-md py-8">
              <OutsideTelegramScreen openUrl={openUrl} />
            </div>
          ) : null}
          {state === "error" ? (
            <div className="animate-rise my-auto flex flex-col items-center gap-4 py-8 text-center">
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
      ) : null}
      {showSplash ? <ScreenLoading splash title={APP_NAME} /> : null}
    </>
  );
}

async function loadOpenUrl(): Promise<string | null> {
  try {
    const response = await fetch("/api/open", { cache: "no-store" });
    const invite = readInvitePayload(await response.json().catch(() => null));
    return invite?.url ?? null;
  } catch {
    return null;
  }
}
