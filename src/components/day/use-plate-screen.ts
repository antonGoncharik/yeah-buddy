"use client";

import { useEffect, useRef, useState } from "react";

import {
  type PlateRow,
  type PlateStatus,
  rememberPreview,
  requestPlateDraft,
  revokePreview,
} from "@/components/day/plate-draft";
import { usePlateCamera } from "@/components/day/use-plate-camera";
import { usePlateDraft } from "@/components/day/use-plate-draft";
import { parseRemaining } from "@/lib/ai/parse-review";
import { compressPlateImage } from "@/lib/ai/read-plate-image";
import { ApiError } from "@/lib/api-cache";
import { AI_PLATE_FAILED, AI_PLATE_PHOTO_FAILED } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";
import { isAbortError } from "@/lib/telegram/html-capture";

export type { PlatePicker, PlateRow } from "@/components/day/plate-draft";

export function usePlateScreen({
  mealId,
  date,
  doneHref,
  configured,
  remaining: remainingStart,
}: {
  mealId: string;
  date: string;
  doneHref: string;
  configured: boolean;
  remaining: number | null;
}) {
  const previewRef = useRef<string | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const [remaining, setRemaining] = useState<number | null>(remainingStart);
  const [view, setView] = useState<PlateStatus>(
    configured ? { status: "idle" } : { status: "unavailable" },
  );

  const draft = usePlateDraft({ view, setView, mealId, date, doneHref });
  const busy = view.status === "working" || view.status === "saving";
  const camera = usePlateCamera({
    busy,
    onFile: (file) => {
      void onFile(file);
    },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      revokePreview(previewRef.current);
    };
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) {
      return;
    }

    camera.closeLiveCamera();
    draft.setSaveError(null);
    const previewUrl = rememberPreview(file, previewRef);
    const request = beginRequest();
    setView({ status: "working", title: "Читаю фото…", previewUrl });

    let blob: Blob;
    try {
      blob = await compressPlateImage(file);
    } catch {
      if (stale(request)) {
        return;
      }
      haptic("error");
      lastBlobRef.current = null;
      setView({
        status: "error",
        message: AI_PLATE_PHOTO_FAILED,
        previewUrl,
      });
      return;
    }

    if (stale(request)) {
      return;
    }

    lastBlobRef.current = blob;
    await analyzeBlob(blob, previewUrl, request);
  }

  async function analyzeBlob(
    blob: Blob,
    previewUrl: string | null,
    request = beginRequest(),
  ) {
    draft.setSaveError(null);
    setView({ status: "working", title: "Смотрю…", previewUrl });

    try {
      const result = await requestPlateDraft(blob, abortRef.current?.signal);
      if (stale(request)) {
        return;
      }
      if (result.remaining != null) {
        setRemaining(result.remaining);
      }
      if (result.items.length === 0) {
        setView({
          status: "empty",
          previewUrl: previewUrl ?? "",
        });
        return;
      }

      haptic("success");
      setView({
        status: "draft",
        previewUrl: previewUrl ?? "",
        items: result.items,
      });
    } catch (caught) {
      if (stale(request) || isAbortError(caught)) {
        return;
      }
      if (caught instanceof ApiError) {
        const next = parseRemaining(
          isRecord(caught.data) ? caught.data.remaining : null,
        );
        if (next != null) {
          setRemaining(next);
        }
      }
      haptic("error");
      setView({
        status: "error",
        message: caught instanceof Error ? caught.message : AI_PLATE_FAILED,
        previewUrl,
      });
    }
  }

  function retry() {
    if (lastBlobRef.current && view.status === "error") {
      haptic("tap");
      void analyzeBlob(lastBlobRef.current, previewRef.current);
      return;
    }
    void camera.startLiveCamera();
  }

  function beginRequest() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    requestRef.current += 1;
    return requestRef.current;
  }

  function stale(request: number) {
    return request !== requestRef.current;
  }

  const previewUrl =
    view.status === "empty" ||
    view.status === "draft" ||
    view.status === "saving" ||
    view.status === "working" ||
    view.status === "error"
      ? view.previewUrl
      : null;
  const items: PlateRow[] =
    view.status === "draft" || view.status === "saving" ? view.items : [];
  const cameraOff = !configured || remaining === 0;
  const exhausted =
    configured &&
    remaining === 0 &&
    view.status !== "draft" &&
    view.status !== "saving";

  return {
    cameraId: camera.cameraId,
    galleryId: camera.galleryId,
    cameraRef: camera.cameraRef,
    galleryRef: camera.galleryRef,
    view,
    busy,
    previewUrl,
    items,
    empty: view.status === "empty",
    error: view.status === "error" ? view.message : draft.saveError,
    unavailable: view.status === "unavailable",
    exhausted,
    remaining,
    cameraOff,
    liveCamera: camera.liveCamera,
    liveStream: camera.liveStream,
    picker: draft.picker,
    canAddFood:
      view.status === "draft" ||
      view.status === "empty" ||
      view.status === "idle" ||
      view.status === "unavailable",
    canRetryLast:
      view.status === "error" && lastBlobRef.current != null && remaining !== 0,
    workingTitle: view.status === "working" ? view.title : null,
    retry,
    onFile,
    setGrams: draft.setGrams,
    setGramsMode: draft.setGramsMode,
    patchLump: draft.patchLump,
    removeItem: draft.removeItem,
    reorderItems: draft.reorderItems,
    save: draft.save,
    closeLiveCamera: camera.closeLiveCamera,
    startLiveCamera: camera.startLiveCamera,
    setPicker: draft.setPicker,
    pickFood: draft.pickFood,
    addLump: draft.addLump,
    toLump: draft.toLump,
    captureLive: camera.captureLive,
  };
}
