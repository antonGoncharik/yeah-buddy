import { ApiError } from "@/lib/api-cache";
import { LOAD_FAILED, YESTERDAY_MISSING } from "@/lib/messages";
import { isMealType } from "@/lib/nutrition";
import type { NamedMealHint } from "@/lib/types";

type ConfirmFn = (options: {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
}) => Promise<boolean>;

export async function postCopyWithConflict(
  post: (replaceFlag: boolean) => Promise<unknown>,
  replace: boolean,
  confirm: ConfirmFn,
  fallbackMessage: string,
): Promise<{ data: unknown } | null> {
  try {
    return { data: await post(replace) };
  } catch (caught) {
    if (!(caught instanceof ApiError) || caught.status !== 409) {
      throw caught;
    }
    const ok = await confirm({
      message:
        caught.message === LOAD_FAILED ? fallbackMessage : caught.message,
      confirmLabel: "Заменить",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return null;
    }
    return { data: await post(true) };
  }
}

export function readNamedMealHint(data: unknown): NamedMealHint | null {
  if (!data || typeof data !== "object" || !("namedMeal" in data)) {
    return null;
  }
  const value = data.namedMeal;
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as {
    id?: unknown;
    name?: unknown;
    meal_type?: unknown;
  };
  if (
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    !isMealType(row.meal_type)
  ) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    meal_type: row.meal_type,
  };
}

export function copyNotFoundMessage(caught: unknown): string | null {
  if (!(caught instanceof ApiError) || caught.status !== 404) {
    return null;
  }
  return caught.message === LOAD_FAILED ? YESTERDAY_MISSING : caught.message;
}
