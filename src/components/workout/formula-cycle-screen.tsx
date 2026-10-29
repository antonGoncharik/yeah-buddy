"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { FormulaCycleActiveEditor } from "@/components/workout/formula-cycle-active-editor";
import { FormulaCycleTemplateSection } from "@/components/workout/formula-cycle-template-section";
import { useFormulasScreen } from "@/components/workout/use-formulas-screen";
import { addCyclePhase } from "@/lib/workout/cycle";

export function FormulaCycleScreen() {
  const {
    kind,
    setKind,
    showKindSwitch,
    formulas,
    setFormulas,
    exampleMax,
    exampleStep,
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
        title="Недели"
        subtitle="Те же дни, другой вес по кругу"
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
              Недели — те же тренировки, другой вес. Проценты двигают «на раз».
              Лесенка прибавляет килограммы на штанге. Запустить — «Тренировки»
              → «Недели», либо вместе с готовой программой.
            </p>

            {showTemplates ? (
              <FormulaCycleTemplateSection
                hasCycle={hasCycle}
                onApply={(cycle, name, extra) => {
                  void applyCycleTemplate(cycle, name, extra).then(() =>
                    setPicking(false),
                  );
                }}
                onCustom={hasCycle ? undefined : addPhase}
                onDismiss={hasCycle ? () => setPicking(false) : undefined}
              />
            ) : null}

            {hasCycle && !picking ? (
              <FormulaCycleActiveEditor
                formulas={formulas}
                kind={kind}
                showKindSwitch={showKindSwitch}
                setKind={setKind}
                openKey={openKey}
                setOpenKey={setOpenKey}
                exampleMax={exampleMax}
                exampleStep={exampleStep}
                setFormulas={setFormulas}
                setSaved={setSaved}
                onAddPhase={addPhase}
                onPickOtherTemplate={() => setPicking(true)}
                onClearCycle={() => void clearCycle()}
              />
            ) : null}

            {error ? (
              <p className="text-base leading-snug text-destructive">{error}</p>
            ) : null}
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
