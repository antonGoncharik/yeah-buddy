import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function FoldChevron({ open }: { open: boolean }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
      <ChevronDown
        aria-hidden
        className={cn(
          "size-4 text-muted-foreground transition-transform duration-200",
          open && "rotate-180",
        )}
      />
    </span>
  );
}
