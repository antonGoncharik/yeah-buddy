import type { SessionCloseKind } from "@/lib/types";
import { sessionCloseKindShort } from "@/lib/workout/session-format";

export function SessionCloseTrail({
  summary,
  closeKind,
}: {
  summary: string | null;
  closeKind: SessionCloseKind | null;
}) {
  const kind = closeKind ? sessionCloseKindShort(closeKind) : null;
  if (!kind && !summary) {
    return null;
  }
  if (!kind) {
    return (
      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
        {summary}
      </span>
    );
  }

  return (
    <span className="mt-0.5 flex min-w-0 items-baseline gap-1.5 text-sm text-muted-foreground">
      <span className="shrink-0">{kind}</span>
      {summary ? <span className="min-w-0 truncate">· {summary}</span> : null}
    </span>
  );
}
