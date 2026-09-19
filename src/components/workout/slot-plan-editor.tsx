"use client";

import { ChevronDown, Plus } from "lucide-react";
import { type MutableRefObject, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { Segmented } from "@/components/ui/segmented";
import { SortableList } from "@/components/workout/sortable-list";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { haptic } from "@/lib/telegram/haptic";
import type {
  CyclePhaseDef,
  ExerciseWithMax,
  SlotIntensity,
  SlotLoad,
  SlotPlan,
  SlotSetGroup,
  WorkoutKind,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import {
  defaultSlotGroup,
  defaultSlotPlan,
  formatRepsRange,
  parseRepsRange,
  SLOT_INTENSITIES,
  SLOT_INTENSITY_HINTS,
  SLOT_INTENSITY_LABELS,
  SLOT_LOAD_HINTS,
  SLOT_LOAD_LABELS,
  SLOT_LOAD_TYPES,
  setSlotPhaseGroups,
  slotPhaseKeys,
  switchLoadType,
} from "@/lib/workout/slot-plan";
import { MAX_SLOT_GROUPS } from "@/lib/workout/slot-plan-schema";
import { trackSummary } from "@/lib/workout/track-line";

type IntensityOption = SlotIntensity | "none";

export function SlotPlanEditor({
  kind,
  exercise,
  plan,
  cycle = [],
  onChange,
}: {
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  plan: SlotPlan | null;
  /** Этапы цикла: пока их нет, про этапы ничего не показываем. */
  cycle?: CyclePhaseDef[];
  onChange: (plan: SlotPlan | null) => void;
}) {
  const current = plan ?? defaultSlotPlan();
  const [phaseKey, setPhaseKey] = useState<string | null>(null);
  const [weekOpen, setWeekOpen] = useState(
    () => slotPhaseKeys(plan).length > 0,
  );
  const phase = phaseKey
    ? (cycle.find((item) => item.key === phaseKey) ?? null)
    : null;
  const defaultCustom = current.groups != null;
  const phaseGroups = phase ? (current.phases?.[phase.key] ?? null) : null;
  const phaseCustom = phaseGroups != null;
  const groupIds = useRef<string[]>([]);
  const extraUsed = Boolean(current.intensity || current.note);
  const [showExtra, setShowExtra] = useState(extraUsed);

  useEffect(() => {
    if (extraUsed) {
      setShowExtra(true);
    }
  }, [extraUsed]);

  function update(patch: Partial<SlotPlan>) {
    onChange({ ...current, ...patch });
  }

  function setDefaultGroups(next: SlotSetGroup[] | null) {
    update({ groups: next });
  }

  function setPhaseGroups(next: SlotSetGroup[] | null) {
    if (!phase) {
      return;
    }
    onChange(setSlotPhaseGroups(current, phase.key, next));
  }

  function closeWeeks() {
    setWeekOpen(false);
    setPhaseKey(null);
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border/60 px-1 pt-3 pb-2">
      <p className="text-sm leading-snug text-muted-foreground">
        {cycle.length > 0
          ? "Только это упражнение. Недели общие — задаются отдельно."
          : "Только это упражнение. «Свои» — если нужны другие подходы."}
      </p>

      <div className="flex flex-col gap-2">
        <p className="text-base font-medium">Подходы</p>
        <Segmented
          value={defaultCustom ? "custom" : "shared"}
          options={[
            { id: "shared", label: "Как в плане" },
            { id: "custom", label: "Свои" },
          ]}
          onChange={(id) =>
            setDefaultGroups(
              id === "custom"
                ? (current.groups ?? [defaultSlotGroup(kind)])
                : null,
            )
          }
        />
        {defaultCustom ? (
          <GroupsEditor
            kind={kind}
            exercise={exercise}
            groups={current.groups ?? []}
            groupIds={groupIds}
            onChange={setDefaultGroups}
          />
        ) : (
          <p className="text-sm leading-snug text-muted-foreground">
            Подходы из общего плана. Проценты и разминка — там же.
          </p>
        )}
        {defaultCustom && exercise.formula_preset !== "none" ? (
          <Segmented
            value={current.warmup ? "on" : "off"}
            options={[
              { id: "on", label: "Разминка" },
              { id: "off", label: "Без" },
            ]}
            onChange={(id) => update({ warmup: id === "on" })}
          />
        ) : null}
      </div>

      {showExtra ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Segmented<IntensityOption>
              value={current.intensity ?? "none"}
              options={[
                { id: "none", label: "Обычно" },
                ...SLOT_INTENSITIES.map((intensity) => ({
                  id: intensity,
                  label: SLOT_INTENSITY_LABELS[intensity],
                })),
              ]}
              onChange={(id) =>
                update({ intensity: id === "none" ? null : id })
              }
            />
            <p className="text-sm leading-snug text-muted-foreground">
              {current.intensity
                ? SLOT_INTENSITY_HINTS[current.intensity]
                : "Пометка дня: сколько оставить в запасе в последнем подходе."}
            </p>
          </div>

          <Input
            value={current.note ?? ""}
            placeholder="Заметка: хват, темп, замена"
            maxLength={120}
            className="h-11 text-base"
            onChange={(event) =>
              update({
                note: event.target.value === "" ? null : event.target.value,
              })
            }
          />
        </>
      ) : (
        <button
          type="button"
          className="self-start py-1 text-left text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setShowExtra(true)}
        >
          Ещё: пометка и заметка
        </button>
      )}

      {cycle.length > 0 ? (
        <WeekOverride
          cycle={cycle}
          plan={current}
          open={weekOpen}
          phase={phase}
          phaseCustom={phaseCustom}
          groups={phaseGroups ?? []}
          kind={kind}
          exercise={exercise}
          onToggle={() => {
            haptic("tap");
            if (weekOpen) {
              closeWeeks();
              return;
            }
            setWeekOpen(true);
            const first = slotPhaseKeys(current)[0];
            if (first) {
              setPhaseKey(first);
            }
          }}
          onPickPhase={setPhaseKey}
          onSetPhaseGroups={setPhaseGroups}
        />
      ) : null}
    </div>
  );
}

function WeekOverride({
  cycle,
  plan,
  open,
  phase,
  phaseCustom,
  groups,
  kind,
  exercise,
  onToggle,
  onPickPhase,
  onSetPhaseGroups,
}: {
  cycle: CyclePhaseDef[];
  plan: SlotPlan;
  open: boolean;
  phase: CyclePhaseDef | null;
  phaseCustom: boolean;
  groups: SlotSetGroup[];
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  onToggle: () => void;
  onPickPhase: (key: string) => void;
  onSetPhaseGroups: (next: SlotSetGroup[] | null) => void;
}) {
  const marked = slotPhaseKeys(plan);
  const names = cycle
    .filter((item) => marked.includes(item.key))
    .map((item) => item.name)
    .join(", ");
  const phaseIds = useRef<string[]>([]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 px-3 py-2.5">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
        onClick={onToggle}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium">На неделе иначе</span>
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
            {names
              ? `Свои подходы: ${names}`
              : "Цикл общий. Сюда — только если на этапе другие подходы."}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-3">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {cycle.map((item) => (
              <Chip
                key={item.key}
                label={item.name}
                marked={marked.includes(item.key)}
                selected={phase?.key === item.key}
                onClick={() => onPickPhase(item.key)}
              />
            ))}
          </div>
          {phase ? (
            <>
              <Segmented
                value={phaseCustom ? "custom" : "shared"}
                options={[
                  { id: "shared", label: "Как обычно" },
                  { id: "custom", label: "Свои" },
                ]}
                onChange={(id) =>
                  onSetPhaseGroups(
                    id === "custom"
                      ? groups.length > 0
                        ? groups
                        : (plan.groups ?? [defaultSlotGroup(kind)])
                      : null,
                  )
                }
              />
              {phaseCustom ? (
                <GroupsEditor
                  kind={kind}
                  exercise={exercise}
                  groups={groups}
                  groupIds={phaseIds}
                  onChange={onSetPhaseGroups}
                />
              ) : (
                <p className="text-sm leading-snug text-muted-foreground">
                  На этапе «{phase.name}» подходы как обычно. Другой вес на эту
                  неделю — включи «Свои».
                </p>
              )}
            </>
          ) : (
            <p className="text-sm leading-snug text-muted-foreground">
              Выбери неделю.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  label,
  selected,
  marked,
  onClick,
}: {
  label: string;
  selected: boolean;
  marked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      <span className="truncate">{label}</span>
      {marked ? (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            selected ? "bg-primary-foreground" : "bg-primary",
          )}
        />
      ) : null}
    </button>
  );
}

function GroupsEditor({
  kind,
  exercise,
  groups,
  groupIds,
  onChange,
}: {
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  groups: SlotSetGroup[];
  groupIds: MutableRefObject<string[]>;
  onChange: (next: SlotSetGroup[] | null) => void;
}) {
  if (groupIds.current.length !== groups.length) {
    groupIds.current = groups.map(
      (_, index) => groupIds.current[index] ?? crypto.randomUUID(),
    );
  }

  function updateGroup(index: number, patch: Partial<SlotSetGroup>) {
    onChange(
      groups.map((group, position) =>
        position === index ? { ...group, ...patch } : group,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <SortableList
        variant="cards"
        items={groups.map((group, index) => ({
          id: groupIds.current[index] ?? `group-${index}`,
          group,
        }))}
        onReorder={(next) => {
          groupIds.current = next.map((item) => item.id);
          onChange(next.map((item) => item.group));
        }}
        renderItem={(item, index) => (
          <GroupRow
            kind={kind}
            exercise={exercise}
            group={item.group}
            canRemove={groups.length > 1}
            onChange={(patch) => updateGroup(index, patch)}
            onRemove={() => {
              groupIds.current = groupIds.current.filter(
                (_, position) => position !== index,
              );
              onChange(groups.filter((_, position) => position !== index));
            }}
          />
        )}
      />
      {groups.length < MAX_SLOT_GROUPS ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 justify-start px-1 text-base text-primary"
          onClick={() =>
            onChange([
              ...groups,
              { ...(groups[groups.length - 1] ?? defaultSlotGroup(kind)) },
            ])
          }
        >
          <Plus className="size-4" />
          Ещё подходы
        </Button>
      ) : null}
    </div>
  );
}

function GroupRow({
  kind,
  exercise,
  group,
  canRemove,
  onChange,
  onRemove,
}: {
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  group: SlotSetGroup;
  canRemove: boolean;
  onChange: (patch: Partial<SlotSetGroup>) => void;
  onRemove: () => void;
}) {
  const load = group.load;
  const exampleWeight = exercise.current_max?.max_weight ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 px-3 py-2.5">
      <div className="flex min-w-0 items-end gap-2">
        <NumField
          label="подх."
          value={group.sets}
          inputMode="numeric"
          onCommit={(value) => {
            if (value != null && value >= 1) {
              onChange({ sets: Math.round(value) });
            }
          }}
        />
        <span className="flex h-11 shrink-0 items-center text-lg text-muted-foreground">
          ×
        </span>
        {kind === "static" ? (
          <NumField
            label="сек"
            value={group.seconds}
            inputMode="decimal"
            onCommit={(value) => {
              if (value != null && value > 0) {
                onChange({ seconds: value, reps: null, reps_to: null });
              }
            }}
          />
        ) : (
          <RepsField
            reps={group.reps}
            repsTo={group.reps_to}
            onCommit={(reps, repsTo) =>
              onChange({ reps, reps_to: repsTo, seconds: null })
            }
          />
        )}
        {canRemove ? (
          <div className="-mb-0.5 -mr-1 shrink-0">
            <RemoveRowButton onClick={onRemove} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Segmented
          value={load.type === "orm" ? "percent" : load.type}
          options={SLOT_LOAD_TYPES.map((type) => ({
            id: type,
            label: SLOT_LOAD_LABELS[type],
          }))}
          onChange={(type) =>
            onChange({
              load: switchLoadType(load, type, exampleWeight),
            })
          }
        />
        {load.type === "percent" || load.type === "orm" ? (
          <NumField
            label="%"
            value={load.percent}
            inputMode="decimal"
            onCommit={(value) => {
              if (value != null && value > 0) {
                onChange({ load: { type: load.type, percent: value } });
              }
            }}
          />
        ) : null}
        {load.type === "track" ? (
          <NumField
            label="± кг"
            value={load.offset}
            inputMode="decimal"
            allowZero
            allowNegative
            onCommit={(value) => {
              if (value != null) {
                onChange({ load: { ...load, offset: value } });
              }
            }}
          />
        ) : null}
        {load.type === "fixed" ? (
          <NumField
            label="кг"
            value={load.weight}
            inputMode="decimal"
            onCommit={(value) => {
              if (value != null && value > 0) {
                onChange({ load: { type: "fixed", weight: value } });
              }
            }}
          />
        ) : null}
      </div>
      <p className="text-sm leading-snug text-muted-foreground">
        {loadHint(load, exercise)}
      </p>
    </div>
  );
}

/** Подсказка под строкой: что за вес и есть ли всё нужное. */
function loadHint(load: SlotLoad, exercise: ExerciseWithMax): string {
  if (load.type === "track") {
    return exercise.track
      ? `Рабочий кг: ${trackSummary(exercise.track)}.`
      : "Рабочего кг ещё нет — спросим на тренировке.";
  }
  if (load.type === "percent" || load.type === "orm") {
    return exercise.current_max
      ? `От 1ПМ ${formatWeight(exercise.current_max.max_weight)} кг.`
      : SLOT_LOAD_HINTS.percent;
  }
  return SLOT_LOAD_HINTS[load.type];
}

function RepsField({
  reps,
  repsTo,
  onCommit,
}: {
  reps: number | null;
  repsTo: number | null;
  onCommit: (reps: number, repsTo: number | null) => void;
}) {
  const external = formatRepsRange(reps, repsTo);
  const [text, setText] = useState(external);
  useEffect(() => {
    setText(external);
  }, [external]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs text-muted-foreground">раз</span>
      <Input
        aria-label="раз"
        inputMode="numeric"
        enterKeyHint="next"
        value={text}
        placeholder="6–8"
        className="h-11 min-w-0 text-base tabular-nums"
        onKeyDown={handleNumericEnter}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const parsed = parseRepsRange(next);
          if (parsed) {
            onCommit(parsed.reps, parsed.reps_to);
          }
        }}
      />
    </div>
  );
}

function NumField({
  label,
  value,
  inputMode,
  allowZero = false,
  allowNegative = false,
  onCommit,
}: {
  label: string;
  value: number | null;
  inputMode: "decimal" | "numeric";
  allowZero?: boolean;
  allowNegative?: boolean;
  onCommit: (value: number | null) => void;
}) {
  const external = value == null ? "" : formatWeight(value);
  const [text, setText] = useState(external);
  useEffect(() => {
    setText(external);
  }, [external]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        aria-label={label}
        inputMode={inputMode}
        enterKeyHint="next"
        value={text}
        className="h-11 min-w-0 text-base tabular-nums"
        onKeyDown={handleNumericEnter}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const parsed = parseSigned(next, allowNegative);
          if (parsed == null) {
            return;
          }
          if (parsed === 0 && !allowZero) {
            return;
          }
          onCommit(parsed);
        }}
      />
    </div>
  );
}

function parseSigned(raw: string, allowNegative: boolean): number | null {
  const trimmed = raw.trim().replace(/^\+/, "");
  if (trimmed === "" || trimmed === "-") {
    return null;
  }
  const negative = trimmed.startsWith("-") || trimmed.startsWith("−");
  if (negative && !allowNegative) {
    return null;
  }
  const value = parseDecimal(negative ? trimmed.slice(1) : trimmed);
  if (value == null) {
    return null;
  }
  return negative ? -value : value;
}
