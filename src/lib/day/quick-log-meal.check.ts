import assert from "node:assert/strict";

import { pickQuickLogMealId } from "@/lib/day/quick-log-meal";

const meals = [
  { id: "b", meal_type: "breakfast" as const, items: [] },
  { id: "l", meal_type: "lunch" as const, items: [{ id: "1" }] },
  { id: "d", meal_type: "dinner" as const, items: [] },
];

assert.equal(
  pickQuickLogMealId(meals, new Date("2026-01-01T08:00:00")),
  "b",
  "empty breakfast first",
);

assert.equal(
  pickQuickLogMealId(
    [
      { id: "b", meal_type: "breakfast", items: [{ id: "1" }] },
      { id: "l", meal_type: "lunch", items: [{ id: "2" }] },
    ],
    new Date("2026-01-01T12:30:00"),
  ),
  "l",
  "lunch by hour when full",
);

console.log("quick log meal ok");
