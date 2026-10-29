"use client";

import {
  BARBELL_VIEWBOX,
  BarbellMark,
  Doodle,
} from "@/components/layout/doodles";
import { sessionDoneHeadline } from "@/lib/flavor";
import type { SessionFeel } from "@/lib/types";

export function SessionCompletedPanelHeader({
  feel,
  easyPointer,
  barbellPointer,
  extraPlate,
}: {
  feel: SessionFeel | null;
  easyPointer: Record<string, (() => void) | undefined>;
  barbellPointer: Record<string, (() => void) | undefined>;
  extraPlate: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="select-none text-xl font-semibold" {...easyPointer}>
        {sessionDoneHeadline(feel)}
      </h2>
      <button
        type="button"
        className="mt-1 text-muted-foreground"
        aria-label="Штанга"
        {...barbellPointer}
      >
        <Doodle className="h-5 w-auto" viewBox={BARBELL_VIEWBOX}>
          <BarbellMark extra={extraPlate} />
        </Doodle>
      </button>
    </div>
  );
}
