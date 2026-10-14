"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { FoodForm } from "@/components/foods/food-form";
import { FoodFormShell } from "@/components/foods/food-form-shell";
import { calendarToday, isIsoDate, withDateQuery } from "@/lib/day/dates";
import { isDayType, isMealType } from "@/lib/nutrition";

export function NewFoodScreen() {
  const searchParams = useSearchParams();
  const mealId = readParam(searchParams.get("mealId"));
  const dayTypeRaw = readParam(searchParams.get("dayType"));
  const mealTypeRaw = readParam(searchParams.get("mealType"));
  const dateRaw = readParam(searchParams.get("date"));
  const dayType = isDayType(dayTypeRaw) ? dayTypeRaw : undefined;
  const mealType = isMealType(mealTypeRaw) ? mealTypeRaw : undefined;
  const date = dateRaw && isIsoDate(dateRaw) ? dateRaw : null;
  const today = calendarToday();

  const backHref = mealId
    ? withDateQuery(`/today/meals/${mealId}/add`, date, today)
    : dayType && mealType
      ? `/settings/meals/${dayType}/${mealType}/add`
      : "/foods";

  const afterCreateHref = mealId
    ? (foodId: string) =>
        withDateQuery(`/today/meals/${mealId}/add/${foodId}`, date, today)
    : dayType && mealType
      ? (foodId: string) =>
          `/settings/meals/${dayType}/${mealType}/add/${foodId}`
      : undefined;

  return (
    <FoodFormShell title="Новый продукт" backHref={backHref}>
      <Link
        href={recipeHref({ mealId, dayType, mealType, date })}
        className="text-base font-medium text-primary underline-offset-4 hover:underline"
      >
        Собрать из ингредиентов
      </Link>
      <FoodForm afterCreateHref={afterCreateHref} />
    </FoodFormShell>
  );
}

function recipeHref(input: {
  mealId?: string;
  dayType?: string;
  mealType?: string;
  date: string | null;
}): string {
  const query = new URLSearchParams();
  if (input.mealId) {
    query.set("mealId", input.mealId);
  }
  if (input.dayType) {
    query.set("dayType", input.dayType);
  }
  if (input.mealType) {
    query.set("mealType", input.mealType);
  }
  if (input.date) {
    query.set("date", input.date);
  }
  const text = query.toString();
  return text === "" ? "/food/recipe" : `/food/recipe?${text}`;
}

function readParam(value: string | null): string | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }

  return value;
}
