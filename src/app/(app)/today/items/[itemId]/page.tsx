"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GramsScreen, saveMealItemGrams } from "@/components/day/grams-screen";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import {
  calendarToday,
  isIsoDate,
  isWritableDayDate,
  todayHomeHref,
} from "@/lib/day/dates";
import { readFoodPayload } from "@/lib/foods";
import { readMealItemPayload } from "@/lib/meal-map";
import { LOAD_FAILED } from "@/lib/messages";
import type { Food, MealItem } from "@/lib/types";

export default function EditMealItemPage() {
  const params = useParams<{ itemId: string }>();
  const searchParams = useSearchParams();
  const homeHref = todayHomeHref(readDateParam(searchParams.get("date")));
  const [reloadToken, setReloadToken] = useState(0);
  const [item, setItem] = useState<MealItem | null>(null);
  const [food, setFood] = useState<Food | null>(null);
  const [dayDate, setDayDate] = useState<string | null>(null);
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
          setDayDate(null);
          return;
        }

        if (!response.ok) {
          throw new Error("load failed");
        }

        const data: unknown = await response.json();
        const loaded = readItem(data);
        setItem(loaded);
        setDayDate(readItemDate(data));

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
          setDayDate(null);
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
      <AppHeader title="Порция" backHref={homeHref} />
      {loading ? <ScreenLoading /> : null}
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
          backHref={homeHref}
          doneHref={homeHref}
          readOnly={
            dayDate != null && !isWritableDayDate(dayDate, calendarToday())
          }
          save={
            dayDate != null && !isWritableDayDate(dayDate, calendarToday())
              ? undefined
              : (grams) => saveMealItemGrams(item.id, grams)
          }
        />
      ) : null}
    </div>
  );
}

function readItem(data: unknown): MealItem | null {
  return readMealItemPayload(data);
}

function readFood(data: unknown): Food | null {
  return readFoodPayload(data);
}

function readItemDate(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("date" in data)) {
    return null;
  }

  const value = data.date;
  if (typeof value !== "string" || !isIsoDate(value)) {
    return null;
  }

  return value;
}

function readDateParam(value: string | null): string | null {
  if (!value || !isIsoDate(value)) {
    return null;
  }

  return value;
}
