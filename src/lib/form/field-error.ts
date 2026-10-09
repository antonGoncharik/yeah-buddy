import { cn } from "@/lib/utils";

/** Inline validation and field errors — legible on small screens. */
export const FIELD_ERROR_CLASS = "text-base leading-snug text-destructive";

export function fieldErrorClassName(extra?: string, center = false): string {
  return cn(center && "text-center", FIELD_ERROR_CLASS, extra);
}
