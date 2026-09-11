"use client";

import { Camera, Images, Plus } from "lucide-react";

import { PlateDraftRow } from "@/components/day/plate-draft-row";
import { PlateFoodPicker } from "@/components/day/plate-food-picker";
import { PlateLiveCamera } from "@/components/day/plate-live-camera";
import { usePlateScreen } from "@/components/day/use-plate-screen";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import {
  AI_PLATE_EMPTY,
  AI_PLATE_RETRY,
  AI_REVIEW_NO_KEY,
} from "@/lib/messages";
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

        {plate.view.status === "idle" ? (
          <p className="text-base text-muted-foreground">
            Сфотографируй тарелку. Потом проверишь граммы. В дневник попадёт
            только то, что подтвердишь.
          </p>
        ) : null}

        {plate.unavailable ? (
          <p className="text-base text-muted-foreground">{AI_REVIEW_NO_KEY}</p>
        ) : null}

        {plate.empty ? (
          <p className="text-base text-muted-foreground">{AI_PLATE_EMPTY}</p>
        ) : null}

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

          {plate.htmlCamera ? (
            <div className="relative">
              <Button
                type="button"
                variant={
                  plate.view.status === "idle" ||
                  plate.view.status === "empty" ||
                  plate.view.status === "error"
                    ? "default"
                    : "outline"
                }
                className="pointer-events-none h-14 w-full gap-2 text-lg"
                disabled={plate.busy}
                tabIndex={-1}
                aria-hidden
              >
                <Camera className="size-5" aria-hidden />
                {cameraLabel(plate.view.status, cameraPrimary)}
              </Button>
              <input
                id={plate.cameraId}
                ref={plate.cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                disabled={plate.busy}
                aria-label={cameraLabel(plate.view.status, cameraPrimary)}
                className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:pointer-events-none"
                onPointerDown={() => plate.watchCamera()}
              />
            </div>
          ) : (
            <>
              <input
                id={plate.cameraId}
                ref={plate.cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                tabIndex={-1}
                aria-hidden
                className="sr-only"
              />
              <Button
                type="button"
                variant={
                  plate.view.status === "idle" ||
                  plate.view.status === "empty" ||
                  plate.view.status === "error"
                    ? "default"
                    : "outline"
                }
                className="h-14 w-full gap-2 text-lg"
                disabled={plate.busy}
                onClick={() => void plate.startLiveCamera()}
              >
                <Camera className="size-5" aria-hidden />
                {cameraLabel(plate.view.status, cameraPrimary)}
              </Button>
            </>
          )}

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              className="pointer-events-none h-12 w-full gap-2 text-base"
              disabled={plate.busy}
              tabIndex={-1}
              aria-hidden
            >
              <Images className="size-5" aria-hidden />
              Из галереи
            </Button>
            <input
              id={plate.galleryId}
              ref={plate.galleryRef}
              type="file"
              accept="image/*"
              disabled={plate.busy}
              aria-label="Из галереи"
              className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:pointer-events-none"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void plate.onFile(file);
              }}
            />
          </div>
        </StickyActions>
      )}
    </>
  );
}

function cameraLabel(status: string, cameraPrimary: boolean): string {
  if (status === "idle") {
    return "Сфотографировать";
  }
  if (cameraPrimary) {
    return AI_PLATE_RETRY;
  }
  return "Другое фото";
}

function sumDraft(
  items: Array<{
    gramsInput: string;
    protein_per_100: number;
    fat_per_100: number;
    carbs_per_100: number;
    kcal_per_100: number;
  }>,
) {
  const macros = items.flatMap((item) => {
    const grams = Number(item.gramsInput.replace(",", "."));
    if (!Number.isFinite(grams) || grams <= 0) {
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
