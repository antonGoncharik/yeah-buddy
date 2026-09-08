"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { LOAD_FAILED } from "@/lib/messages";
import { isOnboardingCompleted } from "@/lib/settings";
import type { UserSettings } from "@/lib/types";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const check = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error("settings failed");
      }

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
      <main className="flex min-h-dvh flex-col items-center justify-center px-6">
        <ScreenError message={LOAD_FAILED} onRetry={() => void check()} />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <ScreenLoading />
    </main>
  );
}

function readSettings(data: unknown): UserSettings | null {
  if (!data || typeof data !== "object" || !("settings" in data)) {
    return null;
  }

  const settings = data.settings;
  if (!settings || typeof settings !== "object") {
    return null;
  }

  return settings as UserSettings;
}
