"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { watchVideoBarcode } from "@/lib/food/barcode-scan";
import { haptic } from "@/lib/telegram/haptic";
import { openLiveStream } from "@/lib/telegram/platform";

export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (ean: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onDetectedRef.current = onDetected;
    onCloseRef.current = onClose;
  }, [onClose, onDetected]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const abort = new AbortController();
    let stream: MediaStream | null = null;

    void (async () => {
      try {
        haptic("tap");
        stream = await openLiveStream();
        if (abort.signal.aborted) {
          stopMedia(stream);
          return;
        }
        video.srcObject = stream;
        await video.play();
        const ean = await watchVideoBarcode(video, stream, abort.signal);
        if (abort.signal.aborted) {
          return;
        }
        haptic("success");
        onDetectedRef.current(ean);
      } catch {
        if (!abort.signal.aborted) {
          onCloseRef.current();
        }
      }
    })();

    return () => {
      abort.abort();
      video.srcObject = null;
      stopMedia(stream);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative min-h-0 flex-1 bg-black">
        <video
          ref={videoRef}
          className="size-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-28 w-[72%] rounded-xl border-2 border-white/80" />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="absolute top-[max(0.75rem,var(--app-safe-top))] left-3 h-11 text-base text-white hover:bg-white/10 hover:text-white"
          onClick={onClose}
        >
          Отмена
        </Button>
      </div>
      <p className="px-4 pt-3 pb-[max(1.25rem,var(--app-safe-bottom))] text-center text-sm text-white/80">
        Наведи на штрих
      </p>
    </div>,
    document.body,
  );
}

function stopMedia(stream: MediaStream | null) {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
