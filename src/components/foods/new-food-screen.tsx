"use client";

import { useSearchParams } from "next/navigation";

import { FoodForm } from "@/components/foods/food-form";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="flex flex-col gap-4">
      <AppHeader title="Новый продукт" backHref={backHref} />
      <div className="px-4 pb-4">
        <FoodForm afterCreateHref={afterCreateHref} />
      </div>
    </div>
  );
}

function readParam(value: string | null): string | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }

  return value;
}
