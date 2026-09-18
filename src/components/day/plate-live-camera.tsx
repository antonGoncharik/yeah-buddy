"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { fitPlateCaptureSize } from "@/lib/ai/read-plate-image";
import { AI_PLATE_PHOTO_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import { openLiveStream } from "@/lib/telegram/platform";
import { cn } from "@/lib/utils";

export function PlateLiveCamera({
  stream,
  onCapture,
  onCancel,
}: {
  stream?: MediaStream | null;
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const freezeRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturingRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) {
      return;
    }

    let stopped = false;

    async function start(target: HTMLVideoElement) {
      try {
        const next = stream ?? (await openLiveStream());
        if (stopped) {
          for (const track of next.getTracks()) {
            track.stop();
          }
          return;
        }
        streamRef.current = next;
        target.srcObject = next;
        await target.play();
      } catch {
        if (!stopped) {
          setError(AI_PLATE_PHOTO_FAILED);
        }
      }
    }

    void start(node);

    return () => {
      stopped = true;
      if (flashTimerRef.current != null) {
        window.clearTimeout(flashTimerRef.current);
      }
      node.srcObject = null;
      const current = streamRef.current;
      if (current && current !== stream) {
        for (const track of current.getTracks()) {
          track.stop();
        }
      }
    };
  }, [stream]);

  async function shoot() {
    if (capturingRef.current) {
      return;
    }
    capturingRef.current = true;
    setCapturing(true);
    setError(null);

    const video = videoRef.current;
    const freeze = freezeRef.current;
    if (!video || !freeze || !drawPlateFrame(video, freeze)) {
      capturingRef.current = false;
      setCapturing(false);
      setError(AI_PLATE_PHOTO_FAILED);
      return;
    }

    setFrozen(true);
    haptic("commit");
    setFlash(true);
    if (flashTimerRef.current != null) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      flashTimerRef.current = null;
      setFlash(false);
    }, 140);
    video.pause();

    try {
      const blob = await canvasJpeg(freeze);
      onCapture(new File([blob], "plate.jpg", { type: "image/jpeg" }));
    } catch {
      capturingRef.current = false;
      setCapturing(false);
      setFrozen(false);
      setError(AI_PLATE_PHOTO_FAILED);
      void video.play();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black">
      <div className="relative min-h-0 flex-1 bg-black">
        <video
          ref={videoRef}
          className="size-full object-contain"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={freezeRef}
          className={cn(
            "pointer-events-none absolute inset-0 size-full object-contain",
            frozen ? "opacity-100" : "opacity-0",
          )}
        />
        {flash ? (
          <div className="pointer-events-none absolute inset-0 bg-white" />
        ) : null}
      </div>
      <div className="flex flex-col gap-2 px-4 pt-4 pb-[max(1.25rem,var(--app-safe-bottom))]">
        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        {error ? null : (
          <Button
            type="button"
            className="h-14 w-full text-lg"
            disabled={capturing}
            onClick={() => void shoot()}
          >
            {capturing ? "Снято" : "Снять"}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full text-base text-white hover:bg-white/10 hover:text-white"
          onClick={onCancel}
        >
          Отмена
        </Button>
      </div>
    </div>
  );
}

function drawPlateFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): boolean {
  if (video.videoWidth < 8 || video.videoHeight < 8) {
    return false;
  }

  const size = fitPlateCaptureSize(video.videoWidth, video.videoHeight);
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) {
    return false;
  }
  context.drawImage(video, 0, 0, size.width, size.height);
  return true;
}

function canvasJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size < 32) {
          reject(new Error("encode"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.85,
    );
  });
}
