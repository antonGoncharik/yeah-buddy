"use client";

import { Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { FormulaCycleAdvanceSettings } from "@/components/workout/formula-cycle-advance-settings";
import { FormulaCyclePhaseRow } from "@/components/workout/formula-cycle-phase-row";
import { MAX_PHASES } from "@/components/workout/formula-form";
import { SortableList } from "@/components/workout/sortable-list";
import type { WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { reorderCycle } from "@/lib/workout/cycle";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function FormulaCycleActiveEditor({
  formulas,
  kind,
  showKindSwitch,
  setKind,
  openKey,
  setOpenKey,
  exampleMax,
  exampleStep,
  setFormulas,
  setSaved,
  onAddPhase,
  onPickOtherTemplate,
  onClearCycle,
}: {
  formulas: WorkoutFormulas;
  kind: WorkoutKind;
  showKindSwitch: boolean;
  setKind: (kind: WorkoutKind) => void;
  openKey: string | null;
  setOpenKey: Dispatch<SetStateAction<string | null>>;
  exampleMax: number;
  exampleStep: number;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
  onAddPhase: () => void;
  onPickOtherTemplate: () => void;
  onClearCycle: () => void;
}) {
  return (
    <>
      {showKindSwitch ? (
        <Segmented
          value={kind}
          options={[
            { id: "dynamic", label: WORKOUT_KIND_LABELS.dynamic },
            { id: "static", label: WORKOUT_KIND_LABELS.static },
          ]}
          onChange={setKind}
        />
      ) : null}

      <p className="px-1 text-sm text-muted-foreground">
        Порядок — потяни за номер слева. Нажми на этап, чтобы настроить.
      </p>

      <SortableList
        variant="cards"
        disabled={openKey != null}
        items={formulas.cycle.map((phase) => ({
          ...phase,
          id: phase.key,
        }))}
        onReorder={(next) => {
          setSaved(false);
          setFormulas((current) =>
            current
              ? reorderCycle(
                  current,
                  next.map((phase) => phase.key),
                )
              : current,
          );
        }}
        renderItem={(phase) => (
          <FormulaCyclePhaseRow
            phase={phase}
            kind={kind}
            open={openKey === phase.key}
            onToggle={() =>
              setOpenKey((current) =>
                current === phase.key ? null : phase.key,
              )
            }
            exampleMax={exampleMax}
            exampleStep={exampleStep}
            formulas={formulas}
            setFormulas={setFormulas}
            setSaved={setSaved}
          />
        )}
      />

      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={formulas.cycle.length >= MAX_PHASES}
        onClick={onAddPhase}
      >
        <Plus className="size-4" />
        Этап
      </Button>

      <FormulaCycleAdvanceSettings
        formulas={formulas}
        setFormulas={setFormulas}
        setSaved={setSaved}
      />

      <div className="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-base text-muted-foreground"
          onClick={onPickOtherTemplate}
        >
          Поставить другую схему
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-base text-muted-foreground"
          onClick={onClearCycle}
        >
          Убрать этапы
        </Button>
      </div>
    </>
  );
}
