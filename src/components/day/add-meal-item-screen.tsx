"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { addMealItemGrams } from "@/components/day/grams-save";
import {
  MealDictateLink,
  MealLumpLink,
  MealPlateLink,
} from "@/components/day/meal-item-row";
import { FoodPicker } from "@/components/foods/food-picker";
import { StickyActions } from "@/components/layout/sticky-actions";
import { buttonVariants } from "@/components/ui/button";
import { reportActionError } from "@/lib/action-error";
import { appendFoodHrefSegment } from "@/lib/food/paths";
import { quickAddGrams } from "@/lib/food/quick-add";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AddMealItemScreen({
  foodHrefBase,
  newFoodHref,
  lumpHrefBase,
  plateHref,
  dictateHref,
  quickAdd,
  startScan = false,
}: {
  foodHrefBase: string;
  newFoodHref: string;
  lumpHrefBase?: string;
  plateHref?: string;
  dictateHref?: string;
  quickAdd?: {
    mealId: string;
    date: string;
    doneHref: string;
  };
  startScan?: boolean;
}) {
  const router = useRouter();
  const [addingId, setAddingId] = useState<string | null>(null);

  const consumeScanParam = useCallback(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("scan")) {
      return;
    }
    url.searchParams.delete("scan");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", next);
  }, []);

  async function pickFood(food: Food) {
    const href = appendFoodHrefSegment(foodHrefBase, food.id);
    if (!quickAdd || addingId) {
      router.push(href);
      return;
    }

    const grams = quickAddGrams(food);
    if (grams == null) {
      router.push(href);
      return;
    }

    setAddingId(food.id);
    try {
      await addMealItemGrams({
        date: quickAdd.date,
        mealId: quickAdd.mealId,
        food,
        grams,
      });
      haptic("success");
      router.replace(quickAdd.doneHref);
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setAddingId(null);
    }
  }

  return (
    <FoodPicker
      searchPlaceholder="Что съел"
      startScan={startScan}
      showFavoriteOffer
      lumpEmptyHint={Boolean(lumpHrefBase)}
      stickyHideWhenSearch={Boolean(lumpHrefBase)}
      onScanConsumed={consumeScanParam}
      hrefForFood={(food) => appendFoodHrefSegment(foodHrefBase, food.id)}
      onSelectFood={quickAdd ? pickFood : undefined}
      onCatalogAdded={(food) => void pickFood(food)}
      listClassName="pb-24"
      topSlot={
        <>
          {lumpHrefBase ? <MealLumpLink href={lumpHrefBase} query="" /> : null}
          {plateHref || dictateHref ? (
            <div className="flex gap-2">
              {plateHref ? <MealPlateLink href={plateHref} /> : null}
              {dictateHref ? <MealDictateLink href={dictateHref} /> : null}
            </div>
          ) : null}
        </>
      }
      stickyActions={
        <StickyActions>
          <Link
            href={newFoodHref}
            className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg")}
          >
            <Plus className="size-5" aria-hidden />
            Новый продукт
          </Link>
        </StickyActions>
      }
    />
  );
}
