"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GramsScreen, saveMealItemGrams } from "@/components/day/grams-screen";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED } from "@/lib/messages";
import type { Food, MealItem } from "@/lib/types";

export default function EditMealItemPage() {
  const params = useParams<{ itemId: string }>();
  const [reloadToken, setReloadToken] = useState(0);
  const [item, setItem] = useState<MealItem | null>(null);
  const [food, setFood] = useState<Food | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      void reloadToken;
      setLoading(true);
      setError(null);
      setFood(null);

      try {
        const response = await fetch(`/api/meal-items/${params.itemId}`);
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
        const loaded = readItem(data);
        setItem(loaded);

        if (loaded?.food_id) {
          const foodResponse = await fetch(`/api/foods/${loaded.food_id}`);
          if (cancelled) {
            return;
          }
          if (foodResponse.ok) {
            const foodData: unknown = await foodResponse.json();
            setFood(readFood(foodData));
          }
        }
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
      <AppHeader title="Граммы" backHref="/today" />
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
          name={item.name_snapshot}
          protein={item.per_100_snapshot.protein}
          fat={item.per_100_snapshot.fat}
          carbs={item.per_100_snapshot.carbs}
          kcal={item.per_100_snapshot.kcal}
          initialGrams={item.grams}
          defaultPortionG={food?.default_portion_g ?? null}
          defaultPortionLabel={food?.default_portion_label ?? null}
          backHref="/today"
          save={(grams) => saveMealItemGrams(item.id, grams)}
        />
      ) : null}
    </div>
  );
}

function readItem(data: unknown): MealItem | null {
  if (!data || typeof data !== "object" || !("item" in data) || !data.item) {
    return null;
  }

  return data.item as MealItem;
}

function readFood(data: unknown): Food | null {
  if (!data || typeof data !== "object" || !("food" in data) || !data.food) {
    return null;
  }

  return data.food as Food;
}
