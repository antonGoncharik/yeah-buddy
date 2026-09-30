export const BARBELL_START_PAYLOAD = "barbell";

export function parseBarbellStartPayload(
  value: string | null | undefined,
): boolean {
  const trimmed = value?.trim().toLowerCase();
  return trimmed === BARBELL_START_PAYLOAD;
}
