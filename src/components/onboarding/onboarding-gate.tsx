"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { mutateJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { isOnboardingCompleted, readSettingsPayload } from "@/lib/settings/map";
import type { UserSettings } from "@/lib/types";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const check = useCallback(async () => {
    setState("loading");
    try {
      const data = await mutateJson("/api/settings");
      const settings = readSettings(data);
      if (!settings) {
        throw new Error("settings failed");
      }
      if (isOnboardingCompleted(settings)) {
        setState("ready");
        return;
      }

      router.replace("/onboarding");
    } catch {
      setState("error");
    }
  }, [router]);

  useEffect(() => {
    void check();
  }, [check]);

  if (state === "ready") {
    return children;
  }

  if (state === "error") {
    return (
      <main className="app-viewport-min flex flex-col items-center justify-center px-6">
        <ScreenError message={LOAD_FAILED} onRetry={() => void check()} />
      </main>
    );
  }

  return (
    <main className="app-viewport-min flex flex-col items-center justify-center px-6">
      <ScreenLoading />
    </main>
  );
}

function readSettings(data: unknown): UserSettings | null {
  return readSettingsPayload(data);
}
