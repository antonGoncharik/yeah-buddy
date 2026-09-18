"use client";

import { useEffect, useId, useRef, useState } from "react";

import { haptic } from "@/lib/telegram/haptic";
import { watchHtmlCapture } from "@/lib/telegram/html-capture";
import { openLiveStream } from "@/lib/telegram/platform";

export function usePlateCamera({
  busy,
  onFile,
}: {
  busy: boolean;
  onFile: (file: File) => void;
}) {
  const cameraId = useId();
  const galleryId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const watchRef = useRef(0);
  const htmlFallbackRef = useRef(false);
  const shotRef = useRef(false);
  const [liveCamera, setLiveCamera] = useState(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    liveStreamRef.current = liveStream;
  }, [liveStream]);

  useEffect(() => {
    return () => {
      stopMedia(liveStreamRef.current);
    };
  }, []);

  async function startCamera(clickInput: boolean) {
    const input = cameraRef.current;
    if (!input || busy) {
      return;
    }
    const watch = ++watchRef.current;
    const pending = watchHtmlCapture(input);
    if (clickInput) {
      input.click();
    }
    const result = await pending;
    if (watch !== watchRef.current) {
      return;
    }
    if (result instanceof File) {
      onFile(result);
      return;
    }
    if (result === "live" && !htmlFallbackRef.current) {
      void startLiveCamera();
    }
  }

  async function startLiveCamera() {
    if (busy) {
      return;
    }
    haptic("tap");
    htmlFallbackRef.current = false;
    shotRef.current = false;
    try {
      const stream = await openLiveStream();
      liveStreamRef.current = stream;
      setLiveStream(stream);
      setLiveCamera(true);
    } catch {
      htmlFallbackRef.current = true;
      void startCamera(true);
    }
  }

  function closeLiveCamera() {
    stopMedia(liveStreamRef.current);
    liveStreamRef.current = null;
    setLiveStream(null);
    setLiveCamera(false);
  }

  function captureLive(file: File) {
    if (shotRef.current) {
      return;
    }
    shotRef.current = true;
    closeLiveCamera();
    onFile(file);
  }

  return {
    cameraId,
    galleryId,
    cameraRef,
    galleryRef,
    liveCamera,
    liveStream,
    startLiveCamera,
    closeLiveCamera,
    captureLive,
  };
}

function stopMedia(stream: MediaStream | null) {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
