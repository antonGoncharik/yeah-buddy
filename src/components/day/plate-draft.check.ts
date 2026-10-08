import {
  emptyLumpRow,
  foodRowToLump,
  setRowGrams,
  toPlateRow,
} from "@/components/day/plate-draft";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const lump = emptyLumpRow();
assertEqual(lump.kind, "lump", "empty kind");
assertEqual(lump.name, "", "empty name");
assertEqual(lump.proteinInput, "", "empty protein");

const food = toPlateRow({
  kind: "food",
  foodId: "potato",
  name: "Картофель варёный",
  state: "cooked",
  grams: 150,
  protein_per_100: 2,
  fat_per_100: 0,
  carbs_per_100: 16,
  kcal_per_100: 72,
  default_portion_g: null,
  default_portion_label: null,
  yield_from_g: null,
  yield_to_g: null,
});
assertEqual(food.kind, "food", "food row");

const converted = foodRowToLump(food);
assertEqual(converted.kind, "lump", "converted kind");
assertEqual(converted.rowId, food.rowId, "keeps row id");
if (converted.kind === "lump") {
  assertEqual(converted.name, "Картофель варёный", "converted name");
  assertEqual(converted.protein, 3, "portion protein");
  assertEqual(converted.carbs, 24, "portion carbs");
  assertEqual(converted.grams, 150, "converted portion grams");
}

const scaledLump = setRowGrams(
  toPlateRow({
    kind: "lump",
    name: "Омлет",
    grams: 100,
    protein: 20,
    fat: 15,
    carbs: 2,
    kcal: 0,
  }),
  "200",
);
assertEqual(scaledLump.kind, "lump", "scaled kind");
if (scaledLump.kind === "lump") {
  assertEqual(scaledLump.protein, 40, "double grams doubles protein");
  assertEqual(scaledLump.gramsInput, "200", "grams input");
}

console.log("plate draft ok");
