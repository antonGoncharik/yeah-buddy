/** A planned kilogram means the set is not bodyweight. */
export function setNeedsLoggedWeight(
  plannedWeight: number | null | undefined,
): boolean {
  return plannedWeight != null && plannedWeight > 0;
}

/**
 * Weight stored when a set is marked done.
 * "missing" when a loaded set still has no kilograms.
 */
export function completedSetWeight(input: {
  plannedWeight: number | null;
  typedWeight: number | null;
}): number | null | "missing" {
  const needs = setNeedsLoggedWeight(input.plannedWeight);
  const weight = input.typedWeight ?? (needs ? input.plannedWeight : null);
  if (needs && (weight == null || !(weight > 0))) {
    return "missing";
  }
  if (weight != null && !(weight > 0)) {
    return null;
  }
  return weight;
}
