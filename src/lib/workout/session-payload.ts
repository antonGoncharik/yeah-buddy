import type { SessionDetail } from "@/lib/types";
import { readExercises } from "@/lib/workout/hub-payload";

export { readExercises };

export function readSessionDetail(data: unknown): SessionDetail | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("session" in data) ||
    !data.session
  ) {
    return null;
  }

  return data as SessionDetail;
}
