"use client";

import { useEffect, useRef, useState } from "react";

import { requestDictateDraft } from "@/components/day/dictate-draft";
import type { PlateRow, PlateStatus } from "@/components/day/plate-draft";
import { usePlateDraft } from "@/components/day/use-plate-draft";
import { useSpeechRecorder } from "@/components/day/use-speech-recorder";
import { parseRemaining } from "@/lib/ai/parse-review";
import { DICTATE_AUDIO_MAX_BYTES, speechBlobToWav } from "@/lib/ai/speech-wav";
import { ApiError } from "@/lib/api-cache";
import {
  AI_DICTATE_AUDIO_FAILED,
  AI_DICTATE_FAILED,
  AI_DICTATE_HEAVY,
  AI_DICTATE_MIC,
  AI_DICTATE_SILENT,
} from "@/lib/messages";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";
import { isAbortError } from "@/lib/telegram/html-capture";

export function useDictateScreen({
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
  const lastBlobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const [remaining, setRemaining] = useState<number | null>(remainingStart);
  const [view, setView] = useState<PlateStatus>(
    configured ? { status: "idle" } : { status: "unavailable" },
  );
  const draft = usePlateDraft({ view, setView, mealId, date, doneHref });
  const recorder = useSpeechRecorder();
  const busy = view.status === "working" || view.status === "saving";

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function onBlob(blob: Blob) {
    draft.setSaveError(null);
    const request = beginRequest();
    setView({ status: "working", title: "Слушаю…", previewUrl: null });

    const converted = await speechBlobToWav(blob);
    if (stale(request)) {
      return;
    }
    if (!converted.ok) {
      haptic("error");
      setView({
        status: "error",
        message:
          converted.reason === "silent"
            ? AI_DICTATE_SILENT
            : AI_DICTATE_AUDIO_FAILED,
        previewUrl: null,
      });
      return;
    }
    if (converted.wav.size > DICTATE_AUDIO_MAX_BYTES) {
      haptic("error");
      setView({
        status: "error",
        message: AI_DICTATE_HEAVY,
        previewUrl: null,
      });
      return;
    }

    lastBlobRef.current = converted.wav;
    await analyzeBlob(converted.wav, request);
  }

  async function analyzeBlob(blob: Blob, request = beginRequest()) {
    draft.setSaveError(null);
    setView({ status: "working", title: "Слушаю…", previewUrl: null });

    try {
      const result = await requestDictateDraft(blob, abortRef.current?.signal);
      if (stale(request)) {
        return;
      }
      if (result.remaining != null) {
        setRemaining(result.remaining);
      }
      if (result.items.length === 0) {
        setView({ status: "empty", previewUrl: "" });
        return;
      }

      haptic("success");
      setView({
        status: "draft",
        previewUrl: "",
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
        message: caught instanceof Error ? caught.message : AI_DICTATE_FAILED,
        previewUrl: null,
      });
    }
  }

  async function beginRecording() {
    if (busy || recorder.recording) {
      return;
    }
    haptic("tap");
    draft.setSaveError(null);
    const ok = await recorder.start((blob) => {
      void onBlob(blob);
    });
    if (ok) {
      return;
    }
    haptic("error");
    if (view.status === "draft") {
      draft.setSaveError(AI_DICTATE_MIC);
      return;
    }
    setView({
      status: "error",
      message: AI_DICTATE_MIC,
      previewUrl: null,
    });
  }

  function retry() {
    if (!lastBlobRef.current || view.status !== "error") {
      return;
    }
    haptic("tap");
    void analyzeBlob(lastBlobRef.current);
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

  const items: PlateRow[] =
    view.status === "draft" || view.status === "saving" ? view.items : [];
  const inputOff = !configured || remaining === 0;
  const exhausted =
    configured &&
    remaining === 0 &&
    view.status !== "draft" &&
    view.status !== "saving";

  return {
    view,
    busy,
    items,
    empty: view.status === "empty",
    error: view.status === "error" ? view.message : draft.saveError,
    unavailable: view.status === "unavailable",
    exhausted,
    remaining,
    inputOff,
    recording: recorder.recording,
    seconds: recorder.seconds,
    picker: draft.picker,
    canAddFood: view.status === "empty",
    canRetryLast:
      view.status === "error" && lastBlobRef.current != null && remaining !== 0,
    workingTitle: view.status === "working" ? view.title : null,
    retry,
    beginRecording,
    finishRecording: recorder.finish,
    cancelRecording: recorder.cancel,
    setGrams: draft.setGrams,
    setGramsMode: draft.setGramsMode,
    patchLump: draft.patchLump,
    removeItem: draft.removeItem,
    reorderItems: draft.reorderItems,
    save: draft.save,
    setPicker: draft.setPicker,
    pickFood: draft.pickFood,
    addLump: draft.addLump,
    toLump: draft.toLump,
  };
}
