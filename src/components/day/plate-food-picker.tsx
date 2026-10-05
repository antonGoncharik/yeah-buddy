"use client";

import { useEffect } from "react";

import { FoodPicker } from "@/components/foods/food-picker";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import type { Food } from "@/lib/types";

export function PlateFoodPicker({
  title,
  onPick,
  onClose,
}: {
  title: string;
  onPick: (food: Food) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <p className="px-4 pt-4 text-xl font-semibold tracking-tight">{title}</p>

      <FoodPicker
        showFavoriteOffer
        wrapperClassName="flex min-h-0 flex-1 flex-col"
        listClassName="min-h-0 flex-1 overflow-y-auto py-3"
        onSelectFood={onPick}
        onCatalogAdded={(food) => onPick(food)}
      />

      <StickyActions overlay={false} withNav={false}>
        <div data-keyboard-secondary>
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-base"
            onClick={onClose}
          >
            Отмена
          </Button>
        </div>
      </StickyActions>
    </div>
  );
}
