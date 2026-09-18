"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { PackMealsPreview } from "@/components/share/pack-meals-preview";
import { PackWorkoutsPreview } from "@/components/share/pack-workouts-preview";
import { ShareQr } from "@/components/share/share-qr";
import { usePackDetailScreen } from "@/components/share/use-pack-detail-screen";
import { Button } from "@/components/ui/button";
import { packBackHref } from "@/lib/share/pending";
import type { SharePackDetail } from "@/lib/share/types";
import { isTelegramMeUrl } from "@/lib/telegram/share-url";
import { cn } from "@/lib/utils";

export function PackDetailScreen({ token }: { token: string }) {
  const {
    pack,
    loading,
    error,
    busy,
    copied,
    from,
    ownLive,
    canApply,
    load,
    onApply,
    onShare,
    onRevoke,
  } = usePackDetailScreen(token);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={pack?.title ?? "Ссылка"}
        backHref={packBackHref(from)}
      />

      <div
        className={cn(
          "flex flex-col gap-4 px-4",
          ownLive ? "pb-8" : "pb-[var(--app-field-scroll-pad)]",
        )}
      >
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !pack ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && pack ? (
          <>
            <p className="animate-rise text-base text-muted-foreground">
              {packSubtitle(pack)}
            </p>

            {ownLive && pack.share_url && isTelegramMeUrl(pack.share_url) ? (
              <ShareQr url={pack.share_url} caption={packQrCaption(pack)} />
            ) : null}

            {ownLive ? (
              <PackOwnerActions
                busy={busy}
                error={error}
                copied={copied}
                canApply={canApply}
                received={pack.received}
                onShare={() => void onShare()}
                onApply={() => void onApply()}
                onRevoke={() => void onRevoke()}
              />
            ) : null}

            {pack.kind === "meals" && pack.meals ? (
              <PackMealsPreview pack={pack} />
            ) : null}

            {pack.kind === "workouts" && pack.workouts ? (
              <PackWorkoutsPreview pack={pack} />
            ) : null}

            {ownLive ? null : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </>
        ) : null}
      </div>

      {!loading && pack && !ownLive && canApply ? (
        <StickyActions>
          <ApplyButton busy={busy} onApply={() => void onApply()} />
        </StickyActions>
      ) : null}
    </div>
  );
}

function PackOwnerActions({
  busy,
  error,
  copied,
  canApply,
  received,
  onShare,
  onApply,
  onRevoke,
}: {
  busy: boolean;
  error: string | null;
  copied: boolean;
  canApply: boolean;
  received: boolean;
  onShare: () => void;
  onApply: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="animate-rise flex flex-col gap-2">
      <Button className="h-14 text-lg" disabled={busy} onClick={onShare}>
        Поделиться
      </Button>
      {canApply ? (
        <ApplyButton busy={busy} onApply={onApply} variant="secondary" />
      ) : null}
      <Button
        variant="ghost"
        className="h-12 text-base"
        disabled={busy}
        onClick={onRevoke}
      >
        {received ? "Убрать из списка" : "Убрать ссылку"}
      </Button>
      {copied ? (
        <p className="animate-fade text-sm text-muted-foreground">
          Ссылка скопирована.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function ApplyButton({
  busy,
  onApply,
  variant = "default",
}: {
  busy: boolean;
  onApply: () => void;
  variant?: "default" | "secondary";
}) {
  return (
    <Button
      className="h-14 text-lg"
      variant={variant}
      disabled={busy}
      onClick={onApply}
    >
      {busy ? "Сохранение…" : "Поставить себе"}
    </Button>
  );
}

function packQrCaption(pack: SharePackDetail): string {
  return pack.kind === "meals"
    ? "Наведи камеру — откроется бот с едой на день."
    : "Наведи камеру — откроется бот с программой.";
}

function packSubtitle(pack: SharePackDetail): string {
  if (pack.mine && !pack.received) {
    return pack.kind === "meals"
      ? "Еда на день и цели по белкам, жирам и углеводам. Записи из дневника в ссылку не попадают."
      : "Список тренировок и план подходов. Твои рабочие веса в ссылку не попадают.";
  }
  const fromOwner = pack.owner_name ? `От ${pack.owner_name}. ` : "";
  if (pack.saved || pack.received) {
    return pack.kind === "meals"
      ? `${fromOwner}Сохранено. Если поставить — еда на день и цели станут как в ссылке.`
      : `${fromOwner}Сохранено. Если поставить — программа тренировок станет как в ссылке.`;
  }
  return pack.kind === "meals"
    ? `${fromOwner}Еда на день. Можно поставить себе.`
    : `${fromOwner}Программа тренировок. Можно поставить себе.`;
}
