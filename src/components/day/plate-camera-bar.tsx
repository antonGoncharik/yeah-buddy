"use client";

import { Camera, Images } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { AI_PLATE_RETRY } from "@/lib/messages";

export function PlateCameraBar({
  busy,
  htmlCamera,
  cameraPrimary,
  status,
  cameraId,
  galleryId,
  cameraRef,
  galleryRef,
  onWatchCamera,
  onStartLiveCamera,
  onFile,
}: {
  busy: boolean;
  htmlCamera: boolean;
  cameraPrimary: boolean;
  status: string;
  cameraId: string;
  galleryId: string;
  cameraRef: RefObject<HTMLInputElement | null>;
  galleryRef: RefObject<HTMLInputElement | null>;
  onWatchCamera: () => void;
  onStartLiveCamera: () => void;
  onFile: (file: File | undefined) => void;
}) {
  const cameraVariant =
    status === "idle" || status === "empty" || status === "error"
      ? "default"
      : "outline";

  return (
    <>
      {htmlCamera ? (
        <div className="relative">
          <Button
            type="button"
            variant={cameraVariant}
            className="pointer-events-none h-14 w-full gap-2 text-lg"
            disabled={busy}
            tabIndex={-1}
            aria-hidden
          >
            <Camera className="size-5" aria-hidden />
            {cameraLabel(status, cameraPrimary)}
          </Button>
          <input
            id={cameraId}
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={busy}
            aria-label={cameraLabel(status, cameraPrimary)}
            className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:pointer-events-none"
            onPointerDown={() => onWatchCamera()}
          />
        </div>
      ) : (
        <>
          <input
            id={cameraId}
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            tabIndex={-1}
            aria-hidden
            className="sr-only"
          />
          <Button
            type="button"
            variant={cameraVariant}
            className="h-14 w-full gap-2 text-lg"
            disabled={busy}
            onClick={() => onStartLiveCamera()}
          >
            <Camera className="size-5" aria-hidden />
            {cameraLabel(status, cameraPrimary)}
          </Button>
        </>
      )}

      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          className="pointer-events-none h-12 w-full gap-2 text-base"
          disabled={busy}
          tabIndex={-1}
          aria-hidden
        >
          <Images className="size-5" aria-hidden />
          Из галереи
        </Button>
        <input
          id={galleryId}
          ref={galleryRef}
          type="file"
          accept="image/*"
          disabled={busy}
          aria-label="Из галереи"
          className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:pointer-events-none"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            onFile(file);
          }}
        />
      </div>
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
