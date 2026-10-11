export type MacroAdvanceStep = "maxes" | "transition" | "reload";

export function macroAdvanceButtonLabel(options: {
  advancing: boolean;
  step: MacroAdvanceStep | null;
  lastInCycle: boolean;
  phaseTitle: string;
}): string {
  const { advancing, step, lastInCycle, phaseTitle } = options;
  if (!advancing) {
    return lastInCycle ? "Закрыть цикл" : `Завершить: ${phaseTitle}`;
  }
  switch (step) {
    case "maxes":
      return "Сохраняю веса…";
    case "transition":
      return lastInCycle ? "Закрываю цикл…" : "Переключаю этап…";
    case "reload":
      return "Обновляю…";
    default:
      return "…";
  }
}
