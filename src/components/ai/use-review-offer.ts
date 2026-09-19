"use client";

import { useCallback, useEffect, useState } from "react";

import { isReviewOfferSeen, markReviewOfferSeen } from "@/lib/ai/review-seen";

export function useReviewOffer(ready: boolean): {
  show: boolean;
  open: () => void;
} {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(isReviewOfferSeen());
  }, []);

  const open = useCallback(() => {
    markReviewOfferSeen();
    setHidden(true);
  }, []);

  return { show: ready && !hidden, open };
}
