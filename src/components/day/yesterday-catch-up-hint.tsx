"use client";

import { CATCH_UP_YESTERDAY_HINT } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";

export function showYesterdayCatchUpHint(input: {
  isToday: boolean;
  yesterdayExists: boolean;
  viewOnly: boolean;
  retentionTail?: boolean;
}): boolean {
  return (
    input.isToday &&
    !input.yesterdayExists &&
    !input.viewOnly &&
    !input.retentionTail
  );
}

export function YesterdayCatchUpHint({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="px-1 text-left text-base text-muted-foreground"
      onClick={() => {
        haptic("tap");
        onOpen();
      }}
    >
      {CATCH_UP_YESTERDAY_HINT}
    </button>
  );
}
