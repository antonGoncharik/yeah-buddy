import { redirect } from "next/navigation";

import { AddMealItemScreen } from "@/components/day/add-meal-item-screen";
import { AppHeader } from "@/components/layout/app-header";
import {
  isIsoDate,
  isWritableDayDate,
  todayHomeHref,
  withDateQuery,
} from "@/lib/day/dates";
import { resolveRequestToday } from "@/lib/day/writable";

export default async function AddMealItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ mealId: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { mealId } = await params;
  const query = await searchParams;
  const date = readDate(query.date);
  const today = await resolveRequestToday();
  const homeHref = todayHomeHref(date, today);

  if (date && !isWritableDayDate(date, today)) {
    redirect(homeHref);
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Добавить продукт" backHref={homeHref} />
      <AddMealItemScreen
        foodHrefBase={withDateQuery(`/today/meals/${mealId}/add`, date, today)}
        newFoodHref={withDateQuery(
          `/food/new?mealId=${encodeURIComponent(mealId)}`,
          date,
          today,
        )}
        plateHref={withDateQuery(`/today/meals/${mealId}/plate`, date, today)}
      />
    </div>
  );
}

function readDate(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || !isIsoDate(value)) {
    return null;
  }

  return value;
}
