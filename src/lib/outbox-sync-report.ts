import * as Sentry from "@sentry/nextjs";

import { trackClientEvent } from "@/lib/analytics/client";
import type { OutboxOp } from "@/lib/outbox";

export function reportOutboxSyncFailed(
  op: OutboxOp,
  status: number | null,
): void {
  void trackClientEvent("sync_failed", {
    kind: op.method,
    status,
    url: op.url.slice(0, 200),
  });

  Sentry.withScope((scope) => {
    scope.setTag("outbox_method", op.method);
    if (status != null) {
      scope.setTag("http_status", String(status));
    }
    scope.setExtra("op_url", op.url);
    Sentry.captureMessage("outbox sync failed", "warning");
  });
}
