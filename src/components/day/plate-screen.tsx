"use client";

import { PlateCameraBar } from "@/components/day/plate-camera-bar";
import { PlateDraftPanel } from "@/components/day/plate-draft-panel";
import { PlateFoodPicker } from "@/components/day/plate-food-picker";
import { PlateLiveCamera } from "@/components/day/plate-live-camera";
import { PlateStatusCopy } from "@/components/day/plate-status";
import { usePlateScreen } from "@/components/day/use-plate-screen";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { AI_PLATE_RETRY } from "@/lib/messages";

export function PlateScreen({
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
  const plate = usePlateScreen({
    mealId,
    date,
    doneHref,
    configured,
    remaining,
  });
  const cameraPrimary =
    plate.view.status === "idle" ||
    plate.view.status === "empty" ||
    (plate.view.status === "error" && !plate.canRetryLast);
  const showSave =
    plate.view.status === "draft" || plate.view.status === "saving";
  const showSticky = showSave || plate.canRetryLast || !plate.cameraOff;

  return (
    <>
      {plate.workingTitle ? (
        <ScreenLoading title={plate.workingTitle} cover />
      ) : null}

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
          // biome-ignore lint/performance/noImgElement: local object URL, not a remote asset
          <img
            src={plate.previewUrl}
            alt="Фото тарелки"
            className="max-h-80 w-full rounded-2xl bg-muted object-contain"
          />
        ) : null}

        <PlateStatusCopy
          idle={plate.view.status === "idle"}
          unavailable={plate.unavailable}
          exhausted={plate.exhausted}
          empty={plate.empty}
          remaining={plate.remaining}
        />

        <PlateDraftPanel
          items={plate.items}
          busy={plate.busy}
          error={plate.error}
          canAddFood={plate.canAddFood}
          onReorder={plate.reorderItems}
          onGrams={plate.setGrams}
          onGramsMode={plate.setGramsMode}
          onRemove={plate.removeItem}
          onChangeFood={(rowId) => plate.setPicker({ mode: "replace", rowId })}
          onToLump={plate.toLump}
          onPatchLump={plate.patchLump}
          onAddLump={plate.addLump}
          onAddFood={() => plate.setPicker({ mode: "add" })}
        />
      </div>

      {showSticky ? (
        <StickyActions>
          {showSave ? (
            <Button
              className="h-14 w-full text-lg"
              disabled={plate.busy || plate.items.length === 0}
              onClick={() => void plate.save()}
            >
              {plate.view.status === "saving" ? "Сохранение…" : "Сохранить всё"}
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

          {plate.cameraOff ? null : (
            <div data-keyboard-secondary>
              <PlateCameraBar
                busy={plate.busy}
                cameraPrimary={cameraPrimary}
                status={plate.view.status}
                cameraId={plate.cameraId}
                galleryId={plate.galleryId}
                cameraRef={plate.cameraRef}
                galleryRef={plate.galleryRef}
                onStartLiveCamera={() => void plate.startLiveCamera()}
                onFile={(file) => void plate.onFile(file)}
              />
            </div>
          )}
        </StickyActions>
      ) : null}
    </>
  );
}
