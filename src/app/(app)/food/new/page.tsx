import { FoodForm } from "@/components/foods/food-form";
import { AppHeader } from "@/components/layout/app-header";

export default function NewFoodPage() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Новый продукт" backHref="/foods" />
      <div className="px-4 pb-4">
        <FoodForm />
      </div>
    </div>
  );
}
