import { ShareQr } from "@/components/share/share-qr";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";
import {
  OPEN_VIA_BOT_CTA,
  PROGRAM_PAGE_BACK,
  PROGRAM_QR_CAPTION,
} from "@/lib/messages";
import {
  type FeaturedProgramId,
  featuredProgramPreset,
  featuredProgramView,
} from "@/lib/share/program-start";
import { isTelegramMeUrl } from "@/lib/telegram/share-url";
import { cn } from "@/lib/utils";

export function PublicProgramScreen({
  id,
  openUrl,
}: {
  id: FeaturedProgramId;
  openUrl: string | null;
}) {
  const preset = featuredProgramPreset(id);
  const program = featuredProgramView(preset, {
    share_url: openUrl,
    applied: false,
  });
  const showQr = openUrl != null && isTelegramMeUrl(openUrl);

  return (
    <div className="animate-rise flex w-full flex-col items-center gap-6">
      <a
        href="/"
        className="self-start text-sm font-medium text-muted-foreground"
      >
        {PROGRAM_PAGE_BACK}
      </a>

      <header className="flex w-full flex-col gap-2 text-left">
        <p className="text-sm font-medium text-muted-foreground">{APP_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {program.name}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {program.hint}
        </p>
      </header>

      <div className="flex w-full flex-col gap-3">
        {program.days.map((day) => (
          <section
            key={day.name}
            className="card-surface flex flex-col gap-2 px-5 py-4"
          >
            <h2 className="text-lg font-semibold">{day.name}</h2>
            <p className="text-sm leading-relaxed">{day.exercises}</p>
          </section>
        ))}
        {program.weeks ? (
          <p className="px-1 text-sm text-muted-foreground">
            Недели: {program.weeks.join(" → ")}
          </p>
        ) : null}
      </div>

      {openUrl ? (
        <a
          href={openUrl}
          className={cn(buttonVariants(), "h-14 w-full text-lg")}
        >
          {OPEN_VIA_BOT_CTA}
        </a>
      ) : null}

      {showQr && openUrl ? (
        <ShareQr url={openUrl} caption={PROGRAM_QR_CAPTION} compact />
      ) : null}
    </div>
  );
}
