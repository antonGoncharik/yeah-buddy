"use client";

import { useEffect, useState } from "react";

import { OFFLINE_CAPTURE_HINT } from "@/lib/messages";
import { isOffline } from "@/lib/offline";

export function OfflineCaptureHint() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(isOffline());
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <p
      role="status"
      className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
    >
      {OFFLINE_CAPTURE_HINT}
    </p>
  );
}
