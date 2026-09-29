"use client";

import { useEffect, useState } from "react";

import { FlavorNote } from "@/components/layout/flavor-note";
import { CIRCLE_OPENED_LINE } from "@/lib/workout/beats";
import {
  isCircleOpenedSeen,
  markCircleOpenedSeen,
} from "@/lib/workout/circle-opened-seen";

export function CircleOpenedNote({
  phaseId,
  open,
}: {
  phaseId: string | null;
  open: boolean;
}) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (!phaseId || !open || isCircleOpenedSeen(phaseId)) {
      setLine(null);
      return;
    }
    setLine(CIRCLE_OPENED_LINE);
    const timer = window.setTimeout(() => markCircleOpenedSeen(phaseId), 0);
    return () => window.clearTimeout(timer);
  }, [open, phaseId]);

  return <FlavorNote line={line} className="text-foreground" />;
}
