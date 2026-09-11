"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { parseNonneg } from "@/components/foods/food-form-state";
import { parsePlateDraft } from "@/lib/ai/plate-parse";
import { PLATE_GRAMS_MAX, type PlateDraftItem } from "@/lib/ai/plate-types";
import { compressPlateImage } from "@/lib/ai/read-plate-image";
import { ApiError, postJson } from "@/lib/api-cache";
import {
  AI_PLATE_FAILED,
  AI_PLATE_PHOTO_FAILED,
  CHECK_FIELDS,
  LOAD_FAILED,
  readApiError,
} from "@/lib/messages";
import { calcKcalFromMacros } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import { isAbortError, watchHtmlCapture } from "@/lib/telegram/html-capture";
import {
  openLiveStream,
  preferLiveCamera,
  telegramPlatform,
} from "@/lib/telegram/platform";
import type { Food, FoodState } from "@/lib/types";

export type PlateRow = PlateDraftItem & {
  rowId: string;
  gramsInput: string;
  proteinInput: string;
  fatInput: string;
  carbsInput: string;
};

export type PlatePicker =
  | { mode: "add" }
  | { mode: "replace"; index: number }
  | null;

type PlateStatus =
  | { status: "idle" }
  | { status: "unavailable" }
  | { status: "working"; title: string; previewUrl: string | null }
  | { status: "error"; message: string; previewUrl: string | null }
  | { status: "empty"; previewUrl: string }
  | { status: "draft"; previewUrl: string; items: PlateRow[] }
  | { status: "saving"; previewUrl: string; items: PlateRow[] };

export function usePlateScreen({
  mealId,
  doneHref,
  configured,
}: {
  mealId: string;
  doneHref: string;
  configured: boolean;
}) {
  const router = useRouter();
  const cameraId = useId();
  const galleryId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const watchRef = useRef(0);
  const [view, setView] = useState<PlateStatus>(
    configured ? { status: "idle" } : { status: "unavailable" },
  );
  const liveStreamRef = useRef<MediaStream | null>(null);
  const [liveCamera, setLiveCamera] = useState(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [htmlCamera, setHtmlCamera] = useState(guessHtmlCamera);
  const [picker, setPicker] = useState<PlatePicker>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      abortRef.current?.abort();
      revokePreview(previewRef.current);
      stopMedia(liveStreamRef.current);
    };
  }, []);

  async function startCamera(clickInput: boolean) {
    const input = cameraRef.current;
    if (!input || view.status === "working" || view.status === "saving") {
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
      void onFile(result);
      return;
    }
    if (result === "live") {
      return;
    }
  }

  async function startLiveCamera() {
    if (view.status === "working" || view.status === "saving") {
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

  function openGallery() {
    haptic("tap");
    galleryRef.current?.click();
  }

  function retry() {
    if (lastBlobRef.current && view.status === "error") {
      haptic("tap");
      void analyzeBlob(lastBlobRef.current, previewRef.current);
      return;
    }
    if (htmlCamera) {
      void startCamera(true);
      return;
    }
    void startLiveCamera();
  }

  async function onFile(file: File | undefined) {
    if (!file) {
      return;
    }

    closeLiveCamera();
    setSaveError(null);
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
    setSaveError(null);
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

      const draft = parsePlateDraft(data);
      if (!draft) {
        throw new Error(AI_PLATE_FAILED);
      }

      if (draft.items.length === 0) {
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
        items: draft.items.map(toRow),
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

  function setGrams(index: number, gramsInput: string) {
    patchDraftItem(index, (item) => ({ ...item, gramsInput }));
  }

  function patchNew(
    index: number,
    patch: {
      name?: string;
      state?: FoodState;
      proteinInput?: string;
      fatInput?: string;
      carbsInput?: string;
    },
  ) {
    patchDraftItem(index, (item) => {
      if (item.kind !== "new") {
        return item;
      }
      const proteinInput = patch.proteinInput ?? item.proteinInput;
      const fatInput = patch.fatInput ?? item.fatInput;
      const carbsInput = patch.carbsInput ?? item.carbsInput;
      const protein = parseNonneg(proteinInput) ?? item.protein_per_100;
      const fat = parseNonneg(fatInput) ?? item.fat_per_100;
      const carbs = parseNonneg(carbsInput) ?? item.carbs_per_100;
      return {
        ...item,
        name: patch.name ?? item.name,
        state: patch.state ?? item.state,
        proteinInput,
        fatInput,
        carbsInput,
        protein_per_100: protein,
        fat_per_100: fat,
        carbs_per_100: carbs,
        kcal_per_100: calcKcalFromMacros(protein, fat, carbs),
      };
    });
  }

  function removeItem(index: number) {
    haptic("tick");
    setView((current) => {
      if (current.status !== "draft") {
        return current;
      }
      const items = current.items.filter((_, itemIndex) => itemIndex !== index);
      if (items.length === 0) {
        return { status: "empty", previewUrl: current.previewUrl };
      }
      return { ...current, items };
    });
  }

  function pickFood(food: Food) {
    haptic("tick");
    setPicker(null);
    setView((current) => {
      if (current.status !== "draft" && current.status !== "empty") {
        return current;
      }
      const previewUrl =
        current.status === "empty" || current.status === "draft"
          ? current.previewUrl
          : "";
      const grams =
        food.default_portion_g && food.default_portion_g > 0
          ? food.default_portion_g
          : 100;
      const next = foodToRow(food, grams);

      if (current.status === "empty") {
        return { status: "draft", previewUrl, items: [next] };
      }

      if (picker?.mode === "replace") {
        const items = current.items.map((item, index) =>
          index === picker.index
            ? { ...next, gramsInput: item.gramsInput, rowId: item.rowId }
            : item,
        );
        return { ...current, items: mergeFoodRows(items) };
      }

      return { ...current, items: mergeFoodRows([...current.items, next]) };
    });
  }

  async function save() {
    if (view.status !== "draft") {
      return;
    }

    const items: PlateDraftItem[] = [];
    for (const item of view.items) {
      const grams = Number(item.gramsInput.replace(",", "."));
      if (!Number.isFinite(grams) || grams <= 0) {
        haptic("warn");
        setSaveError("Нужны граммы больше 0.");
        return;
      }
      if (item.kind === "new") {
        const protein = parseNonneg(item.proteinInput);
        const fat = parseNonneg(item.fatInput);
        const carbs = parseNonneg(item.carbsInput);
        if (
          item.name.trim() === "" ||
          protein == null ||
          fat == null ||
          carbs == null
        ) {
          haptic("warn");
          setSaveError(CHECK_FIELDS);
          return;
        }
        items.push({
          ...item,
          name: item.name.trim(),
          grams: Math.min(grams, PLATE_GRAMS_MAX),
          protein_per_100: protein,
          fat_per_100: fat,
          carbs_per_100: carbs,
          kcal_per_100: calcKcalFromMacros(protein, fat, carbs),
        });
        continue;
      }
      items.push({ ...item, grams: Math.min(grams, PLATE_GRAMS_MAX) });
    }

    setSaveError(null);
    setView({
      status: "saving",
      previewUrl: view.previewUrl,
      items: view.items,
    });

    try {
      await postJson(`/api/meals/${mealId}/plate`, {
        items: items.map(toCommitItem),
      });
      haptic("success");
      router.push(doneHref);
      router.refresh();
    } catch (caught) {
      haptic("error");
      setView({
        status: "draft",
        previewUrl: view.previewUrl,
        items: view.items,
      });
      setSaveError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  const busy = view.status === "working" || view.status === "saving";
  const previewUrl =
    view.status === "empty" ||
    view.status === "draft" ||
    view.status === "saving" ||
    view.status === "working" ||
    view.status === "error"
      ? view.previewUrl
      : null;
  const items =
    view.status === "draft" || view.status === "saving" ? view.items : [];
  const empty = view.status === "empty";
  const error = view.status === "error" ? view.message : saveError;
  const unavailable = view.status === "unavailable";
  const canAddFood = view.status === "draft" || view.status === "empty";
  const canRetryLast = view.status === "error" && lastBlobRef.current != null;

  function patchDraftItem(index: number, update: (item: PlateRow) => PlateRow) {
    setView((current) => {
      if (current.status !== "draft") {
        return current;
      }
      return {
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? update(item) : item,
        ),
      };
    });
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

  return {
    cameraId,
    galleryId,
    cameraRef,
    galleryRef,
    view,
    busy,
    previewUrl,
    items,
    empty,
    error,
    unavailable,
    liveCamera,
    liveStream,
    htmlCamera,
    picker,
    canAddFood,
    canRetryLast,
    workingTitle: view.status === "working" ? view.title : null,
    watchCamera,
    openGallery,
    retry,
    onFile,
    setGrams,
    patchNew,
    removeItem,
    save,
    setLiveCamera,
    closeLiveCamera,
    startLiveCamera,
    setPicker,
    pickFood,
    captureLive: (file: File) => {
      closeLiveCamera();
      void onFile(file);
    },
  };
}

function toRow(item: PlateDraftItem): PlateRow {
  return {
    ...item,
    rowId: crypto.randomUUID(),
    gramsInput: String(item.grams),
    proteinInput: String(item.protein_per_100),
    fatInput: String(item.fat_per_100),
    carbsInput: String(item.carbs_per_100),
  };
}

function foodToRow(food: Food, grams: number): PlateRow {
  return toRow({
    kind: "food",
    foodId: food.id,
    name: food.name,
    grams,
    protein_per_100: food.protein_per_100,
    fat_per_100: food.fat_per_100,
    carbs_per_100: food.carbs_per_100,
    kcal_per_100: food.kcal_per_100,
    default_portion_g: food.default_portion_g,
    default_portion_label: food.default_portion_label,
  });
}

function mergeFoodRows(items: PlateRow[]): PlateRow[] {
  const merged: PlateRow[] = [];
  for (const item of items) {
    if (item.kind !== "food") {
      merged.push(item);
      continue;
    }
    const existing = merged.find(
      (entry) => entry.kind === "food" && entry.foodId === item.foodId,
    );
    if (existing?.kind !== "food") {
      merged.push(item);
      continue;
    }
    const grams =
      Number(existing.gramsInput.replace(",", ".")) +
      Number(item.gramsInput.replace(",", "."));
    const next = Number.isFinite(grams) && grams > 0 ? grams : existing.grams;
    existing.grams = Math.min(next, PLATE_GRAMS_MAX);
    existing.gramsInput = String(existing.grams);
  }
  return merged;
}

function toCommitItem(item: PlateDraftItem) {
  if (item.kind === "food") {
    return { kind: "food" as const, foodId: item.foodId, grams: item.grams };
  }

  return {
    kind: "new" as const,
    name: item.name,
    state: item.state,
    protein_per_100: item.protein_per_100,
    fat_per_100: item.fat_per_100,
    carbs_per_100: item.carbs_per_100,
    grams: item.grams,
  };
}

function rememberPreview(
  file: File,
  previewRef: { current: string | null },
): string {
  revokePreview(previewRef.current);
  const url = URL.createObjectURL(file);
  previewRef.current = url;
  return url;
}

function revokePreview(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function guessHtmlCamera(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }
  return /android/i.test(navigator.userAgent);
}

function stopMedia(stream: MediaStream | null) {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
