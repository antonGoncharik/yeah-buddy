"use client";

import { DAY_TYPE_LABELS, formatKcal } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { DayType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TodayDayStrip({
  training,
  gymEnabled,
  busy,
  viewOnly,
  remainingKcal,
  remainingProtein,
  summaryOpen,
  onToggleSummary,
  onSwitchType,
}: {
  training: boolean;
  gymEnabled: boolean;
  busy: boolean;
  viewOnly: boolean;
  remainingKcal: number;
  remainingProtein: number;
  summaryOpen: boolean;
  onToggleSummary: () => void;
  onSwitchType: (dayType: DayType) => Promise<void>;
}) {
  const kcalOver = remainingKcal < 0;
  const proteinLeft = Math.max(0, Math.round(remainingProtein));
  const kcalText = kcalOver
    ? `сверх ${formatKcal(-remainingKcal)} ккал`
    : `осталось ${formatKcal(Math.max(0, remainingKcal))} ккал`;
  const proteinText =
    remainingProtein <= 0 ? "белок закрыт" : `белок ${proteinLeft} г`;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl px-3 py-3",
        training
          ? "bg-primary/15"
          : "bg-[oklch(0.9_0.045_140)] dark:bg-[oklch(0.32_0.04_145)]",
      )}
    >
      <div className="flex items-center gap-2">
        {gymEnabled ? (
          <button
            type="button"
            className="shrink-0 rounded-xl px-2 py-2 text-base font-semibold disabled:opacity-60"
            disabled={busy || viewOnly}
            onClick={() => {
              haptic("tap");
              void onSwitchType(training ? "rest" : "training");
            }}
          >
            {training ? DAY_TYPE_LABELS.training : DAY_TYPE_LABELS.rest}
          </button>
        ) : (
          <span className="shrink-0 px-2 text-base font-semibold">
            {DAY_TYPE_LABELS.rest}
          </span>
        )}
        <button
          type="button"
          className="min-w-0 flex-1 py-2 text-left text-sm leading-snug"
          aria-expanded={summaryOpen}
          onClick={() => {
            haptic("tap");
            onToggleSummary();
          }}
        >
          {kcalText} · {proteinText}
        </button>
      </div>
    </div>
  );
}
