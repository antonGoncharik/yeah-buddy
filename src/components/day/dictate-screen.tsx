"use client";

import { Mic } from "lucide-react";

import { DictateStatusCopy } from "@/components/day/dictate-status";
import { PlateDraftPanel } from "@/components/day/plate-draft-panel";
import { PlateFoodPicker } from "@/components/day/plate-food-picker";
import { useDictateScreen } from "@/components/day/use-dictate-screen";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { DICTATE_CAPTURE_LABEL } from "@/lib/flavor";
import { AI_DICTATE_RETRY } from "@/lib/messages";

export function DictateScreen({
  mealId,
  date,
  doneHref,
  configured,
  remaining,
}: {
  mealId: string;
  date: string;
  doneHref: string;
  configured: boolean;
  remaining: number | null;
}) {
  const dictate = useDictateScreen({
    mealId,
    date,
    doneHref,
    configured,
    remaining,
  });
  const recordPrimary =
    dictate.view.status === "idle" ||
    dictate.view.status === "empty" ||
    (dictate.view.status === "error" && !dictate.canRetryLast);
  const showSave =
    dictate.view.status === "draft" || dictate.view.status === "saving";
  const showRecord = !dictate.inputOff && !dictate.recording;
  const showSticky =
    showSave || showRecord || dictate.recording || dictate.canRetryLast;

  return (
    <>
      {dictate.workingTitle ? (
        <ScreenLoading title={dictate.workingTitle} cover />
      ) : null}

      {dictate.picker ? (
        <PlateFoodPicker
          title={
            dictate.picker.mode === "replace"
              ? "Другой продукт"
              : "Из своей базы"
          }
          onPick={dictate.pickFood}
          onClose={() => dictate.setPicker(null)}
        />
      ) : null}

      <div className="flex flex-col gap-4 px-4 pb-40">
        <DictateStatusCopy
          idle={dictate.view.status === "idle"}
          unavailable={dictate.unavailable}
          exhausted={dictate.exhausted}
          empty={dictate.empty}
          recording={dictate.recording}
          seconds={dictate.seconds}
          remaining={dictate.remaining}
        />

        <PlateDraftPanel
          items={dictate.items}
          busy={dictate.busy || dictate.recording}
          error={dictate.error}
          canAddFood={dictate.canAddFood}
          onReorder={dictate.reorderItems}
          onGrams={dictate.setGrams}
          onGramsMode={dictate.setGramsMode}
          onRemove={dictate.removeItem}
          onChangeFood={(rowId) =>
            dictate.setPicker({ mode: "replace", rowId })
          }
          onToLump={dictate.toLump}
          onPatchLump={dictate.patchLump}
          onAddLump={dictate.addLump}
          onAddFood={() => dictate.setPicker({ mode: "add" })}
        />
      </div>

      {showSticky ? (
        <StickyActions>
          {showSave ? (
            <Button
              className="h-14 w-full text-lg"
              disabled={
                dictate.busy || dictate.recording || dictate.items.length === 0
              }
              onClick={() => void dictate.save()}
            >
              {dictate.view.status === "saving" ? "Сохранение…" : "Добавить"}
            </Button>
          ) : null}

          {dictate.canRetryLast && !dictate.recording ? (
            <Button
              type="button"
              className="h-14 w-full text-lg"
              disabled={dictate.busy}
              onClick={dictate.retry}
            >
              {AI_DICTATE_RETRY}
            </Button>
          ) : null}

          {dictate.recording ? (
            <>
              <Button
                type="button"
                className="h-14 w-full text-lg"
                onClick={dictate.finishRecording}
              >
                Стоп
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full text-base"
                onClick={dictate.cancelRecording}
              >
                Отмена
              </Button>
            </>
          ) : null}

          {showRecord ? (
            <div data-keyboard-secondary>
              <Button
                type="button"
                variant={recordPrimary ? "default" : "outline"}
                className="h-14 w-full gap-2 text-lg"
                disabled={dictate.busy}
                onClick={() => void dictate.beginRecording()}
              >
                <Mic className="size-5" aria-hidden />
                {recordPrimary ? DICTATE_CAPTURE_LABEL : "Другая запись"}
              </Button>
            </div>
          ) : null}
        </StickyActions>
      ) : null}
    </>
  );
}
