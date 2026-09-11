"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { parsePlateDraft } from "@/lib/ai/plate-parse";
import { PLATE_GRAMS_MAX, type PlateDraftItem } from "@/lib/ai/plate-types";
import { compressPlateImage } from "@/lib/ai/read-plate-image";
import { ApiError, postJson } from "@/lib/api-cache";
import {
  AI_PLATE_FAILED,
  AI_PLATE_PHOTO_FAILED,
  LOAD_FAILED,
  readApiError,
} from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";

export type PlateRow = PlateDraftItem & { rowId: string; gramsInput: string };

type PlateStatus =
  | { status: "idle" }
  | { status: "working"; title: string }
  | { status: "error"; message: string }
  | { status: "empty"; previewUrl: string }
  | { status: "draft"; previewUrl: string; items: PlateRow[] }
  | { status: "saving"; previewUrl: string; items: PlateRow[] };

export function usePlateScreen({
  mealId,
  doneHref,
}: {
  mealId: string;
  doneHref: string;
}) {
  const router = useRouter();
  const cameraId = useId();
  const galleryId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [view, setView] = useState<PlateStatus>({ status: "idle" });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      revokePreview(previewRef.current);
    };
  }, []);

  function openCamera() {
    haptic("tap");
    cameraRef.current?.click();
  }

  function openGallery() {
    haptic("tap");
    galleryRef.current?.click();
  }

  async function onFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setSaveError(null);
    const previewUrl = rememberPreview(file, previewRef);
    setView({ status: "working", title: "Читаю фото…" });

    let blob: Blob;
    try {
      blob = await compressPlateImage(file);
    } catch {
      haptic("error");
      setView({ status: "error", message: AI_PLATE_PHOTO_FAILED });
      return;
    }

    setView({ status: "working", title: "Смотрю…" });

    try {
      const body = new FormData();
      body.append("image", blob, "plate.jpg");
      const response = await fetch("/api/ai/plate", {
        method: "POST",
        body,
      });
      const data: unknown = await response.json().catch(() => null);
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
        setView({ status: "empty", previewUrl });
        return;
      }

      haptic("success");
      setView({
        status: "draft",
        previewUrl,
        items: draft.items.map(toRow),
      });
    } catch (caught) {
      haptic("error");
      setView({
        status: "error",
        message: caught instanceof Error ? caught.message : AI_PLATE_FAILED,
      });
    }
  }

  function setGrams(index: number, gramsInput: string) {
    setView((current) => {
      if (current.status !== "draft") {
        return current;
      }
      return {
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, gramsInput } : item,
        ),
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

  async function save() {
    if (view.status !== "draft") {
      return;
    }

    const items = view.items.flatMap((item) => {
      const grams = Number(item.gramsInput.replace(",", "."));
      if (!Number.isFinite(grams) || grams <= 0) {
        return [];
      }
      return [{ ...item, grams: Math.min(grams, PLATE_GRAMS_MAX) }];
    });

    if (items.length === 0 || items.length !== view.items.length) {
      haptic("warn");
      setSaveError("Нужны граммы больше 0.");
      return;
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
    view.status === "saving"
      ? view.previewUrl
      : null;
  const items =
    view.status === "draft" || view.status === "saving" ? view.items : [];
  const empty = view.status === "empty";
  const error = view.status === "error" ? view.message : saveError;

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
    workingTitle: view.status === "working" ? view.title : null,
    openCamera,
    openGallery,
    onFile,
    setGrams,
    removeItem,
    save,
  };
}

function toRow(item: PlateDraftItem): PlateRow {
  return {
    ...item,
    rowId: crypto.randomUUID(),
    gramsInput: String(item.grams),
  };
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
