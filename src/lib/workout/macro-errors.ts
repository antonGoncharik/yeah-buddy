import { NEED_CYCLE_PHASES } from "@/lib/messages";

export class MacroConflictError extends Error {
  readonly code = "MACRO_EXISTS";

  constructor() {
    super("Текущий цикл уже есть.");
  }
}

export class NoExercisesError extends Error {
  constructor() {
    super("Сначала упражнения.");
  }
}

export class CycleEmptyError extends Error {
  constructor() {
    super(NEED_CYCLE_PHASES);
  }
}
