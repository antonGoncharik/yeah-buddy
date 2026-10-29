import { BALANCE_RULES } from "@/lib/workout/barbell-balance";
import { BARBELL_DAILY_RULES } from "@/lib/workout/barbell-daily";
import { PENDULUM_RULES } from "@/lib/workout/barbell-pendulum";

export type BarbellDailyMode = "rack" | "balance" | "pendulum";

export const BARBELL_DAILY_MODE_OPTIONS: Array<{
  id: BarbellDailyMode;
  label: string;
}> = [
  { id: "rack", label: "Стойка" },
  { id: "balance", label: "Ровно" },
  { id: "pendulum", label: "Маятник" },
];

export const BARBELL_DAILY_MODE_SUBTITLE: Record<BarbellDailyMode, string> = {
  rack: "Задача дня",
  balance: "Баланс",
  pendulum: "Башня",
};

export const BARBELL_DAILY_MODE_RULES: Record<BarbellDailyMode, string> = {
  rack: BARBELL_DAILY_RULES,
  balance: BALANCE_RULES,
  pendulum: PENDULUM_RULES,
};
