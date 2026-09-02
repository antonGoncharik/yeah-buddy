"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FoodForm } from "@/components/foods/food-form";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED } from "@/lib/messages";
import type { Food } from "@/lib/types";

export default function EditFoodPage() {
  const params = useParams<{ id: string }>();
  const [reloadToken, setReloadToken] = useState(0);
  const [food, setFood] = useState<Food | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      void reloadToken;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/foods/${params.id}`);
        if (cancelled) {
          return;
        }

        if (response.status === 404) {
          setError("Продукт не найден.");
          setFood(null);
          return;
        }

        if (!response.ok) {
          throw new Error("load failed");
        }

        const data: unknown = await response.json();
        setFood(readFood(data));
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
  }, [params.id, reloadToken]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Продукт" backHref="/foods" />
      <div className="px-4 pb-4">
        {loading ? (
          <p className="py-10 text-center text-muted-foreground">Загрузка…</p>
        ) : null}
        {!loading && error ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => setReloadToken((value) => value + 1)}
            >
              Повторить
            </Button>
          </div>
        ) : null}
        {!loading && food ? <FoodForm food={food} /> : null}
      </div>
    </div>
  );
}

function readFood(data: unknown): Food | null {
  if (!data || typeof data !== "object" || !("food" in data)) {
    return null;
  }

  return data.food as Food;
}
