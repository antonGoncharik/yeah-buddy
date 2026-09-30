import { BarbellDoodle } from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { ShareQr } from "@/components/share/share-qr";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";
import {
  BARBELL_PAGE_BACK,
  BARBELL_PLAY_CTA,
  BARBELL_PUBLIC_LEAD,
  BARBELL_PUBLIC_POINTS,
  BARBELL_QR_CAPTION,
} from "@/lib/messages";
import { publicBarbellCard } from "@/lib/share/barbell-public";
import { isTelegramMeUrl } from "@/lib/telegram/share-url";
import { cn } from "@/lib/utils";

export function PublicBarbellScreen({ openUrl }: { openUrl: string | null }) {
  const card = publicBarbellCard();
  const showQr = openUrl != null && isTelegramMeUrl(openUrl);

  return (
    <div className="animate-rise flex w-full flex-col items-center gap-6">
      <a
        href="/"
        className="self-start text-sm font-medium text-muted-foreground"
      >
        {BARBELL_PAGE_BACK}
      </a>

      <header className="flex w-full flex-col items-center gap-3 text-center">
        <MarkBadge className="size-14 rounded-2xl">
          <BarbellDoodle />
        </MarkBadge>
        <p className="text-sm font-medium text-muted-foreground">{APP_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{card.name}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {BARBELL_PUBLIC_LEAD}
        </p>
      </header>

      <ul className="card-surface w-full divide-y divide-border/70 px-5 py-1 text-left">
        {BARBELL_PUBLIC_POINTS.map((point) => (
          <li key={point.title} className="py-3">
            <span className="block text-lg font-medium">{point.title}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {point.body}
            </span>
          </li>
        ))}
      </ul>

      {openUrl ? (
        <a
          href={openUrl}
          className={cn(buttonVariants(), "h-14 w-full text-lg")}
        >
          {BARBELL_PLAY_CTA}
        </a>
      ) : null}

      {showQr && openUrl ? (
        <ShareQr url={openUrl} caption={BARBELL_QR_CAPTION} compact />
      ) : null}
    </div>
  );
}
