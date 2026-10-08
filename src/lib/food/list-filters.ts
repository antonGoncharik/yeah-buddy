export type FoodListFilterTab = "favorites" | "recent" | "all";

export const FOOD_LIST_FILTER_TABS: Array<{
  id: FoodListFilterTab;
  label: string;
}> = [
  { id: "recent", label: "Недавние" },
  { id: "favorites", label: "Избранное" },
  { id: "all", label: "Все" },
];
