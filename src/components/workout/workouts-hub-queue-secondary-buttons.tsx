"use client";

import { Button } from "@/components/ui/button";
import type { HubQueueSecondaryAction } from "@/lib/workout/hub-view";

export function WorkoutsHubQueueSecondaryButtons({
  actions,
  busy,
}: {
  actions: HubQueueSecondaryAction[];
  busy: boolean;
}) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="-mb-1 flex min-w-0 flex-col gap-2">
      {actions.map((item) => (
        <Button
          key={item.key}
          type="button"
          variant="ghost"
          className="h-auto min-h-11 w-full max-w-full whitespace-normal px-4 py-2.5 text-base leading-snug text-muted-foreground"
          disabled={busy}
          onClick={item.onClick}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
