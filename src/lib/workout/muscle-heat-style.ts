import type {
  MuscleCell,
  MuscleDisplayMode,
  MuscleId,
  VolumeBand,
} from "@/lib/types";
import { slugSelectMuscle } from "@/lib/workout/muscle-body-slugs";
import { VOLUME_BAND_LABELS } from "@/lib/workout/muscle-volume";

const VOLUME_FILL: Record<VolumeBand, string> = {
  0: "color-mix(in oklch, var(--muted) 92%, transparent)",
  1: "color-mix(in oklch, var(--primary) 22%, var(--muted))",
  2: "color-mix(in oklch, var(--primary) 42%, var(--muted))",
  3: "color-mix(in oklch, var(--primary) 68%, var(--muted))",
  4: "color-mix(in oklch, var(--primary) 88%, var(--muted))",
};

/** Stripes on mid/high bands so volume is readable without hue alone. */
const VOLUME_PATTERN: Partial<Record<VolumeBand, string>> = {
  2: "repeating-linear-gradient(135deg, color-mix(in oklch, var(--foreground) 14%, transparent) 0 1px, transparent 1px 5px)",
  3: "repeating-linear-gradient(90deg, color-mix(in oklch, var(--foreground) 16%, transparent) 0 1px, transparent 1px 4px)",
  4: "repeating-linear-gradient(45deg, color-mix(in oklch, var(--foreground) 18%, transparent) 0 1px, transparent 1px 3px)",
};

const VOLUME_LEGEND_NOTE: Partial<Record<VolumeBand, string>> = {
  2: " · полоски",
  3: " · штрихи",
  4: " · сетка",
};

export function muscleVolumeSwatchStyle(
  band: VolumeBand,
  mode: MuscleDisplayMode = "volume",
): { background: string; backgroundImage?: string } {
  const background = muscleHeatFill(
    {
      id: "chest",
      label: "",
      view: "front",
      sets: band > 0 ? 1 : 0,
      sets_per_week: band * 5,
      volume_band: band,
      last_trained: null,
      days_since: null,
      in_next_session: false,
      missed_sessions: 0,
      weekly_sets: [],
      direct_sets: 0,
      assist_sets: 0,
      recovery_percent: null,
    },
    mode,
  );
  const backgroundImage = mode === "volume" ? VOLUME_PATTERN[band] : undefined;
  return backgroundImage ? { background, backgroundImage } : { background };
}

export function muscleVolumeLegendSuffix(band: VolumeBand): string {
  return VOLUME_LEGEND_NOTE[band] ?? "";
}

export function muscleVolumeBarStyle(
  cell: MuscleCell,
  mode: MuscleDisplayMode,
): { background: string; backgroundImage?: string } {
  const background = muscleHeatFill(cell, mode);
  if (mode !== "volume" || cell.volume_band < 2) {
    return { background };
  }
  const backgroundImage = VOLUME_PATTERN[cell.volume_band];
  return backgroundImage ? { background, backgroundImage } : { background };
}

export function muscleHeatFill(
  cell: MuscleCell | undefined,
  mode: MuscleDisplayMode,
): string {
  if (mode === "recovery") {
    const recovery = cell?.recovery_percent;
    if (recovery == null || (cell?.sets ?? 0) <= 0) {
      return VOLUME_FILL[0];
    }
    if (recovery >= 90) {
      return "color-mix(in oklch, var(--chart-4, var(--primary)) 72%, var(--muted))";
    }
    if (recovery >= 70) {
      return VOLUME_FILL[3];
    }
    if (recovery >= 50) {
      return VOLUME_FILL[2];
    }
    return VOLUME_FILL[1];
  }
  if (!cell || cell.volume_band === 0) {
    return VOLUME_FILL[0];
  }
  return VOLUME_FILL[cell.volume_band];
}

export function muscleHeatRing(
  cell: MuscleCell | undefined,
  selected: boolean,
): string {
  if (selected) {
    return "var(--primary)";
  }
  if (cell?.in_next_session) {
    return "var(--primary)";
  }
  if ((cell?.missed_sessions ?? 0) > 0 && (cell?.sets ?? 0) < 2) {
    return "color-mix(in oklch, var(--destructive) 70%, transparent)";
  }
  return "color-mix(in oklch, var(--foreground) 10%, transparent)";
}

export function muscleBandLabel(band: VolumeBand): string {
  return VOLUME_BAND_LABELS[band];
}

export function slugHeatFill(
  slug: string,
  byId: Map<MuscleId, MuscleCell>,
  mode: MuscleDisplayMode,
): string {
  const id = slugSelectMuscle(slug, byId);
  return muscleHeatFill(id ? byId.get(id) : undefined, mode);
}

export function muscleCellHint(cell: MuscleCell): string {
  if (cell.in_next_session) {
    return "В следующей тренировке";
  }
  if (cell.missed_sessions > 0 && cell.sets < 2) {
    return "Был пропуск с этой зоной";
  }
  if (cell.volume_band === 0) {
    return "За период почти не было нагрузки";
  }
  return `~${cell.sets_per_week} прямых подх./нед · ${muscleBandLabel(cell.volume_band)}`;
}
