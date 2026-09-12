import { listDaysInRange } from "@/lib/day/history";
import { buildWeekSlots, type WeekSnapshot, weekWindow } from "@/lib/day/week";
import { getUserCalendarToday } from "@/lib/day/writable";
import { listSessionHistory } from "@/lib/workout/sessions";

export async function listWeek(userId: string): Promise<WeekSnapshot> {
  const today = await getUserCalendarToday(userId);
  const { start, end } = weekWindow(today);
  const [days, sessionsPage] = await Promise.all([
    listDaysInRange(userId, start, end),
    listSessionHistory(userId, {
      since: start,
      until: end,
      limit: 20,
      statuses: ["completed", "planned"],
    }),
  ]);

  return {
    today,
    items: buildWeekSlots({
      today,
      days,
      sessions: sessionsPage.items.map((item) => ({
        id: item.session.id,
        session_date: item.session.session_date,
        status: item.session.status,
        template_name: item.template_name,
        workout_type: item.session.workout_type,
      })),
    }),
  };
}
