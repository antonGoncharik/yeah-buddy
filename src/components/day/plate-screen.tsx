"use client";

import { Camera, Images } from "lucide-react";

import { PlateDraftRow } from "@/components/day/plate-draft-row";
import { usePlateScreen } from "@/components/day/use-plate-screen";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { AI_PLATE_EMPTY } from "@/lib/messages";
import {
  calcMacrosFromPer100,
  formatKcal,
  formatMacro,
  sumMealItems,
} from "@/lib/nutrition";

export function PlateScreen({
  mealId,
  doneHref,
}: {
  mealId: string;
  doneHref: string;
}) {
  const plate = usePlateScreen({ mealId, doneHref });
  const totals = sumDraft(plate.items);

  return (
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
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void plate.onFile(file);
        }}
      />
      <input
        id={plate.galleryId}
        ref={plate.galleryRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void plate.onFile(file);
        }}
      />

      {plate.workingTitle ? <ScreenLoading title={plate.workingTitle} /> : null}

      <div className="flex flex-col gap-4 px-4 pb-28">
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

        {plate.empty ? (
          <p className="text-base text-muted-foreground">{AI_PLATE_EMPTY}</p>
        ) : null}

        {plate.items.map((item, index) => (
          <PlateDraftRow
            key={item.rowId}
            item={item}
            gramsInput={item.gramsInput}
            onGramsChange={(value) => plate.setGrams(index, value)}
            onRemove={() => plate.removeItem(index)}
          />
        ))}

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
        <Button
          type="button"
          variant={
            plate.view.status === "idle" || plate.view.status === "error"
              ? "default"
              : "outline"
          }
          className="h-14 w-full gap-2 text-lg"
          disabled={plate.busy}
          onClick={plate.openCamera}
        >
          <Camera className="size-5" aria-hidden />
          {plate.view.status === "idle" ? "Сфотографировать" : "Другое фото"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full gap-2 text-base"
          disabled={plate.busy}
          onClick={plate.openGallery}
        >
          <Images className="size-5" aria-hidden />
          Из галереи
        </Button>
      </StickyActions>
    </>
  );
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
