"use client";

import { Button } from "@/components/ui/button";
import { STARTER_DAY_CLEAR_LABEL, STARTER_DAY_NOTE } from "@/lib/messages";

export function StarterDayNote({
  busy,
  onClear,
}: {
  busy: boolean;
  onClear: () => void;
}) {
  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <p className="text-base leading-relaxed text-muted-foreground">
        {STARTER_DAY_NOTE}
      </p>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full text-base"
        disabled={busy}
        onClick={onClear}
      >
        {STARTER_DAY_CLEAR_LABEL}
      </Button>
    </section>
  );
}
