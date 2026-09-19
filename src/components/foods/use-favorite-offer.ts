"use client";

import { useCallback, useEffect, useState } from "react";

import {
  dismissFavoriteOffer,
  type FavoriteOffer,
  pickFavoriteOffer,
  readFavoriteOfferDismissed,
} from "@/lib/food/favorite-offer";

export function useFavoriteOffer(offers: readonly FavoriteOffer[]): {
  offer: FavoriteOffer | null;
  dismiss: () => void;
  refresh: () => void;
} {
  const [dismissed, setDismissed] = useState<string[] | null>(null);

  const refresh = useCallback(() => {
    setDismissed(readFavoriteOfferDismissed());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const offer = dismissed == null ? null : pickFavoriteOffer(offers, dismissed);

  const dismiss = useCallback(() => {
    if (!offer) {
      return;
    }
    setDismissed(dismissFavoriteOffer(offer.foodId));
  }, [offer]);

  return { offer, dismiss, refresh };
}
