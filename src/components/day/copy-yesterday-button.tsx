"use client";

import { Button } from "@/components/ui/button";

export function CopyYesterdayButton({
  onCopy,
  busy,
}: {
  onCopy: () => void;
  busy: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-14 w-full text-lg"
      disabled={busy}
      onClick={onCopy}
    >
      Как вчера
    </Button>
  );
}
