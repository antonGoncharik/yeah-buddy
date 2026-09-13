"use client";

import { useCallback, useEffect, useState } from "react";

import type { GuideTip, GuideTipId } from "@/lib/guide";
import { guideTipById } from "@/lib/guide/copy";
import {
  dismissGuideTip,
  isTipDismissed,
  readGuideSeen,
} from "@/lib/guide/seen";

export function useGuideTip(id: GuideTipId): {
  tip: GuideTip | null;
  dismiss: () => void;
} {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(isTipDismissed(readGuideSeen(), id));
  }, [id]);

  const dismiss = useCallback(() => {
    dismissGuideTip(id);
    setHidden(true);
  }, [id]);

  const tip = hidden ? null : guideTipById(id);
  return { tip, dismiss };
}
