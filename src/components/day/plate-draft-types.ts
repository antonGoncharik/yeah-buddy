import type { PlateDraftItem } from "@/lib/ai/plate-types";
import type { GramsMode } from "@/lib/food/yield";
import type { FoodState } from "@/lib/types";

export type PlateRow = PlateDraftItem & {
  rowId: string;
  gramsInput: string;
  gramsMode: GramsMode;
  proteinInput: string;
  fatInput: string;
  carbsInput: string;
};

export type PlatePicker =
  | { mode: "add" }
  | { mode: "replace"; index: number }
  | null;

export type PlateStatus =
  | { status: "idle" }
  | { status: "unavailable" }
  | { status: "working"; title: string; previewUrl: string | null }
  | { status: "error"; message: string; previewUrl: string | null }
  | { status: "empty"; previewUrl: string }
  | { status: "draft"; previewUrl: string; items: PlateRow[] }
  | { status: "saving"; previewUrl: string; items: PlateRow[] };

export type PlateNewPatch = {
  name?: string;
  state?: FoodState;
  proteinInput?: string;
  fatInput?: string;
  carbsInput?: string;
};
