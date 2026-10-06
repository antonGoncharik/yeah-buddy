export type BuddyGymState = "done" | "open" | "queued" | "rest" | "none";

export interface BuddyTodayBoard {
  id: string;
  athlete_name: string;
  expires_at: string;
  date: string;
  food_logged: boolean;
  protein_ok: boolean;
  gym: {
    state: BuddyGymState;
    label: string;
  };
}

export interface BuddyGrantView {
  id: string;
  expires_at: string;
  claimed: boolean;
  person: string | null;
}

export interface BuddyAthleteView {
  id: string;
  expires_at: string;
  person: string;
}

export interface BuddyHome {
  outgoing: BuddyGrantView[];
  athletes: BuddyAthleteView[];
}
