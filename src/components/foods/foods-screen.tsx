"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { foodsApiUrl } from "@/components/foods/food-favorite";
import { FoodPicker } from "@/components/foods/food-picker";
import { AppHeader } from "@/components/layout/app-header";
import { StickyActions } from "@/components/layout/sticky-actions";
import { buttonVariants } from "@/components/ui/button";
import { writeJson } from "@/lib/api-cache";
import { cn } from "@/lib/utils";

export function FoodsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Продукты" backHref="/settings" />

      <FoodPicker
        listClassName="pb-24"
        onCatalogAdded={(_food, foods) => {
          writeJson(foodsApiUrl("all"), { foods });
        }}
        stickyActions={
          <StickyActions>
            <Link
              href="/food/new"
              className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg")}
            >
              <Plus className="size-5" aria-hidden />
              Новый продукт
            </Link>
          </StickyActions>
        }
      />
    </div>
  );
}
