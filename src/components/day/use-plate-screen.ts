"use client";

import { useEffect, useRef, useState } from "react";

import {
  type PlateRow,
  type PlateStatus,
  toPlateRow,
} from "@/components/day/plate-draft";
import { rememberPreview, revokePreview } from "@/components/day/plate-media";
import { usePlateCamera } from "@/components/day/use-plate-camera";
import { usePlateDraft } from "@/components/day/use-plate-draft";
import { parsePlateDraft } from "@/lib/ai/plate-parse";
import { compressPlateImage } from "@/lib/ai/read-plate-image";
import { ApiError } from "@/lib/api-cache";
import {
  AI_PLATE_FAILED,
  AI_PLATE_PHOTO_FAILED,
  readApiError,
} from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import { isAbortError } from "@/lib/telegram/html-capture";

export type { PlatePicker, PlateRow } from "@/components/day/plate-draft";

export function usePlateScreen({
  mealId,
  doneHref,
  configured,
}: {
  mealId: string;
  doneHref: string;
  configured: boolean;
}) {
  const previewRef = useRef<string | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const [view, setView] = useState<PlateStatus>(
    configured ? { status: "idle" } : { status: "unavailable" },
  );

  const draft = usePlateDraft({ view, setView, mealId, doneHref });
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
      const body = new FormData();
      body.append("image", blob, "plate.jpg");
      const response = await fetch("/api/ai/plate", {
        method: "POST",
        body,
        signal: abortRef.current?.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (stale(request)) {
        return;
      }
      if (!response.ok) {
        throw new ApiError(
          readApiError(data) ?? AI_PLATE_FAILED,
          response.status,
          data,
        );
      }

      const parsed = parsePlateDraft(data);
      if (!parsed) {
        throw new Error(AI_PLATE_FAILED);
      }

      if (parsed.items.length === 0) {
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
        items: parsed.items.map(toPlateRow),
      });
    } catch (caught) {
      if (stale(request) || isAbortError(caught)) {
        return;
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
    if (camera.htmlCamera) {
      void camera.startCamera(true);
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
  const empty = view.status === "empty";
  const error = view.status === "error" ? view.message : draft.saveError;
  const unavailable = view.status === "unavailable";
  const canAddFood = view.status === "draft" || view.status === "empty";
  const canRetryLast = view.status === "error" && lastBlobRef.current != null;

  return {
    cameraId: camera.cameraId,
    galleryId: camera.galleryId,
    cameraRef: camera.cameraRef,
    galleryRef: camera.galleryRef,
    view,
    busy,
    previewUrl,
    items,
    empty,
    error,
    unavailable,
    liveCamera: camera.liveCamera,
    liveStream: camera.liveStream,
    htmlCamera: camera.htmlCamera,
    picker: draft.picker,
    canAddFood,
    canRetryLast,
    workingTitle: view.status === "working" ? view.title : null,
    watchCamera: camera.watchCamera,
    retry,
    onFile,
    setGrams: draft.setGrams,
    patchNew: draft.patchNew,
    removeItem: draft.removeItem,
    save: draft.save,
    closeLiveCamera: camera.closeLiveCamera,
    startLiveCamera: camera.startLiveCamera,
    setPicker: draft.setPicker,
    pickFood: draft.pickFood,
    captureLive: camera.captureLive,
  };
}
