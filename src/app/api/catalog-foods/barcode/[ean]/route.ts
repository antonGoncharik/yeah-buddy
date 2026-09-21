import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
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

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

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
}
