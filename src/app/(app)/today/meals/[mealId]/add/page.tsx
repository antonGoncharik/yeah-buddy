import { AddMealItemScreen } from "@/components/day/add-meal-item-screen";
import { AppHeader } from "@/components/layout/app-header";

export default async function AddMealItemPage({
  params,
}: {
  params: Promise<{ mealId: string }>;
}) {
  const { mealId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Добавить продукт" backHref="/today" />
      <AddMealItemScreen mealId={mealId} />
    </div>
  );
}
