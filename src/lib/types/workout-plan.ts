/**
 * Схема подходов на слоте шаблона и линейки весов.
 *
 * Слот = упражнение внутри одной тренировки очереди. У него может быть своя
 * схема: список групп «N подходов × повторы @ нагрузка». Нагрузка берётся
 * от рабочего веса (процент), от линейки (явный ряд килограммов по неделям),
 * фиксированная или «по самочувствию» (вес прошлого раза, план не давит).
 */

export type SlotLoadType = "percent" | "track" | "fixed" | "feel";

export type SlotLoad =
  | { type: "percent"; percent: number }
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
  intensity: SlotIntensity | null;
  /** Разминка перед рабочими (только для своей схемы). */
  warmup: boolean;
  note: string | null;
}

export interface TemplateSlot {
  exercise_id: string;
  plan: SlotPlan | null;
}

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

/** Линейка в контексте сессии: где сейчас и что дальше. */
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
