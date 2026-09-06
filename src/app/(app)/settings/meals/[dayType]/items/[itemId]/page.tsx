"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  GramsScreen,
  saveTemplateItemGrams,
} from "@/components/day/grams-screen";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED } from "@/lib/messages";
import { isDayType } from "@/lib/nutrition";
import type { MealTemplateItemView } from "@/lib/types";

export default function EditTemplateItemPage() {
  const params = useParams<{ dayType: string; itemId: string }>();
  const dayType = isDayType(params.dayType) ? params.dayType : null;
  const backHref = dayType ? `/settings/meals/${dayType}` : "/settings/meals";
  const [reloadToken, setReloadToken] = useState(0);
  const [item, setItem] = useState<MealTemplateItemView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      void reloadToken;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/meal-template-items/${params.itemId}`,
        );
        if (cancelled) {
          return;
        }

        if (response.status === 404) {
          setError("Запись не найдена.");
          setItem(null);
          return;
        }

        if (!response.ok) {
          throw new Error("load failed");
        }

        const data: unknown = await response.json();
        setItem(readItem(data));
      } catch {
        if (!cancelled) {
          setError(LOAD_FAILED);
          setItem(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.itemId, reloadToken]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Порция" backHref={backHref} />
      {loading ? (
        <p className="py-10 text-center text-muted-foreground">Загрузка…</p>
      ) : null}
      {!loading && error ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10">
          <p className="text-center font-medium">{error}</p>
          <Button
            className="h-12 min-w-40 text-base"
            onClick={() => setReloadToken((value) => value + 1)}
          >
            Повторить
          </Button>
        </div>
      ) : null}
      {!loading && item ? (
        <GramsScreen
          name={item.food.name}
          protein={item.food.protein_per_100}
          fat={item.food.fat_per_100}
          carbs={item.food.carbs_per_100}
          kcal={item.food.kcal_per_100}
          initialGrams={item.grams}
          defaultPortionG={item.food.default_portion_g}
          defaultPortionLabel={item.food.default_portion_label}
          backHref={backHref}
          doneHref={backHref}
          save={(grams) => saveTemplateItemGrams(item.id, grams)}
        />
      ) : null}
    </div>
  );
}

function readItem(data: unknown): MealTemplateItemView | null {
  if (!data || typeof data !== "object" || !("item" in data) || !data.item) {
    return null;
  }

  return data.item as MealTemplateItemView;
}
