"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cycleHint, warmupsHint } from "@/components/workout/formula-form";
import { FormulaIncreaseField } from "@/components/workout/formula-increase-field";
import { FormulaWorkCard } from "@/components/workout/formula-work-card";
import { FormulasNavRow } from "@/components/workout/formulas-nav-row";
import { useFormulasScreen } from "@/components/workout/use-formulas-screen";
import { FORMULAS_LABEL, WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function FormulasScreen() {
  const {
    kind,
    setKind,
    showKindSwitch,
    maxIncrease,
    setMaxIncrease,
    formulas,
    setFormulas,
    previewMax,
    setPreviewMax,
    exampleMax,
    exampleStep,
    loading,
    error,
    saved,
    saving,
    dirty,
    load,
    onSave,
    restoreDefaults,
    applySystem,
    setSaved,
  } = useFormulasScreen();

  const hasCycle = (formulas?.cycle.length ?? 0) > 0;
  const cycleRaises = Boolean(
    formulas?.cycle.some((phase) => phase.increase_on_end),
  );
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={FORMULAS_LABEL}
        subtitle="Если в дне нет своих"
        backHref="/workouts/schedule"
      />

      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !formulas ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && formulas ? (
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

            <FormulaWorkCard
              formulas={formulas}
              kind={kind}
              exampleMax={exampleMax}
              exampleStep={exampleStep}
              previewMax={previewMax[kind]}
              setPreviewMax={(value) =>
                setPreviewMax((current) => ({ ...current, [kind]: value }))
              }
              setFormulas={setFormulas}
              setSaved={setSaved}
              applySystem={applySystem}
            />

            {hasCycle ? (
              <FormulasNavRow
                href="/settings/formulas/cycle"
                title="Недели"
                hint={cycleHint(formulas)}
                dirty={dirty}
                busy={saving}
                onSave={onSave}
              />
            ) : null}

            {showMore ? (
              <>
                <FormulasNavRow
                  href="/settings/formulas/warmup"
                  title="Разминка"
                  hint={warmupsHint(formulas, kind)}
                  dirty={dirty}
                  busy={saving}
                  onSave={onSave}
                />
                {hasCycle ? null : (
                  <FormulasNavRow
                    href="/settings/formulas/cycle"
                    title="Недели"
                    hint={cycleHint(formulas)}
                    dirty={dirty}
                    busy={saving}
                    onSave={onSave}
                  />
                )}
                <FormulaIncreaseField
                  maxIncrease={maxIncrease}
                  cycleRaises={cycleRaises}
                  onChange={(value) => {
                    setMaxIncrease(value);
                    setSaved(false);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 text-base text-muted-foreground"
                  disabled={saving}
                  onClick={() => void restoreDefaults()}
                >
                  Вернуть как было в начале
                </Button>
              </>
            ) : (
              <button
                type="button"
                className="px-1 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowMore(true)}
              >
                Ещё: {hasCycle ? "разминка" : "разминка и недели"}
              </button>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Сохранено. Следующая тренировка посчитается по-новому.
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
