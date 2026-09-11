"use client";

import { Textarea } from "@/components/ui/textarea";

export function SessionNoteField({
  note,
  busy,
  canEditSets,
  onChange,
  onSave,
}: {
  note: string;
  busy: boolean;
  canEditSets: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        id="session-note"
        value={note}
        disabled={busy || !canEditSets}
        placeholder="Как прошло"
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          if (canEditSets) {
            onSave();
          }
        }}
        className="min-h-20 text-base"
        aria-label="Заметка"
      />
    </div>
  );
}
