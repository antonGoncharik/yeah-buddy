"use client";

import { Camera, Images } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";

export function PlateCameraBar({
  busy,
  cameraPrimary,
  status,
  cameraId,
  galleryId,
  cameraRef,
  galleryRef,
  onStartLiveCamera,
  onFile,
}: {
  busy: boolean;
  cameraPrimary: boolean;
  status: string;
  cameraId: string;
  galleryId: string;
  cameraRef: RefObject<HTMLInputElement | null>;
  galleryRef: RefObject<HTMLInputElement | null>;
  onStartLiveCamera: () => void;
  onFile: (file: File | undefined) => void;
}) {
  return (
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
        variant={cameraPrimary ? "default" : "outline"}
        className="h-14 w-full gap-2 text-lg"
        disabled={busy}
        onClick={() => onStartLiveCamera()}
      >
        <Camera className="size-5" aria-hidden />
        {status === "idle" ? "Сфотографировать" : "Другое фото"}
      </Button>

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
