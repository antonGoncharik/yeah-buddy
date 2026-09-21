import { foodInputSchema } from "@/lib/food/schema";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const base = {
  name: "Пачка",
  protein_per_100: 10,
  fat_per_100: 5,
  carbs_per_100: 20,
};

const plain = foodInputSchema.parse(base);
assertEqual("barcode" in plain, false, "omitted barcode stays off the update");

const kept = foodInputSchema.parse({
  ...base,
  barcode: " 4600605021084 ",
});
assertEqual(kept.barcode, "4600605021084", "barcode trimmed onto the food");

const cleared = foodInputSchema.parse({ ...base, barcode: "" });
assertEqual(cleared.barcode, null, "blank barcode clears");

assertEqual(
  foodInputSchema.safeParse({ ...base, barcode: "нет" }).success,
  false,
  "bad barcode rejected",
);

console.log("food barcode input ok");
