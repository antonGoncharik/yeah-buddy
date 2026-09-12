"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { addMealItemGrams, GramsScreen } from "@/components/day/grams-screen";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { isIsoDate, todayHomeHref, withDateQuery } from "@/lib/day/dates";
import { readCalendarToday, readDayWritable } from "@/lib/day/today-payload";
import { parseFoodYield } from "@/lib/food/yield";
import { readFoodPayload } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import type { Food } from "@/lib/types";

export default function AddMealItemGramsPage() {
  const params = useParams<{ mealId: string; foodId: string }>();
  const searchParams = useSearchParams();
  const date = readDateParam(searchParams.get("date"));
  const [reloadToken, setReloadToken] = useState(0);
  const [food, setFood] = useState<Food | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [writable, setWritable] = useState(date == null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const backHref = withDateQuery(
    `/today/meals/${params.mealId}/add`,
    date,
    today ?? undefined,
  );
  const doneHref = todayHomeHref(date, today ?? undefined);
  const viewOnly = !writable;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      void reloadToken;
      setLoading(true);
      setError(null);

      try {
        const [foodResponse, dayResponse] = await Promise.all([
          fetch(`/api/foods/${params.foodId}`),
          date
            ? fetch(`/api/days?date=${encodeURIComponent(date)}`)
            : Promise.resolve(null),
        ]);
        if (cancelled) {
          return;
        }

        if (foodResponse.status === 404) {
          setError("Продукт не найден.");
          setFood(null);
          return;
        }

        if (!foodResponse.ok) {
          throw new Error("load failed");
        }

        const data: unknown = await foodResponse.json();
        setFood(readFood(data));

        if (date && dayResponse?.ok) {
          const dayData: unknown = await dayResponse.json();
          if (cancelled) {
            return;
          }
          const loadedToday = readCalendarToday(dayData);
          setToday(loadedToday);
          setWritable(
            loadedToday != null && readDayWritable(dayData, date, loadedToday),
          );
        } else if (date) {
          setWritable(false);
        } else {
          setWritable(true);
        }
      } catch {
        if (!cancelled) {
          setError(LOAD_FAILED);
          setFood(null);
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
  }, [date, params.foodId, reloadToken]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Порция" backHref={backHref} />
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
      {!loading && food ? (
        <GramsScreen
          name={food.name}
          protein={food.protein_per_100}
          fat={food.fat_per_100}
          carbs={food.carbs_per_100}
          kcal={food.kcal_per_100}
          initialGrams={food.default_portion_g ?? 100}
          defaultPortionG={food.default_portion_g}
          defaultPortionLabel={food.default_portion_label}
          yieldPair={parseFoodYield(food)}
          foodState={food.state}
          allowCooked
          backHref={backHref}
          doneHref={doneHref}
          readOnly={viewOnly}
          save={
            viewOnly
              ? undefined
              : (grams) => addMealItemGrams(params.mealId, food.id, grams)
          }
        />
      ) : null}
    </div>
  );
}

function readFood(data: unknown): Food | null {
  return readFoodPayload(data);
}

function readDateParam(value: string | null): string | null {
  if (!value || !isIsoDate(value)) {
    return null;
  }

  return value;
}
