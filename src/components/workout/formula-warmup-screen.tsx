"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { patchWarmup } from "@/components/workout/formula-form";
import { FormulaSetList } from "@/components/workout/formula-set-list";
import { useFormulasScreen } from "@/components/workout/use-formulas-screen";
import type { WarmupPresetId } from "@/lib/types";
import {
  FORMULA_PRESET_LABELS,
  WARMUP_PRESET_IDS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

const PRESET_HINTS: Record<WarmupPresetId, string> = {
  barbell: "Штанга, гантели, вес на тренажёре",
  cable: "Блок и резина — разминка короче",
};

export function FormulaWarmupScreen() {
  const {
    kind,
    setKind,
    showKindSwitch,
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
    setSaved,
  } = useFormulasScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Разминка"
        subtitle="Подходы перед рабочими"
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
              Какая разминка — зависит от упражнения: в каждом выбрано «штанга»
              или «блок». Проценты от 1ПМ.
              {kind === "static"
                ? " На время разминка обычно в повторах, а рабочие — в секундах."
                : ""}
            </p>

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

            {WARMUP_PRESET_IDS.map((preset) => (
              <section
                key={preset}
                className="card-surface animate-rise flex flex-col gap-2 px-5 py-4"
              >
                <div>
                  <h2 className="text-xl font-semibold">
                    {FORMULA_PRESET_LABELS[preset]}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {PRESET_HINTS[preset]}
                  </p>
                </div>
                <FormulaSetList
                  sets={formulas.warmups[kind][preset]}
                  exampleMax={exampleMax}
                  exampleStep={exampleStep}
                  defaultHold={false}
                  allowEmpty
                  emptyLabel="Без разминки"
                  previewMax={previewMax[kind]}
                  onPreviewMaxChange={(value) =>
                    setPreviewMax((current) => ({ ...current, [kind]: value }))
                  }
                  onChange={(sets) => {
                    setSaved(false);
                    setFormulas((current) =>
                      current
                        ? patchWarmup(current, kind, preset, sets)
                        : current,
                    );
                  }}
                />
              </section>
            ))}

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
