import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  FeaturedProgramNotFoundError,
  loadFeaturedProgramDetail,
} from "@/lib/share/program-load";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const program = await loadFeaturedProgramDetail(session.userId, id);
      return jsonOk({ program });
    } catch (error) {
      return failRoute(error, [whenError(FeaturedProgramNotFoundError, 404)]);
    }
  },
);
