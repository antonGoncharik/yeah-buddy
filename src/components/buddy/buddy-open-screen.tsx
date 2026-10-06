"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { ApiError, postJson } from "@/lib/api-cache";
import { readBuddyClaim } from "@/lib/buddy/parse";
import { LOAD_FAILED } from "@/lib/messages";
import {
  dismissPendingBuddyToken,
  peekPendingBuddyToken,
} from "@/lib/share/pending";

export function BuddyOpenScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const claim = useCallback(async () => {
    const token = peekPendingBuddyToken();
    if (!token) {
      router.replace("/settings/buddy");
      return;
    }

    setError(null);
    try {
      const opened = readBuddyClaim(
        await postJson("/api/buddy/claim", { token }),
      );
      if (!opened) {
        throw new Error(LOAD_FAILED);
      }
      dismissPendingBuddyToken(token);
      router.replace(`/buddy/${opened.id}`);
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        (caught.status === 404 || caught.status === 409)
      ) {
        dismissPendingBuddyToken(token);
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
        <AppHeader title="Пара" backHref="/today" />
        <ScreenLoading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Пара" backHref="/today" />
      <div className="flex flex-col gap-4 px-4">
        <p className="text-base text-muted-foreground">{error}</p>
        <Button
          className="h-14 text-lg"
          variant="outline"
          onClick={() => {
            if (peekPendingBuddyToken()) {
              void claim();
              return;
            }
            router.replace("/today");
          }}
        >
          {peekPendingBuddyToken() ? "Повторить" : "К своему дневнику"}
        </Button>
      </div>
    </div>
  );
}
