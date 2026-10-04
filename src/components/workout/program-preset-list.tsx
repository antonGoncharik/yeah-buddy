"use client";

import { useEffect, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import {
  type ProgramLevel,
  type ProgramPreset,
  type ProgramPresetId,
  parseGrantedPrograms,
  pickerProgramPresetIds,
  presetExerciseLine,
  programDayExerciseNames,
  programPresetHint,
  programPresetsByLevel,
  RECOMMENDED_PROGRAM_PRESET_ID,
} from "@/lib/workout/program-presets";

function useGrantedPrograms(): ProgramPresetId[] {
  const [granted, setGranted] = useState<ProgramPresetId[]>([]);

  useEffect(() => {
    void cachedGet("/api/settings", (data) => {
      const settings = readSettingsPayload(data);
      if (!settings) {
        return false;
      }
      setGranted(parseGrantedPrograms(settings.granted_programs));
      return true;
    }).catch(() => {
      setGranted([]);
    });
  }, []);

  return granted;
}

/** Listed catalog with level headings; «Всё тело» marked as recommended. */
export function ProgramPresetCatalog({
  value,
  disabled,
  ids,
  headings = true,
  onPick,
}: {
  value?: ProgramPresetId | null;
  disabled?: boolean;
  /** When set, only these programs — onboarding’s home shelf. */
  ids?: readonly ProgramPresetId[];
  headings?: boolean;
  onPick: (id: ProgramPresetId) => void;
}) {
  const granted = useGrantedPrograms();
  const catalogIds = ids ?? pickerProgramPresetIds(value, granted);

  return (
    <ProgramPresetList
      value={value}
      disabled={disabled}
      recommendedId={ids ? undefined : RECOMMENDED_PROGRAM_PRESET_ID}
      ids={catalogIds}
      headings={headings}
      onPick={onPick}
    />
  );
}

export function ProgramPresetList({
  value,
  disabled,
  onPick,
  recommendedId,
  levels,
  ids,
  headings = true,
}: {
  value?: ProgramPresetId | null;
  disabled?: boolean;
  onPick: (id: ProgramPresetId) => void;
  recommendedId?: ProgramPresetId;
  levels?: readonly ProgramLevel[];
  ids?: readonly ProgramPresetId[];
  headings?: boolean;
}) {
  const groups = programPresetsByLevel()
    .map((group) => ({
      ...group,
      presets: group.presets.filter((preset) => {
        if (levels && !levels.includes(group.level)) {
          return false;
        }
        if (ids && !ids.includes(preset.id)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((group) => group.presets.length > 0);

  return (
    <>
      {groups.map((group) => (
        <div key={group.level} className="flex flex-col gap-2">
          {headings ? (
            <h3 className="px-1 pt-1 text-sm font-medium text-muted-foreground">
              {group.label}
            </h3>
          ) : null}
          {group.presets.map((preset) => (
            <ProgramPresetCard
              key={preset.id}
              preset={preset}
              pressed={value === preset.id}
              disabled={disabled}
              recommended={recommendedId === preset.id}
              onPick={() => onPick(preset.id)}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function ProgramPresetCard({
  preset,
  pressed,
  disabled,
  recommended,
  onPick,
}: {
  preset: ProgramPreset;
  pressed: boolean;
  disabled?: boolean;
  recommended?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(
        "w-full rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:transition-none disabled:opacity-50",
        pressed
          ? "bg-primary text-primary-foreground shadow-sm"
          : "card-surface hover:bg-muted/30",
      )}
      onClick={() => {
        if (!pressed) {
          haptic("tick");
        }
        onPick();
      }}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-lg font-medium">{preset.name}</p>
        {pressed ? (
          <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs font-medium text-primary-foreground">
            выбрано
          </span>
        ) : null}
        {recommended && !pressed ? (
          <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
            советуем для начала
          </span>
        ) : null}
        {preset.cycle ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              pressed
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            вес меняется по неделям
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 text-sm",
          pressed ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {programPresetHint(preset)}
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {preset.templates.map((day) => (
          <p key={day.name} className="text-sm leading-snug">
            <span className="font-medium">{day.name}</span>
            <span
              className={
                pressed ? "text-primary-foreground/80" : "text-muted-foreground"
              }
            >
              {" "}
              · {presetExerciseLine(programDayExerciseNames(day))}
            </span>
          </p>
        ))}
        {preset.cycle ? (
          <p
            className={cn(
              "text-sm leading-snug",
              pressed ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            Недели: {preset.cycle.map((phase) => phase.name).join(" → ")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
