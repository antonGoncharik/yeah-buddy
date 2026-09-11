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
  updated_at: string;
}
