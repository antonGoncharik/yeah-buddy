import { notFound } from "next/navigation";

import { AddMealItemScreen } from "@/components/day/add-meal-item-screen";
import { AppHeader } from "@/components/layout/app-header";
import { isDayType, isMealType, isMealVisible } from "@/lib/nutrition";

export default async function AddTemplateItemPage({
  params,
}: {
  params: Promise<{ dayType: string; mealType: string }>;
}) {
  const { dayType, mealType } = await params;
  if (
    !isDayType(dayType) ||
    !isMealType(mealType) ||
    !isMealVisible(mealType, dayType === "training")
  ) {
    notFound();
  }

  const backHref = `/settings/meals/${dayType}`;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Добавить продукт" backHref={backHref} />
      <AddMealItemScreen
        foodHrefBase={`/settings/meals/${dayType}/${mealType}/add`}
        newFoodHref={`/food/new?dayType=${encodeURIComponent(dayType)}&mealType=${encodeURIComponent(mealType)}`}
      />
    </div>
  );
}
