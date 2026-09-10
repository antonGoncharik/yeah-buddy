import type { NextResponse } from "next/server";

import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureStarterExercises } from "@/lib/workout/seed";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import {
  createTemplate,
  listTemplates,
  rotationPatchSchema,
  saveRotation,
  templateWriteSchema,
} from "@/lib/workout/templates";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    await ensureWorkoutSettings(auth.session.userId);
    await ensureStarterExercises(
      createSupabaseServerClient(),
      auth.session.userId,
    );
    const templates = await listTemplates(auth.session.userId);
    return jsonOk({ templates });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, templateWriteSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const template = await createTemplate(auth.session.userId, parsed.data);
    return jsonOk({ template });
  } catch (error) {
    return failRoute(error);
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, rotationPatchSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const templates = await saveRotation(auth.session.userId, parsed.data);
    return jsonOk({ templates });
  } catch (error) {
    return failRoute(error);
  }
}
