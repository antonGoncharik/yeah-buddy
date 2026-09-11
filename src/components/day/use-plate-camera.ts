"use client";

import { useEffect, useId, useRef, useState } from "react";

import { guessHtmlCamera, stopMedia } from "@/components/day/plate-media";
import { haptic } from "@/lib/telegram/haptic";
import { watchHtmlCapture } from "@/lib/telegram/html-capture";
import {
  openLiveStream,
  preferLiveCamera,
  telegramPlatform,
} from "@/lib/telegram/platform";

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
  const [liveCamera, setLiveCamera] = useState(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [htmlCamera, setHtmlCamera] = useState(guessHtmlCamera);

  useEffect(() => {
    void telegramPlatform().then((platform) => {
      setHtmlCamera(!preferLiveCamera(platform));
    });
  }, []);

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
    haptic("tap");
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
    }
  }

  async function startLiveCamera() {
    if (busy) {
      return;
    }
    haptic("tap");
    try {
      const stream = await openLiveStream();
      liveStreamRef.current = stream;
      setLiveStream(stream);
      setLiveCamera(true);
    } catch {
      if (htmlCamera) {
        return;
      }
      void startCamera(true);
    }
  }

  function closeLiveCamera() {
    stopMedia(liveStreamRef.current);
    liveStreamRef.current = null;
    setLiveStream(null);
    setLiveCamera(false);
  }

  function watchCamera() {
    void startCamera(false);
  }

  function captureLive(file: File) {
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
    htmlCamera,
    startCamera,
    startLiveCamera,
    closeLiveCamera,
    watchCamera,
    captureLive,
  };
}
