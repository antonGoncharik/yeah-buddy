"use client";

import { DaySummary } from "@/components/day/day-summary";
import { MealCard } from "@/components/day/meal-card";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { useMealTemplateScreen } from "@/components/settings/use-meal-template-screen";
import { Button } from "@/components/ui/button";
import { DAY_TEMPLATE_TITLES } from "@/lib/nutrition";
import type { DayType } from "@/lib/types";

export function MealTemplateScreen({ dayType }: { dayType: DayType }) {
  const {
    template,
    loading,
    error,
    busy,
    mealTypes,
    visibleItems,
    fact,
    targets,
    load,
    deleteItem,
  } = useMealTemplateScreen(dayType);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={DAY_TEMPLATE_TITLES[dayType]}
        backHref="/settings/meals"
      />

      <div className="flex flex-col gap-5 px-4 pb-4">
        <p className="text-base text-muted-foreground">
          Новый день возьмёт этот состав. Старые не трогает.
        </p>

        {loading ? <ScreenLoading /> : null}

        {!loading && error && !template ? (
          <div className="animate-rise flex flex-col items-center gap-3">
            <p className="text-center text-lg font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && template ? (
          <div className="flex flex-col gap-5">
            {error ? (
              <p className="animate-rise text-center text-lg font-medium">
                {error}
              </p>
            ) : null}

            <div className="animate-rise">
              <DaySummary day={targets} fact={fact} factLabel="Как будет" />
            </div>

            {mealTypes.map((mealType, index) => {
              const items = visibleItems
                .filter((item) => item.meal_type === mealType)
                .map((item) => ({
                  id: item.id,
                  name: item.food.name,
                  grams: item.grams,
                  protein: item.protein,
                  fat: item.fat,
                  carbs: item.carbs,
                  kcal: item.kcal,
                }));

              return (
                <MealCard
                  key={mealType}
                  mealType={mealType}
                  items={items}
                  itemHref={(item) =>
                    `/settings/meals/${dayType}/items/${item.id}`
                  }
                  addHref={`/settings/meals/${dayType}/${mealType}/add`}
                  className="animate-rise"
                  style={{ animationDelay: `${80 + index * 50}ms` }}
                  onDeleteItem={(line) => {
                    const row = visibleItems.find(
                      (item) => item.id === line.id,
                    );
                    if (row && !busy) {
                      void deleteItem(row);
                    }
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
