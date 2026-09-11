"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { FormulaAdvancedEditor } from "@/components/workout/formula-advanced-editor";
import { FormulaIncreaseField } from "@/components/workout/formula-increase-field";
import { useFormulasScreen } from "@/components/workout/use-formulas-screen";
import { FORMULA_SYSTEMS } from "@/lib/workout/default-formulas";
import { FORMULAS_LABEL } from "@/lib/workout/labels";

export function FormulasScreen() {
  const {
    kind,
    setKind,
    maxIncrease,
    setMaxIncrease,
    formulas,
    setFormulas,
    cycleOpen,
    setCycleOpen,
    previewMax,
    setPreviewMax,
    setPreviewStep,
    loading,
    error,
    saved,
    saving,
    advanced,
    setAdvanced,
    load,
    onSave,
    restoreDefaults,
    applySystem,
    applyCycleTemplate,
    clearCycle,
    exampleMax,
    exampleStep,
    increasePercent,
    showsIncrease,
    raisedExample,
    setSaved,
  } = useFormulasScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={FORMULAS_LABEL}
        subtitle="От твоего веса"
        backHref="/workouts"
      />

      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !formulas ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && formulas ? (
          <>
            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <h2 className="text-xl font-semibold">Как считать</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Твой вес × процент, вниз до шага блинов. Без цикла — как в
                рабочих. С этапом — как в нём.
              </p>
            </section>

            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <h2 className="text-xl font-semibold">Поставить</h2>
              <div className="flex flex-col gap-2">
                {FORMULA_SYSTEMS.map((system) => (
                  <button
                    key={system.id}
                    type="button"
                    className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    onClick={() => void applySystem(system.id)}
                  >
                    <p className="text-base font-medium">{system.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {system.hint}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {showsIncrease ? (
              <FormulaIncreaseField
                maxIncrease={maxIncrease}
                onChange={(value) => {
                  setMaxIncrease(value);
                  setSaved(false);
                }}
              />
            ) : null}

            {advanced ? (
              <FormulaAdvancedEditor
                formulas={formulas}
                kind={kind}
                exampleMax={exampleMax}
                exampleStep={exampleStep}
                increasePercent={increasePercent}
                cycleOpen={cycleOpen}
                previewMax={previewMax}
                raisedExample={raisedExample}
                showsIncrease={showsIncrease}
                setKind={setKind}
                setPreviewMax={setPreviewMax}
                setPreviewStep={setPreviewStep}
                setCycleOpen={setCycleOpen}
                setFormulas={setFormulas}
                setSaved={setSaved}
                applyCycleTemplate={applyCycleTemplate}
                clearCycle={clearCycle}
              />
            ) : (
              <button
                type="button"
                className="px-1 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setAdvanced(true)}
              >
                Настроить самому
              </button>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Сохранено. Следующая тренировка — по этой схеме.
              </p>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              className="h-12 text-base"
              disabled={saving}
              onClick={() => void restoreDefaults()}
            >
              Вернуть 3×5
            </Button>
            <StickyActions>
              <Button
                type="button"
                className="h-14 text-lg"
                disabled={saving}
                onClick={() => void onSave()}
              >
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
            </StickyActions>
          </>
        ) : null}
      </div>
    </div>
  );
}
