"use client";

import { Button } from "@/components/ui/button";
import { saveDayTemplateLabel } from "@/lib/messages";

export function SaveDayTemplateButton({
  isTrainingDay,
  busy,
  onSave,
}: {
  isTrainingDay: boolean;
  busy: boolean;
  onSave: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full text-base"
      disabled={busy}
      onClick={onSave}
    >
      {saveDayTemplateLabel(isTrainingDay)}
    </Button>
  );
}
