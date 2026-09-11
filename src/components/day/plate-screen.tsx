"use client";

import { Plus } from "lucide-react";

import { PlateCameraBar } from "@/components/day/plate-camera-bar";
import { type PlateRow, parseGramsInput } from "@/components/day/plate-draft";
import { PlateDraftRow } from "@/components/day/plate-draft-row";
import { PlateFoodPicker } from "@/components/day/plate-food-picker";
import { PlateLiveCamera } from "@/components/day/plate-live-camera";
import { PlateStatusCopy } from "@/components/day/plate-status";
import { usePlateScreen } from "@/components/day/use-plate-screen";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { AI_PLATE_RETRY } from "@/lib/messages";
import {
  calcMacrosFromPer100,
  formatKcal,
  formatMacro,
  sumMealItems,
} from "@/lib/nutrition";

export function PlateScreen({
  mealId,
  doneHref,
  configured,
}: {
  mealId: string;
  doneHref: string;
  configured: boolean;
}) {
  const plate = usePlateScreen({ mealId, doneHref, configured });
  const totals = sumDraft(plate.items);
  const cameraPrimary =
    plate.view.status === "idle" ||
    plate.view.status === "empty" ||
    (plate.view.status === "error" && !plate.canRetryLast);

  return (
    <>
      {plate.workingTitle ? <ScreenLoading title={plate.workingTitle} /> : null}

      {plate.liveCamera ? (
        <PlateLiveCamera
          stream={plate.liveStream}
          onCapture={plate.captureLive}
          onCancel={plate.closeLiveCamera}
        />
      ) : null}

      {plate.picker ? (
        <PlateFoodPicker
          title={
            plate.picker.mode === "replace" ? "Другой продукт" : "Из своей базы"
          }
          onPick={plate.pickFood}
          onClose={() => plate.setPicker(null)}
        />
      ) : null}

      <div className="flex flex-col gap-4 px-4 pb-40">
        {plate.previewUrl ? (
          <div
            role="img"
            aria-label="Фото тарелки"
            className="h-48 w-full rounded-2xl bg-muted bg-cover bg-center"
            style={{ backgroundImage: `url(${plate.previewUrl})` }}
          />
        ) : null}

        <PlateStatusCopy
          idle={plate.view.status === "idle"}
          unavailable={plate.unavailable}
          empty={plate.empty}
        />

        {plate.items.map((item, index) => (
          <PlateDraftRow
            key={item.rowId}
            item={item}
            gramsInput={item.gramsInput}
            proteinInput={item.proteinInput}
            fatInput={item.fatInput}
            carbsInput={item.carbsInput}
            onGramsChange={(value) => plate.setGrams(index, value)}
            onRemove={() => plate.removeItem(index)}
            onChangeFood={() => plate.setPicker({ mode: "replace", index })}
            onPatchNew={
              item.kind === "new"
                ? (patch) => plate.patchNew(index, patch)
                : undefined
            }
          />
        ))}

        {plate.canAddFood ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full gap-2 text-base"
            disabled={plate.busy}
            onClick={() => plate.setPicker({ mode: "add" })}
          >
            <Plus className="size-4" aria-hidden />
            Из своей базы
          </Button>
        ) : null}

        {totals ? (
          <div className="card-surface px-5 py-4 text-lg">
            Итого: Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)}{" "}
            · У {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
          </div>
        ) : null}

        {plate.error ? (
          <p className="text-sm text-destructive">{plate.error}</p>
        ) : null}
      </div>

      {plate.unavailable ? null : (
        <StickyActions>
          {plate.view.status === "draft" || plate.view.status === "saving" ? (
            <Button
              className="h-14 w-full text-lg"
              disabled={plate.busy || plate.items.length === 0}
              onClick={() => void plate.save()}
            >
              {plate.view.status === "saving" ? "Сохранение…" : "В приём"}
            </Button>
          ) : null}

          {plate.canRetryLast ? (
            <Button
              type="button"
              className="h-14 w-full text-lg"
              disabled={plate.busy}
              onClick={plate.retry}
            >
              {AI_PLATE_RETRY}
            </Button>
          ) : null}

          <PlateCameraBar
            busy={plate.busy}
            htmlCamera={plate.htmlCamera}
            cameraPrimary={cameraPrimary}
            status={plate.view.status}
            cameraId={plate.cameraId}
            galleryId={plate.galleryId}
            cameraRef={plate.cameraRef}
            galleryRef={plate.galleryRef}
            onWatchCamera={plate.watchCamera}
            onStartLiveCamera={() => void plate.startLiveCamera()}
            onFile={(file) => void plate.onFile(file)}
          />
        </StickyActions>
      )}
    </>
  );
}

function sumDraft(items: PlateRow[]) {
  const macros = items.flatMap((item) => {
    const grams = parseGramsInput(item.gramsInput);
    if (grams == null) {
      return [];
    }
    return [
      calcMacrosFromPer100(
        {
          protein: item.protein_per_100,
          fat: item.fat_per_100,
          carbs: item.carbs_per_100,
          kcal: item.kcal_per_100,
        },
        grams,
      ),
    ];
  });

  if (macros.length === 0) {
    return null;
  }

  return sumMealItems(macros);
}
