import { FoodForm } from "@/components/foods/food-form";
import { AppHeader } from "@/components/layout/app-header";

export default async function NewFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ mealId?: string | string[] }>;
}) {
  const params = await searchParams;
  const mealId = readMealId(params.mealId);
  const backHref = mealId ? `/today/meals/${mealId}/add` : "/foods";

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Новый продукт" backHref={backHref} />
      <div className="px-4 pb-4">
        <FoodForm mealId={mealId} />
      </div>
    </div>
  );
}

function readMealId(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return value;
}
