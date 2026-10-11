import { macroAdvanceButtonLabel } from "@/lib/workout/macro-advance-copy";

const idle = macroAdvanceButtonLabel({
  advancing: false,
  step: null,
  lastInCycle: false,
  phaseTitle: "Набор",
});
if (idle !== "Завершить: Набор") {
  throw new Error(`idle label: ${idle}`);
}

const closing = macroAdvanceButtonLabel({
  advancing: true,
  step: "transition",
  lastInCycle: true,
  phaseTitle: "Сброс",
});
if (closing !== "Закрываю цикл…") {
  throw new Error(`closing label: ${closing}`);
}

console.log("macro advance copy ok");
