"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { ApiError, postJson } from "@/lib/api-cache";
import { readCoachClaim } from "@/lib/coach/parse";
import { LOAD_FAILED } from "@/lib/messages";
import {
  dismissPendingCoachToken,
  peekPendingCoachToken,
} from "@/lib/share/pending";

export function CoachOpenScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const claim = useCallback(async () => {
    const token = peekPendingCoachToken();
    if (!token) {
      router.replace("/settings/coach");
      return;
    }

    setError(null);
    try {
      const opened = readCoachClaim(
        await postJson("/api/coach/claim", { token }),
      );
      if (!opened) {
        throw new Error(LOAD_FAILED);
      }
      dismissPendingCoachToken(token);
      router.replace(`/coach/${opened.id}`);
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        (caught.status === 404 || caught.status === 409)
      ) {
        dismissPendingCoachToken(token);
      }
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }, [router]);

  useEffect(() => {
    void claim();
  }, [claim]);

  if (!error) {
    return (
      <div className="flex flex-col gap-4">
        <AppHeader title="Тренер" backHref="/today" />
        <ScreenLoading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренер" backHref="/today" />
      <div className="flex flex-col gap-4 px-4">
        <p className="text-base text-muted-foreground">{error}</p>
        <Button
          className="h-14 text-lg"
          variant="outline"
          onClick={() => {
            if (peekPendingCoachToken()) {
              void claim();
              return;
            }
            router.replace("/today");
          }}
        >
          {peekPendingCoachToken() ? "Повторить" : "К своему дневнику"}
        </Button>
      </div>
    </div>
  );
}
