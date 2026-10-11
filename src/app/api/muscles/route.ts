import { failRoute, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  getMuscleSnapshot,
  parseMuscleHorizonDays,
} from "@/lib/workout/muscle-load";

export const GET = sessionRoute(async (session, request) => {
  const days = parseMuscleHorizonDays(request.nextUrl.searchParams.get("days"));

  try {
    const snapshot = await getMuscleSnapshot(session.userId, days);
    return jsonOk(snapshot);
  } catch (error) {
    return failRoute(error);
  }
});
