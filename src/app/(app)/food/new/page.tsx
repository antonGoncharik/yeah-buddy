import { FoodForm } from "@/components/foods/food-form";
import { AppHeader } from "@/components/layout/app-header";
import { isDayType, isMealType } from "@/lib/nutrition";

export default async function NewFoodPage({
  searchParams,
}: {
  searchParams: Promise<{
    mealId?: string | string[];
    dayType?: string | string[];
    mealType?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const mealId = readSingle(params.mealId);
  const dayTypeRaw = readSingle(params.dayType);
  const mealTypeRaw = readSingle(params.mealType);
  const dayType = isDayType(dayTypeRaw) ? dayTypeRaw : undefined;
  const mealType = isMealType(mealTypeRaw) ? mealTypeRaw : undefined;

  const backHref = mealId
    ? `/today/meals/${mealId}/add`
    : dayType && mealType
      ? `/settings/meals/${dayType}/${mealType}/add`
      : "/foods";

  const afterCreateHref = mealId
    ? (foodId: string) => `/today/meals/${mealId}/add/${foodId}`
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

function readSingle(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return value;
}
