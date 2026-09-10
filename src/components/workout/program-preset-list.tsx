import { cn } from "@/lib/utils";
import {
  type ProgramPreset,
  type ProgramPresetId,
  presetExerciseLine,
  programPresetsByLevel,
} from "@/lib/workout/program-presets";

export function ProgramPresetList({
  value,
  disabled,
  onPick,
}: {
  value?: ProgramPresetId | null;
  disabled?: boolean;
  onPick: (id: ProgramPresetId) => void;
}) {
  return (
    <>
      {programPresetsByLevel().map((group) => (
        <div key={group.level} className="flex flex-col gap-2">
          <h3 className="px-1 pt-1 text-sm font-medium text-muted-foreground">
            {group.label}
          </h3>
          {group.presets.map((preset) => (
            <ProgramPresetCard
              key={preset.id}
              preset={preset}
              pressed={value === preset.id}
              disabled={disabled}
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
  onPick,
}: {
  preset: ProgramPreset;
  pressed: boolean;
  disabled?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(
        "card-surface w-full px-5 py-4 text-left transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out-soft)] hover:bg-muted/30 active:scale-[0.97] motion-reduce:transition-none disabled:opacity-50",
        pressed && "ring-2 ring-primary",
      )}
      onClick={onPick}
    >
      <p className="text-lg font-medium">{preset.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">{preset.hint}</p>
      <div className="mt-3 flex flex-col gap-1.5">
        {preset.templates.map((day) => (
          <p key={day.name} className="text-sm leading-snug">
            <span className="font-medium">{day.name}</span>
            <span className="text-muted-foreground">
              {" "}
              · {presetExerciseLine(day.exercises)}
            </span>
          </p>
        ))}
      </div>
    </button>
  );
}
