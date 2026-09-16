/**
 * Схема подходов на слоте шаблона.
 *
 * Слот = упражнение внутри одного дня программы. У него может быть своя
 * схема: список групп «N подходов × повторы @ нагрузка». Нагрузка берётся
 * от 1ПМ (процент), от рабочего кг упражнения (± смещение), фиксированная
 * или «по самочувствию». Рабочий кг растёт после недели, если в цикле
 * стоит прибавка, иначе после тренировки.
 *
 * Схема может меняться по этапам цикла: `phases` — свои группы на ключ
 * этапа. Это даёт таблицы «день × неделя × упражнение».
 */

export type SlotLoadType = "percent" | "orm" | "track" | "fixed" | "feel";

export type SlotLoad =
  | { type: "percent"; percent: number }
  | { type: "orm"; percent: number }
  | { type: "track"; percent: number; offset: number }
  | { type: "fixed"; weight: number }
  | { type: "feel" };

export interface SlotSetGroup {
  sets: number;
  reps: number | null;
  /** Верх диапазона повторов: «6–8». */
  reps_to: number | null;
  seconds: number | null;
  load: SlotLoad;
}

export type SlotIntensity = "heavy" | "light";

export interface SlotPlan {
  /** null — подходы по общему плану, но интенсивность и заметка свои. */
  groups: SlotSetGroup[] | null;
  /** Своя схема на этап цикла: ключ этапа → группы. Пусто — как обычно. */
  phases?: Record<string, SlotSetGroup[]>;
  intensity: SlotIntensity | null;
  /** Разминка перед рабочими (только для своей схемы). */
  warmup: boolean;
  note: string | null;
}

export interface TemplateSlot {
  exercise_id: string;
  plan: SlotPlan | null;
}

/** Working kilograms on the exercise; one current weight. */
export interface ExerciseTrack {
  id: string;
  user_id: string;
  exercise_id: string;
  name: string | null;
  steps: number[];
  /** Индекс шага, который пойдёт в следующую тренировку. */
  position: number;
  created_at: string;
  updated_at: string;
}

/** Working kg in a session: this weight and, if it grows after the session, the next. */
export interface SessionTrackInfo {
  exercise_id: string;
  name: string;
  /** 1-based шаг, который шёл в эту тренировку. */
  step: number;
  total: number;
  weight: number | null;
  next_weight: number | null;
  finished: boolean;
}
