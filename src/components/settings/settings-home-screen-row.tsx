"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import { NavRow } from "@/components/layout/nav-row";
import { haptic } from "@/lib/telegram/haptic";
import {
  bindHomeScreenAdded,
  HOME_SCREEN_LABEL,
  homeScreenHint,
  promptAddToHomeScreen,
  readHomeScreenStatus,
  type HomeScreenStatus,
} from "@/lib/telegram/home-screen";

export function SettingsHomeScreenRow() {
  const [status, setStatus] = useState<HomeScreenStatus | "loading">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let disposeAdded: (() => void) | null = null;
    let cancelled = false;

    void readHomeScreenStatus().then((next) => {
      if (!cancelled) {
        setStatus(next);
      }
    });

    void bindHomeScreenAdded(() => {
      setStatus("added");
      haptic("success");
    }).then((dispose) => {
      if (cancelled) {
        dispose?.();
        return;
      }
      disposeAdded = dispose;
    });

    return () => {
      cancelled = true;
      disposeAdded?.();
    };
  }, []);

  if (status === "loading" || status === "unsupported") {
    return null;
  }

  const hint = homeScreenHint(status);
  const added = status === "added";

  return (
    <NavRow
      title={HOME_SCREEN_LABEL}
      hint={hint}
      icon={<Smartphone className="size-4" aria-hidden />}
      busy={added || busy}
      onClick={() => {
        if (added || busy) {
          return;
        }
        setBusy(true);
        haptic("tap");
        void promptAddToHomeScreen().finally(() => {
          setBusy(false);
          void readHomeScreenStatus().then(setStatus);
        });
      }}
    />
  );
}
