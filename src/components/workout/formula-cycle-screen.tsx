"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { FormulaCyclePhaseRow } from "@/components/workout/formula-cycle-phase-row";
import { FormulaCycleTemplates } from "@/components/workout/formula-cycle-templates";
import { MAX_PHASES } from "@/components/workout/formula-form";
import { SortableList } from "@/components/workout/sortable-list";
import { useFormulasScreen } from "@/components/workout/use-formulas-screen";
import { addCyclePhase, reorderCycle } from "@/lib/workout/cycle";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function FormulaCycleScreen() {
  const {
    kind,
    setKind,
    showKindSwitch,
    formulas,
    setFormulas,
    exampleMax,
    exampleStep,
    increasePercent,
    loading,
    error,
    saved,
    saving,
    dirty,
    load,
    onSave,
    applyCycleTemplate,
    clearCycle,
    setSaved,
  } = useFormulasScreen();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const hasCycle = (formulas?.cycle.length ?? 0) > 0;
  const showTemplates = !hasCycle || picking;

  function addPhase() {
    if (!formulas) {
      return;
    }
    const next = addCyclePhase(formulas, `Этап ${formulas.cycle.length + 1}`);
    setSaved(false);
    setFormulas(next);
    setOpenKey(next.cycle.at(-1)?.key ?? null);
    setPicking(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Этапы цикла"
        subtitle="Как меняется вес от этапа к этапу"
        backHref="/settings/formulas"
      />

      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !formulas ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && formulas ? (
          <>
            <p className="px-1 text-base leading-relaxed text-muted-foreground">
              Тренировки те же, что в очереди — по этапам меняется только вес.
              Здесь схема; запустить по ней цикл — на вкладке «Тренировки» →
              «Цикл». Без этапов вес всегда считается одинаково.
            </p>

            {showTemplates ? (
              <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
                <h2 className="text-xl font-semibold">
                  {hasCycle ? "Другая схема" : "Выбрать схему"}
                </h2>
                <FormulaCycleTemplates
                  onApply={(cycle, name) => {
                    void applyCycleTemplate(cycle, name).then(() =>
                      setPicking(false),
                    );
                  }}
                  onCustom={hasCycle ? undefined : addPhase}
                />
                {hasCycle ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 text-base"
                    onClick={() => setPicking(false)}
                  >
                    Оставить как есть
                  </Button>
                ) : null}
              </section>
            ) : null}

            {hasCycle && !picking ? (
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
                  Порядок — потяни за номер. Нажми на этап, чтобы настроить.
                </p>

                <SortableList
                  variant="cards"
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
                      increasePercent={increasePercent}
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
                  onClick={addPhase}
                >
                  <Plus className="size-4" />
                  Этап
                </Button>

                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 text-base text-muted-foreground"
                    onClick={() => setPicking(true)}
                  >
                    Поставить другую схему
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 text-base text-muted-foreground"
                    onClick={() => void clearCycle()}
                  >
                    Убрать этапы
                  </Button>
                </div>
              </>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Сохранено.
              </p>
            ) : null}

            <StickyActions>
              <Button
                type="button"
                className="h-14 text-lg"
                disabled={saving || !dirty}
                onClick={() => void onSave()}
              >
                {saving ? "Сохранение…" : dirty ? "Сохранить" : "Сохранено"}
              </Button>
            </StickyActions>
          </>
        ) : null}
      </div>
    </div>
  );
}
