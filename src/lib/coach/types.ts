export type CoachGymTone = "ok" | "short" | "miss" | "open" | "none";

export interface CoachMealLine {
  name: string;
  grams: number;
  protein: number;
  kcal: number;
}

export interface CoachMeal {
  label: string;
  items: CoachMealLine[];
}

export interface CoachGym {
  tone: CoachGymTone;
  title: string;
  headline: string;
  lines: string[];
}

export interface CoachDay {
  date: string;
  training: boolean;
  caught_up: boolean;
  target_protein: number;
  target_kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  body_weight: number | null;
  protein_short: boolean;
  meals: CoachMeal[];
  gym: CoachGym;
}

export interface CoachWeight {
  kg: number;
  date: string;
}

export interface CoachBoard {
  id: string;
  athlete_name: string;
  expires_at: string;
  today: string;
  weight: CoachWeight | null;
  days: CoachDay[];
}

export interface CoachGrantView {
  id: string;
  expires_at: string;
  claimed: boolean;
  person: string | null;
}

export interface CoachAthleteView {
  id: string;
  expires_at: string;
  person: string;
}

export interface CoachHome {
  outgoing: CoachGrantView[];
  athletes: CoachAthleteView[];
}
