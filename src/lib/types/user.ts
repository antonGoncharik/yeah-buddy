export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  language_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserSex = "male" | "female";
export type UserGoal = "lose" | "keep" | "gain";
export type UserTrainingAge = "beginner" | "year" | "years";

export interface UserSettings {
  user_id: string;
  rest_protein: number;
  rest_fat: number;
  rest_carbs: number;
  training_protein: number;
  training_fat: number;
  training_carbs: number;
  onboarding_completed_at: string | null;
  reminders_enabled: boolean;
  timezone: string;
  training_years: number | null;
  /** Who they are — input to the protein suggestion. */
  sex: UserSex | null;
  /** lose / keep / gain — input to the protein suggestion. */
  goal: UserGoal | null;
  /** Стаж: только начал / около года / несколько лет. */
  training_age: UserTrainingAge | null;
  /** Hidden preset ids this person may pick. General programs are not stored here. */
  granted_programs: string[];
  meal_template_fill_prompt_dismissed: boolean;
  /** Rest-day kcal the person refused. A later offer returns when it moves. */
  energy_goal_dismissed_kcal: number | null;
  /** Workouts tab, day-type switch, gym reminders and AI gym review. */
  gym_enabled: boolean;
  updated_at: string;
}
