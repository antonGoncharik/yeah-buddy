import type { FoodState } from "@/lib/types";

export const PLATE_ITEM_LIMIT = 8;
export const PLATE_CATALOG_LIMIT = 400;
export const PLATE_GRAMS_MAX = 1500;

export type PlateCatalogEntry = {
  i: number;
  n: string;
  s: FoodState;
  p: number;
  f: number;
  c: number;
  y?: [number, number];
};

export type PlateModelItem = {
  catalog_i: number;
  name: string;
  grams: number;
  state: FoodState;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  protein_per_100: number | null;
  fat_per_100: number | null;
  carbs_per_100: number | null;
};

export type PlateFoodRef = {
  id: string;
  name: string;
  state: FoodState;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
  default_portion_g: number | null;
  default_portion_label: string | null;
  yield_from_g: number | null;
  yield_to_g: number | null;
};

export type PlateDraftFood = {
  kind: "food";
  foodId: string;
  name: string;
  state: FoodState;
  grams: number;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
  default_portion_g: number | null;
  default_portion_label: string | null;
  yield_from_g: number | null;
  yield_to_g: number | null;
};

export type PlateDraftLump = {
  kind: "lump";
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
};

export type PlateDraftItem = PlateDraftFood | PlateDraftLump;

export type PlateDraft = {
  items: PlateDraftItem[];
};
