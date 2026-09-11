"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { AI_PLATE_PHOTO_FAILED } from "@/lib/messages";
import { openLiveStream } from "@/lib/telegram/platform";

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
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    const video = videoRef.current;
    if (!video || video.videoWidth < 8 || video.videoHeight < 8) {
      setError(AI_PLATE_PHOTO_FAILED);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError(AI_PLATE_PHOTO_FAILED);
      return;
    }
    context.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.72);
    });
    if (!blob || blob.size < 32) {
      setError(AI_PLATE_PHOTO_FAILED);
      return;
    }

    onCapture(new File([blob], "plate.jpg", { type: "image/jpeg" }));
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black">
      <video
        ref={videoRef}
        className="min-h-0 flex-1 bg-black object-cover"
        playsInline
        muted
        autoPlay
      />
      <div className="flex flex-col gap-2 px-4 pt-4 pb-[max(1.25rem,var(--app-safe-bottom))]">
        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        {error ? null : (
          <Button
            type="button"
            className="h-14 w-full text-lg"
            onClick={() => void shoot()}
          >
            Снять
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
