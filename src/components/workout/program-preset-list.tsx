"use client";

import { ProgramPresetCard } from "@/components/workout/program-preset-card";
import { useGrantedPrograms } from "@/components/workout/use-granted-programs";
import {
  type ProgramLevel,
  type ProgramPresetId,
  pickerProgramPresetIds,
  programPresetsByLevel,
  RECOMMENDED_PROGRAM_PRESET_ID,
} from "@/lib/workout/program-presets";

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
