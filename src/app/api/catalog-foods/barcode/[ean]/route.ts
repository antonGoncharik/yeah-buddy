import { failRoute, jsonError, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { parseBarcodeEan } from "@/lib/food/catalog-map";
import {
  CatalogFoodNotFoundError,
  lookupCatalogBarcode,
} from "@/lib/food/catalog-store";
import { CHECK_FIELDS } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ ean: string }>;
};

export const dynamic = "force-dynamic";

export const GET = sessionRoute(
  async (_session, _request, context: RouteContext) => {
    const { ean } = await context.params;
    if (!parseBarcodeEan(ean)) {
      return jsonError(CHECK_FIELDS, 400);
    }

    try {
      const food = await lookupCatalogBarcode(ean);
      return jsonOk({ food });
    } catch (error) {
      return failRoute(error, [whenError(CatalogFoodNotFoundError, 404)]);
    }
  },
);
