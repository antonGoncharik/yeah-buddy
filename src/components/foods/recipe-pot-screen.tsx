"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { addMealItemGrams } from "@/components/day/grams-save";
import { FoodFormShell } from "@/components/foods/food-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cachedGet, postJson } from "@/lib/api-cache";
import {
  calendarToday,
  isIsoDate,
  todayHomeHref,
  withDateQuery,
} from "@/lib/day/dates";
import {
  type RecipeLine,
  recipeCookedGrams,
  recipePer100,
  recipePortion,
  recipeRawGrams,
} from "@/lib/food/recipe";
import { parseFoodList, readFoodPayload } from "@/lib/foods";
import {
  formatKcal,
  formatMacro,
  isDayType,
  isMealType,
} from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";

const SHRINK = [10, 20, 30] as const;
const PORTIONS = [1, 2, 3, 4] as const;

interface PotLine {
  food: Food;
  grams: string;
}

export function RecipePotScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealId = readParam(searchParams.get("mealId"));
  const dayTypeRaw = readParam(searchParams.get("dayType"));
  const mealTypeRaw = readParam(searchParams.get("mealType"));
  const dateRaw = readParam(searchParams.get("date"));
  const dayType = isDayType(dayTypeRaw) ? dayTypeRaw : undefined;
  const mealType = isMealType(mealTypeRaw) ? mealTypeRaw : undefined;
  const date = dateRaw && isIsoDate(dateRaw) ? dateRaw : null;
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Food[]>([]);
  const [lines, setLines] = useState<PotLine[]>([]);
  const [cooked, setCooked] = useState("");
  const [shrink, setShrink] = useState<number | null>(null);
  const [portions, setPortions] = useState<(typeof PORTIONS)[number]>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipeLines: RecipeLine[] = lines.flatMap((line) => {
    const grams = Number(line.grams.replace(",", "."));
    if (!(grams > 0)) {
      return [];
    }
    return [
      {
        grams,
        proteinPer100: line.food.protein_per_100,
        fatPer100: line.food.fat_per_100,
        carbsPer100: line.food.carbs_per_100,
      },
    ];
  });
  const raw = recipeRawGrams(recipeLines);
  const cookedGrams = useMemo(() => {
    const typed = Number(cooked.replace(",", "."));
    return recipeCookedGrams({
      rawGrams: raw,
      cookedGrams: cooked.trim() === "" ? null : typed,
      shrinkPercent: shrink,
    });
  }, [cooked, raw, shrink]);
  const per100 =
    cookedGrams != null ? recipePer100(recipeLines, cookedGrams) : null;
  const portion =
    cookedGrams != null ? recipePortion(cookedGrams, portions) : null;

  async function search(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setHits([]);
      return;
    }
    try {
      await cachedGet(
        `/api/foods?filter=all&q=${encodeURIComponent(value.trim())}`,
        (data) => {
          setHits(parseFoodList(data).slice(0, 8));
          return true;
        },
      );
    } catch {
      setHits([]);
    }
  }

  function addFood(food: Food) {
    haptic("tick");
    setLines((current) => {
      const existing = current.find((line) => line.food.id === food.id);
      if (existing) {
        return current;
      }
      return [...current, { food, grams: "100" }];
    });
    setQuery("");
    setHits([]);
  }

  const backHref = mealId
    ? withDateQuery(`/today/meals/${mealId}/add`, date, calendarToday())
    : dayType && mealType
      ? `/settings/meals/${dayType}/${mealType}/add`
      : "/foods";

  async function save(logPortion: boolean) {
    const title = name.trim();
    if (title === "" || !per100 || saving) {
      haptic("warn");
      setError("Нужны название, ингредиенты и правдоподобный вес готового.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = await postJson("/api/foods", {
        name: title,
        state: "cooked",
        protein_per_100: per100.protein,
        fat_per_100: per100.fat,
        carbs_per_100: per100.carbs,
        default_portion_g: portion?.grams ?? 250,
        default_portion_label: portion?.label ?? null,
      });
      const food = readFoodPayload(data);
      haptic("commit");
      if (logPortion && mealId && food && portion) {
        try {
          await addMealItemGrams({
            date: date ?? calendarToday(),
            mealId,
            food,
            grams: portion.grams,
          });
          router.replace(todayHomeHref(date, calendarToday()));
          return;
        } catch (caught) {
          haptic("error");
          setSaving(false);
          setError(
            caught instanceof Error
              ? caught.message
              : "Блюдо сохранилось, порция не записалась.",
          );
          router.push(
            withDateQuery(
              `/today/meals/${mealId}/add/${food.id}`,
              date,
              calendarToday(),
            ),
          );
          return;
        }
      }
      const next = food
        ? mealId
          ? withDateQuery(
              `/today/meals/${mealId}/add/${food.id}`,
              date,
              calendarToday(),
            )
          : dayType && mealType
            ? `/settings/meals/${dayType}/${mealType}/add/${food.id}`
            : `/food/${food.id}`
        : "/foods";
      router.push(next);
    } catch (caught) {
      haptic("error");
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Не сохранилось.");
    }
  }

  return (
    <FoodFormShell title="Своя кастрюля" backHref={backHref}>
      <div className="flex flex-col gap-4">
        <p className="text-base leading-relaxed text-muted-foreground">
          Сложи сырые продукты и вес готового блюда. Кастрюля станет одним
          продуктом с КБЖУ на 100 г.
        </p>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Сырники, суп, курица с рисом"
          className="h-12 text-base"
          maxLength={80}
        />
        <Input
          value={query}
          onChange={(event) => void search(event.target.value)}
          placeholder="Ингредиент"
          className="h-12 text-base"
        />
        {hits.length > 0 ? (
          <div className="flex flex-col gap-2">
            {hits.map((food) => (
              <Button
                key={food.id}
                type="button"
                variant="outline"
                className="h-12 justify-start text-base"
                onClick={() => addFood(food)}
              >
                {food.name}
              </Button>
            ))}
          </div>
        ) : null}
        {lines.map((line) => (
          <div key={line.food.id} className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-base">{line.food.name}</p>
            <Input
              inputMode="decimal"
              value={line.grams}
              aria-label={`Граммы, ${line.food.name}`}
              className="h-11 w-24 text-base"
              onChange={(event) =>
                setLines((current) =>
                  current.map((item) =>
                    item.food.id === line.food.id
                      ? { ...item, grams: event.target.value }
                      : item,
                  ),
                )
              }
            />
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() =>
                setLines((current) =>
                  current.filter((item) => item.food.id !== line.food.id),
                )
              }
            >
              Убрать
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {SHRINK.map((value) => (
            <Button
              key={value}
              type="button"
              variant={shrink === value ? "secondary" : "outline"}
              className="min-h-11"
              onClick={() => {
                haptic("tick");
                setShrink((current) => (current === value ? null : value));
                setCooked("");
              }}
            >
              Ужарилось на {value}%
            </Button>
          ))}
        </div>
        <Input
          inputMode="decimal"
          value={cooked}
          onChange={(event) => {
            setCooked(event.target.value);
            setShrink(null);
          }}
          placeholder="Вес готового, г"
          className="h-12 text-base"
        />
        <div className="flex flex-wrap gap-2">
          {PORTIONS.map((value) => (
            <Button
              key={value}
              type="button"
              variant={portions === value ? "secondary" : "outline"}
              className="min-h-11"
              onClick={() => {
                haptic("tick");
                setPortions(value);
              }}
            >
              {value === 1 ? "1 порция" : `${value} порции`}
            </Button>
          ))}
        </div>
        <p className="text-lg font-semibold tabular-nums">
          {per100
            ? `На 100 г: ${formatKcal(per100.kcal)} ккал · Б ${formatMacro(per100.protein)} · Ж ${formatMacro(per100.fat)} · У ${formatMacro(per100.carbs)}`
            : raw > 0
              ? "Проверь вес готового."
              : "Добавь ингредиенты."}
          {portion ? ` Порция ${portion.grams} г.` : ""}
        </p>
        {error ? <p className="text-base text-destructive">{error}</p> : null}
        <Button
          type="button"
          className="h-14 text-lg"
          disabled={saving}
          onClick={() => void save(false)}
        >
          {saving ? "Сохраняю…" : "Сохранить блюдо"}
        </Button>
        {mealId && portion ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base"
            disabled={saving}
            onClick={() => void save(true)}
          >
            {`Сохранить и записать ${portion.grams} г`}
          </Button>
        ) : null}
      </div>
    </FoodFormShell>
  );
}

function readParam(value: string | null): string | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }
  return value;
}
