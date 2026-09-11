"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  type FoodFormState,
  parseNonneg,
  readFood,
  toFormState,
  toPayload,
} from "@/components/foods/food-form-state";
import { useConfirm } from "@/components/layout/confirm-provider";
import { deleteJson, patchJson, postJson } from "@/lib/api-cache";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import { calcKcalFromMacros } from "@/lib/nutrition";
import type { Food } from "@/lib/types";

export function useFoodForm({
  food,
  afterCreateHref,
}: {
  food?: Food;
  afterCreateHref?: (foodId: string) => string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [form, setForm] = useState<FoodFormState>(toFormState(food));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const autoKcal = useMemo(() => {
    const protein = parseNonneg(form.protein_per_100);
    const fat = parseNonneg(form.fat_per_100);
    const carbs = parseNonneg(form.carbs_per_100);
    if (protein == null || fat == null || carbs == null) {
      return null;
    }

    return calcKcalFromMacros(protein, fat, carbs);
  }, [form.protein_per_100, form.fat_per_100, form.carbs_per_100]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = toPayload(form, autoKcal);
      if (!payload) {
        setError(CHECK_FIELDS);
        return;
      }

      const data = food
        ? await patchJson(`/api/foods/${food.id}`, payload)
        : await postJson("/api/foods", payload);

      if (!food && afterCreateHref) {
        const created = readFood(data);
        if (created) {
          router.push(afterCreateHref(created.id));
          router.refresh();
          return;
        }
      }

      router.push("/foods");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!food) {
      return;
    }

    const ok = await confirm({
      message: "Удалить продукт?",
      confirmLabel: "Удалить",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setError(null);
    setDeleting(true);

    try {
      await deleteJson(`/api/foods/${food.id}`);
      router.push("/foods");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setDeleting(false);
    }
  }

  return {
    form,
    setForm,
    error,
    saving,
    deleting,
    autoKcal,
    onSubmit,
    onDelete,
  };
}
