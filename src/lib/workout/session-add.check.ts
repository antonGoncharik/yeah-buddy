import { adHocFeelPlan, resolveAdHocKind } from "@/lib/workout/session-add";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  resolveAdHocKind("static", "dynamic"),
  "static",
  "hold stays static",
);
assertEqual(
  resolveAdHocKind("dynamic", "static"),
  "dynamic",
  "reps stay dynamic",
);
assertEqual(
  resolveAdHocKind("both", "static"),
  "static",
  "both follows a static day",
);
assertEqual(
  resolveAdHocKind("both", "dynamic"),
  "dynamic",
  "both follows a dynamic day",
);

const reps = adHocFeelPlan("dynamic");
assertEqual(reps.groups?.[0]?.reps, 8, "three by eight");
assertEqual(reps.groups?.[0]?.sets, 3, "three sets");
assertEqual(reps.groups?.[0]?.load, { type: "feel" }, "by feel");
assertEqual(reps.warmup, false, "no extra warmup");

const hold = adHocFeelPlan("static");
assertEqual(hold.groups?.[0]?.seconds, 30, "thirty second holds");
assertEqual(hold.groups?.[0]?.reps, null, "holds have no reps");

console.log("session add ok");
