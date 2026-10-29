"use client";

import { Segmented } from "@/components/ui/segmented";
import { MuscleBodyFigure } from "@/components/workout/muscle-body-figure";
import { useMuscleViewSwipe } from "@/components/workout/use-muscle-view-swipe";
import { formatIsoDate } from "@/lib/day/format";
import type {
  MuscleBodyView,
  MuscleCell,
  MuscleDisplayMode,
  MuscleId,
  UserSex,
} from "@/lib/types";
import { unmappedExerciseLine } from "@/lib/workout/muscle-screen-copy";

export function MuscleScreenFigurePanel({
  since,
  until,
  muscles,
  view,
  setView,
  selectedId,
  displayMode,
  onSelect,
  figureSex,
  unmappedCount,
}: {
  since: string;
  until: string;
  muscles: MuscleCell[];
  view: MuscleBodyView;
  setView: (view: MuscleBodyView) => void;
  selectedId: MuscleId | null;
  displayMode: MuscleDisplayMode;
  onSelect: (id: MuscleId) => void;
  figureSex: UserSex | null;
  unmappedCount: number;
}) {
  const swipe = useMuscleViewSwipe(setView);

  return (
    <div className="card-surface flex flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {formatIsoDate(since, "d MMM")} — {formatIsoDate(until, "d MMM")}
        </p>
        <div className="sm:hidden">
          <Segmented
            value={view}
            options={[
              { id: "front", label: "Спереди" },
              { id: "back", label: "Сзади" },
            ]}
            onChange={setView}
          />
        </div>
      </div>

      <div className="hidden w-full items-start justify-center gap-3 sm:flex">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground">Спереди</span>
          <MuscleBodyFigure
            view="front"
            muscles={muscles}
            selectedId={selectedId}
            displayMode={displayMode}
            onSelect={onSelect}
            figureSex={figureSex}
            zoomable
            className="max-w-full"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground">Сзади</span>
          <MuscleBodyFigure
            view="back"
            muscles={muscles}
            selectedId={selectedId}
            displayMode={displayMode}
            onSelect={onSelect}
            figureSex={figureSex}
            zoomable
            className="max-w-full"
          />
        </div>
      </div>

      <div
        className="sm:hidden"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <MuscleBodyFigure
          view={view}
          muscles={muscles}
          selectedId={selectedId}
          displayMode={displayMode}
          onSelect={onSelect}
          figureSex={figureSex}
          zoomable
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Нажми на мышцу. Кнопки или щипок двумя пальцами — крупнее, потом можно
        двигать.
      </p>
      {unmappedCount > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          {unmappedExerciseLine(unmappedCount)}
        </p>
      ) : null}
    </div>
  );
}
