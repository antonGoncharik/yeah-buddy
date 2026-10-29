export function partialFormSaveLabel(
  busy: boolean,
  filledCount: number,
  totalCount: number,
  labels: { saving: string; partial: string; all: string },
): string {
  if (busy) {
    return labels.saving;
  }
  if (filledCount > 0 && filledCount < totalCount) {
    return labels.partial;
  }
  return labels.all;
}
