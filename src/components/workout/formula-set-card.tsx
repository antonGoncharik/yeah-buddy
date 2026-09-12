"use client";

import { Plus } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { MAX_SETS } from "@/components/workout/formula-form";
import { FormulaSetRow } from "@/components/workout/formula-set-row";
import { SortableList } from "@/components/workout/sortable-list";
import type { FormulaSetSpec } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ToggleChip({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-3 py-2 text-sm",
        on
          ? "bg-primary/12 font-medium text-primary"
          : "bg-muted text-muted-foreground",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function SetCard({
  title,
  hint,
  defaultHold,
  sets,
  exampleMax,
  exampleStep,
  allowEmpty = false,
  onChange,
}: {
  title: string;
  hint: string;
  defaultHold: boolean;
  sets: FormulaSetSpec[];
  exampleMax: number;
  exampleStep: number;
  allowEmpty?: boolean;
  onChange: (sets: FormulaSetSpec[]) => void;
}) {
  const rowIds = useRef<string[]>([]);
  if (rowIds.current.length !== sets.length) {
    rowIds.current = sets.map(
      (_, index) => rowIds.current[index] ?? `set-${crypto.randomUUID()}`,
    );
  }

  function updateAt(index: number, patch: Partial<FormulaSetSpec>) {
    onChange(
      sets.map((set, setIndex) =>
        setIndex === index ? { ...set, ...patch } : set,
      ),
    );
  }

  function addSet() {
    if (sets.length >= MAX_SETS) {
      return;
    }
    const last = sets[sets.length - 1];
    rowIds.current = [...rowIds.current, `set-${crypto.randomUUID()}`];
    onChange([
      ...sets,
      last
        ? { ...last }
        : defaultHold
          ? { percent: 100, reps: null, seconds: 6 }
          : { percent: 80, reps: 5, seconds: null },
    ]);
  }

  function removeAt(index: number) {
    if (!allowEmpty && sets.length <= 1) {
      return;
    }
    rowIds.current = rowIds.current.filter((_, setIndex) => setIndex !== index);
    onChange(sets.filter((_, setIndex) => setIndex !== index));
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>

      {sets.length === 0 ? (
        <p className="text-base text-muted-foreground">Пусто</p>
      ) : (
        <SortableList
          variant="cards"
          items={sets.map((set, index) => ({
            id: rowIds.current[index] ?? `set-${index}`,
            set,
          }))}
          onReorder={(next) => {
            rowIds.current = next.map((item) => item.id);
            onChange(next.map((item) => item.set));
          }}
          renderItem={(item, index) => (
            <FormulaSetRow
              index={index}
              set={item.set}
              exampleMax={exampleMax}
              exampleStep={exampleStep}
              canRemove={allowEmpty || sets.length > 1}
              hideIndex
              onUpdate={(patch) => updateAt(index, patch)}
              onRemove={() => removeAt(index)}
            />
          )}
        />
      )}

      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={sets.length >= MAX_SETS}
        onClick={addSet}
      >
        <Plus className="size-4" />
        Подход
      </Button>
    </section>
  );
}
