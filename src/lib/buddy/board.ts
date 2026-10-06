import { requireBuddyBoardGrant } from "@/lib/buddy/store";
import type { BuddyGymState, BuddyTodayBoard } from "@/lib/buddy/types";
import { sumMeals } from "@/lib/nutrition";
import { proteinClosed } from "@/lib/flavor";
import { getDayByDate } from "@/lib/day/store";
import { getUserCalendarToday } from "@/lib/day/writable";
import { loadOwnerName } from "@/lib/share/pack-load";
import { getSessionOnDate } from "@/lib/workout/sessions";
import { nextCircleName } from "@/lib/telegram/reminder-facts";

export async function loadBuddyBoard(
  viewerId: string,
  grantId: string,
): Promise<BuddyTodayBoard> {
  const grant = await requireBuddyBoardGrant(viewerId, grantId);
  const athleteId = grant.athlete_user_id;
  const today = await getUserCalendarToday(athleteId);

  const [day, session, nextName, name] = await Promise.all([
    getDayByDate(athleteId, today),
    getSessionOnDate(athleteId, today),
    nextCircleName(athleteId),
    loadOwnerName(athleteId),
  ]);

  const fact = day != null ? sumMeals(day.meals) : null;
  const foodLogged =
    day != null && day.meals.some((meal) => meal.items.length > 0);
  const proteinOk =
    day != null &&
    fact != null &&
    day.target_protein > 0 &&
    proteinClosed(day.target_protein - fact.protein, fact.protein);

  const gym = buddyGymState({
    isTrainingDay: day?.is_training_day ?? false,
    sessionStatus: session?.status ?? null,
    nextName,
  });

  return {
    id: grant.id,
    athlete_name: name?.trim() || "Друг",
    expires_at: grant.expires_at,
    date: today,
    food_logged: foodLogged,
    protein_ok: proteinOk,
    gym,
  };
}

function buddyGymState(input: {
  isTrainingDay: boolean;
  sessionStatus: string | null;
  nextName: string | null;
}): { state: BuddyGymState; label: string } {
  if (input.sessionStatus === "completed") {
    return { state: "done", label: "Зал закрыт" };
  }
  if (input.sessionStatus === "planned") {
    return { state: "open", label: "Тренировка открыта" };
  }
  if (input.nextName && input.isTrainingDay) {
    return { state: "queued", label: input.nextName };
  }
  if (!input.isTrainingDay) {
    return { state: "rest", label: "День отдыха" };
  }
  return { state: "none", label: "Без программы" };
}
