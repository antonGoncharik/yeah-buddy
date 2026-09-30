"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/telegram/haptic";
import {
  HOME_SCREEN_TIP_BODY,
  HOME_SCREEN_TIP_TITLE,
  type HomeScreenStatus,
  readHomeScreenStatus,
} from "@/lib/telegram/home-screen";
import {
  dismissHomeScreenTip,
  readHomeScreenTipDismissed,
} from "@/lib/telegram/home-screen-seen";

export function SettingsHomeScreenTip() {
  const [status, setStatus] = useState<HomeScreenStatus | "loading">("loading");
  const [dismissed, setDismissed] = useState(() =>
    readHomeScreenTipDismissed(),
  );

  useEffect(() => {
    void readHomeScreenStatus().then(setStatus);
  }, []);

  if (
    dismissed ||
    status === "loading" ||
    status === "unsupported" ||
    status === "added"
  ) {
    return null;
  }

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Подсказка</p>
        <h2 className="mt-1 text-lg font-semibold">{HOME_SCREEN_TIP_TITLE}</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {HOME_SCREEN_TIP_BODY}
      </p>
      <Button
        type="button"
        variant="secondary"
        className="h-11 w-full text-base"
        onClick={() => {
          haptic("tick");
          dismissHomeScreenTip();
          setDismissed(true);
        }}
      >
        Понятно
      </Button>
    </section>
  );
}
