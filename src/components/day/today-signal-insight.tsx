"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api-cache";

export function TodaySignalInsight() {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchJson("/api/user-signals?range=14")
      .then((data) => {
        if (
          !cancelled &&
          data &&
          typeof data === "object" &&
          "dayInsight" in data &&
          typeof (data as { dayInsight: unknown }).dayInsight === "string"
        ) {
          setLine((data as { dayInsight: string }).dayInsight);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLine(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!line) {
    return null;
  }

  return (
    <p className="card-surface px-4 py-3 text-sm leading-snug text-muted-foreground">
      {line}
    </p>
  );
}
