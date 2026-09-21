import {
  DumbbellDoodle,
  PlateDoodle,
  QrDoodle,
} from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { ShareQr } from "@/components/share/share-qr";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";
import {
  OPEN_VIA_BOT_CTA,
  OPEN_VIA_BOT_LEAD,
  OPEN_VIA_BOT_POINTS,
  OPEN_VIA_BOT_QR_CAPTION,
} from "@/lib/messages";
import { isTelegramMeUrl } from "@/lib/telegram/share-url";
import { cn } from "@/lib/utils";

const POINT_ICONS = {
  Еда: <PlateDoodle />,
  Зал: <DumbbellDoodle />,
  Штрих: <QrDoodle />,
} as const;

export function OutsideTelegramScreen({ openUrl }: { openUrl: string | null }) {
  const showQr = openUrl != null && isTelegramMeUrl(openUrl);

  return (
    <div className="animate-rise flex w-full flex-col items-center gap-5">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {OPEN_VIA_BOT_LEAD}
        </p>
      </header>

      <ul className="card-surface w-full divide-y divide-border/70 px-5 py-1 text-left">
        {OPEN_VIA_BOT_POINTS.map((point) => (
          <li key={point.title} className="flex items-center gap-3 py-3">
            <MarkBadge className="size-9 rounded-xl">
              {POINT_ICONS[point.title]}
            </MarkBadge>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-medium">{point.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {point.body}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {showQr && openUrl ? (
        <ShareQr url={openUrl} caption={OPEN_VIA_BOT_QR_CAPTION} compact />
      ) : null}

      {openUrl ? (
        <a
          href={openUrl}
          className={cn(buttonVariants(), "h-14 w-full text-lg")}
        >
          {OPEN_VIA_BOT_CTA}
        </a>
      ) : null}
    </div>
  );
}
