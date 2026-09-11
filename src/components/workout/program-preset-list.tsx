import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import {
  type ProgramLevel,
  type ProgramPreset,
  type ProgramPresetId,
  presetExerciseLine,
  programPresetSummary,
  programPresetsByLevel,
} from "@/lib/workout/program-presets";

export function ProgramPresetList({
  value,
  disabled,
  onPick,
  compact,
  recommendedId,
  levels,
  showLevelLabels = true,
}: {
  value?: ProgramPresetId | null;
  disabled?: boolean;
  onPick: (id: ProgramPresetId) => void;
  compact?: boolean;
  recommendedId?: ProgramPresetId;
  levels?: readonly ProgramLevel[];
  showLevelLabels?: boolean;
}) {
  const groups = programPresetsByLevel().filter(
    (group) => !levels || levels.includes(group.level),
  );

  return (
    <>
      {groups.map((group) => (
        <div key={group.level} className="flex flex-col gap-2">
          {showLevelLabels ? (
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
              compact={compact}
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
  compact,
  recommended,
  onPick,
}: {
  preset: ProgramPreset;
  pressed: boolean;
  disabled?: boolean;
  compact?: boolean;
  recommended?: boolean;
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
      onClick={() => {
        if (!pressed) {
          haptic("tick");
        }
        onPick();
      }}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-lg font-medium">{preset.name}</p>
        {recommended ? (
          <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
            для старта
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{preset.hint}</p>
      {compact ? (
        <p className="mt-2 text-sm leading-snug text-muted-foreground">
          {programPresetSummary(preset)}
        </p>
      ) : (
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
      )}
    </button>
  );
}
