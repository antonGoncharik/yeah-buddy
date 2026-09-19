"use client";

import { Plus } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { FormulaExampleMax } from "@/components/workout/formula-example-max";
import { MAX_SETS } from "@/components/workout/formula-form";
import { FormulaSetRow } from "@/components/workout/formula-set-row";
import { SortableList } from "@/components/workout/sortable-list";
import { haptic } from "@/lib/telegram/haptic";
import type { FormulaSetSpec } from "@/lib/types";

/** Editable list of sets; no card chrome so it can live inside any section. */
export function FormulaSetList({
  sets,
  exampleMax,
  exampleStep,
  defaultHold,
  allowEmpty = false,
  emptyLabel = "Пусто",
  previewMax,
  onPreviewMaxChange,
  onChange,
}: {
  sets: FormulaSetSpec[];
  exampleMax: number;
  exampleStep: number;
  defaultHold: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  previewMax?: string;
  onPreviewMaxChange?: (value: string) => void;
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
    haptic("tap");
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
    haptic("tap");
    rowIds.current = rowIds.current.filter((_, setIndex) => setIndex !== index);
    onChange(sets.filter((_, setIndex) => setIndex !== index));
  }

  return (
    <div className="flex flex-col gap-1">
      {sets.length === 0 ? (
        <p className="py-2 text-base text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="-mx-2">
          <SortableList
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
                onUpdate={(patch) => updateAt(index, patch)}
                onRemove={() => removeAt(index)}
              />
            )}
          />
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        className="h-11 justify-start px-2 text-base text-primary"
        disabled={sets.length >= MAX_SETS}
        onClick={addSet}
      >
        <Plus className="size-4" />
        Подход
      </Button>
      {previewMax != null && onPreviewMaxChange ? (
        <div className="border-t border-border/60 pt-3">
          <FormulaExampleMax value={previewMax} onChange={onPreviewMaxChange} />
        </div>
      ) : null}
    </div>
  );
}
