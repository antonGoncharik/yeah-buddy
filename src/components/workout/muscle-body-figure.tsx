"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMuscleFigureZoom } from "@/components/workout/use-muscle-figure-zoom";
import type {
  MuscleBodyView,
  MuscleCell,
  MuscleDisplayMode,
  MuscleId,
  UserSex,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  MUSCLE_BODY_PATHS_BACK,
  MUSCLE_BODY_PATHS_BACK_FEMALE,
  MUSCLE_BODY_PATHS_FRONT,
  MUSCLE_BODY_PATHS_FRONT_FEMALE,
  MUSCLE_BODY_VIEWBOX,
} from "@/lib/workout/muscle-body-paths";
import {
  BODY_SLUGS_BY_VIEW,
  slugSelectMuscle,
} from "@/lib/workout/muscle-body-slugs";
import {
  muscleCellHint,
  muscleHeatRing,
  slugHeatFill,
} from "@/lib/workout/muscle-heat-style";
import { MUSCLE_LABELS } from "@/lib/workout/muscle-taxonomy";

function pathsForView(
  view: MuscleBodyView,
  sex: UserSex | null,
): Record<string, string[]> {
  if (sex === "female") {
    return view === "front"
      ? MUSCLE_BODY_PATHS_FRONT_FEMALE
      : MUSCLE_BODY_PATHS_BACK_FEMALE;
  }
  return view === "front" ? MUSCLE_BODY_PATHS_FRONT : MUSCLE_BODY_PATHS_BACK;
}

/** Back figures live in the right half of the source SVG, not at x=0. */
function viewBoxFor(view: MuscleBodyView, sex: UserSex | null): string {
  if (view === "front") {
    return MUSCLE_BODY_VIEWBOX;
  }
  return sex === "female" ? "756 0 774 1448" : "724 0 724 1448";
}

function slugSelected(
  slug: string,
  selectedId: MuscleId | null,
  byId: Map<MuscleId, MuscleCell>,
): boolean {
  if (!selectedId) {
    return false;
  }
  const pick = slugSelectMuscle(slug, byId);
  return pick === selectedId;
}

function slugCell(
  slug: string,
  byId: Map<MuscleId, MuscleCell>,
): MuscleCell | undefined {
  const id = slugSelectMuscle(slug, byId);
  return id ? byId.get(id) : undefined;
}

export function MuscleBodyFigure({
  view,
  muscles,
  selectedId,
  displayMode,
  onSelect,
  compact = false,
  zoomable = false,
  className,
  figureSex = null,
}: {
  view: MuscleBodyView;
  muscles: MuscleCell[];
  selectedId: MuscleId | null;
  displayMode: MuscleDisplayMode;
  onSelect: (id: MuscleId) => void;
  compact?: boolean;
  zoomable?: boolean;
  className?: string;
  figureSex?: UserSex | null;
}) {
  const byId = new Map(muscles.map((item) => [item.id, item]));
  const slugs = BODY_SLUGS_BY_VIEW[view];
  const pathMap = pathsForView(view, figureSex);
  const zoom = useMuscleFigureZoom(zoomable, view);

  return (
    <div
      className={cn(
        "relative mx-auto w-full",
        compact
          ? "max-w-[140px]"
          : zoomable
            ? "max-w-[min(100%,20rem)]"
            : "max-w-[200px]",
        className,
      )}
    >
      <div
        ref={zoom.viewportRef}
        className="overflow-hidden"
        style={{ touchAction: zoomable && zoom.scale > 1 ? "none" : "pan-y" }}
      >
        <svg
          viewBox={viewBoxFor(view, figureSex)}
          className={cn(
            "h-auto w-full select-none",
            zoomable && zoom.scale > 1 && "cursor-grab active:cursor-grabbing",
          )}
          style={
            zoomable
              ? {
                  transform: `translate(${zoom.pan.x}px, ${zoom.pan.y}px) scale(${zoom.scale})`,
                  transformOrigin: "center",
                }
              : undefined
          }
          role="img"
          aria-label={view === "front" ? "Схема спереди" : "Схема сзади"}
        >
          <rect
            width="100%"
            height="100%"
            fill="color-mix(in oklch, var(--muted) 35%, transparent)"
            rx="24"
          />
          {slugs.map((slug) => {
            const dList = pathMap[slug];
            if (!dList?.length) {
              return null;
            }
            const cell = slugCell(slug, byId);
            const selected = slugSelected(slug, selectedId, byId);
            const fill = slugHeatFill(slug, byId, displayMode);
            const muscleId = slugSelectMuscle(slug, byId);
            if (!muscleId) {
              return null;
            }
            const label = cell?.label ?? MUSCLE_LABELS[muscleId];
            const hint = cell ? muscleCellHint(cell) : "Нет данных за период";
            return (
              // biome-ignore lint/a11y/useSemanticElements: SVG muscle zones are hit targets, not native buttons
              <g
                key={slug}
                role="button"
                tabIndex={0}
                className="cursor-pointer outline-none focus-visible:opacity-90"
                aria-label={`${label}. ${hint}`}
                onClick={() => {
                  if (zoom.ignoreClick()) {
                    return;
                  }
                  onSelect(muscleId);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }
                  event.preventDefault();
                  onSelect(muscleId);
                }}
              >
                {dList.map((d) => (
                  <path
                    key={`${slug}-${d.slice(0, 24)}-${d.length}`}
                    d={d}
                    fill={fill}
                    stroke={muscleHeatRing(cell, selected)}
                    strokeWidth={selected ? 3 : cell?.in_next_session ? 2 : 1.2}
                    strokeDasharray={
                      cell?.in_next_session && !selected ? "4 3" : undefined
                    }
                    vectorEffect="non-scaling-stroke"
                    className={cn(
                      "transition-[fill,stroke-width] duration-200",
                      cell?.volume_band === 0 && "opacity-55",
                    )}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      {zoomable ? (
        <div className="sticky bottom-3 z-10 mt-2 flex justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-11"
            aria-label="Мельче"
            disabled={zoom.atMin}
            onClick={zoom.zoomOut}
          >
            <Minus />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-11"
            aria-label="Крупнее"
            disabled={zoom.atMax}
            onClick={zoom.zoomIn}
          >
            <Plus />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
