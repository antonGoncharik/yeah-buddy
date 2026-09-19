"use client";

import { Button } from "@/components/ui/button";
import { FAVORITE_OFFER_HINT, favoriteOfferLine } from "@/lib/flavor";
import type { FavoriteOffer } from "@/lib/food/favorite-offer";
import { haptic } from "@/lib/telegram/haptic";

export function FavoriteOfferCard({
  offer,
  busy = false,
  onAccept,
  onDismiss,
}: {
  offer: FavoriteOffer;
  busy?: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="text-base font-medium">{favoriteOfferLine(offer.name)}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {FAVORITE_OFFER_HINT}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="h-12 text-base"
          disabled={busy}
          onClick={() => {
            haptic("tick");
            onAccept();
          }}
        >
          В избранное
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-base"
          disabled={busy}
          onClick={() => {
            haptic("tick");
            onDismiss();
          }}
        >
          Не сейчас
        </Button>
      </div>
    </section>
  );
}
