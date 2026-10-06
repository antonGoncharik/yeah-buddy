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
      variant="ghost"
      className="h-10 w-full text-sm text-muted-foreground"
      disabled={busy}
      onClick={onSave}
    >
      {saveDayTemplateLabel(isTrainingDay)}
    </Button>
  );
}
