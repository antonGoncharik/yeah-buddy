import assert from "node:assert/strict";

import { sessionsToCsv } from "@/lib/workout/sessions-csv";

const csv = sessionsToCsv([
  {
    date: "2026-10-01",
    exercise: "Жим, лёжа",
    setNumber: 1,
    weight: 80,
    reps: 5,
  },
]);
assert(csv.includes('"Жим, лёжа"'));
assert(csv.startsWith("date,exercise,set,weight_kg,reps\n"));

export default Promise.resolve();
