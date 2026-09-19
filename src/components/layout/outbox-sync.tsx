"use client";

import { useEffect, useState } from "react";

import { PENDING_WRITES } from "@/lib/messages";
import { listOutbox, subscribeOutbox } from "@/lib/outbox";
import { flushOutbox } from "@/lib/outbox-flush";

export function OutboxSync() {
  const [pending, setPending] = useState(() => listOutbox().length > 0);

  useEffect(() => {
    setPending(listOutbox().length > 0);
    return subscribeOutbox((ops) => setPending(ops.length > 0));
  }, []);

  useEffect(() => {
    void flushOutbox();

    function onOnline() {
      void flushOutbox();
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        void flushOutbox();
      }
    }

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!pending) {
    return null;
  }

  return (
    <>
      <div className="h-11" aria-hidden />
      <p className="app-fixed-bottom pointer-events-none fixed inset-x-0 z-[11] mx-auto max-w-lg px-4 pb-[var(--app-nav-clearance)] text-center text-sm text-muted-foreground">
        <span className="mb-1 block rounded-xl bg-background/95 py-2">
          {PENDING_WRITES}
        </span>
      </p>
    </>
  );
}
