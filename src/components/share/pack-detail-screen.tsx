"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { PackMealsPreview } from "@/components/share/pack-meals-preview";
import { PackWorkoutsPreview } from "@/components/share/pack-workouts-preview";
import { usePackDetailScreen } from "@/components/share/use-pack-detail-screen";
import { Button } from "@/components/ui/button";
import { packBackHref } from "@/lib/share/pending";
import type { SharePackDetail } from "@/lib/share/types";

export function PackDetailScreen({ token }: { token: string }) {
  const {
    pack,
    loading,
    error,
    busy,
    copied,
    from,
    ownLive,
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

      <div className="flex flex-col gap-4 px-4 pb-44">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !pack ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && pack ? (
          <>
            <p className="animate-rise text-base text-muted-foreground">
              {packSubtitle(pack)}
            </p>

            {pack.kind === "meals" && pack.meals ? (
              <PackMealsPreview pack={pack} />
            ) : null}

            {pack.kind === "workouts" && pack.workouts ? (
              <PackWorkoutsPreview pack={pack} />
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {copied ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Ссылка скопирована.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {!loading && pack ? (
        <StickyActions>
          {ownLive ? (
            <Button
              className="h-14 text-lg"
              disabled={busy}
              onClick={() => void onShare()}
            >
              Поделиться
            </Button>
          ) : null}
          <Button
            className="h-14 text-lg"
            variant={ownLive ? "secondary" : "default"}
            disabled={busy}
            onClick={() => void onApply()}
          >
            {busy ? "Сохранение…" : "Поставить себе"}
          </Button>
          {ownLive ? (
            <Button
              variant="ghost"
              className="h-12 text-base"
              disabled={busy}
              onClick={() => void onRevoke()}
            >
              Убрать ссылку
            </Button>
          ) : null}
        </StickyActions>
      ) : null}
    </div>
  );
}

function packSubtitle(pack: SharePackDetail): string {
  if (pack.revoked) {
    return "Ссылка выключена. Поставить себе всё ещё можно.";
  }
  if (pack.mine) {
    return pack.kind === "meals"
      ? "Еда на день и цели по белкам, жирам и углеводам. Записи из дневника в ссылку не попадают."
      : "Список тренировок и план подходов. Твои рабочие веса в ссылку не попадают.";
  }
  const fromOwner = pack.owner_name ? `От ${pack.owner_name}. ` : "";
  if (pack.saved) {
    return pack.kind === "meals"
      ? `${fromOwner}Сохранено. Если поставить — еда на день и цели станут как в ссылке.`
      : `${fromOwner}Сохранено. Если поставить — программа тренировок станет как в ссылке.`;
  }
  return pack.kind === "meals"
    ? `${fromOwner}Еда на день. Можно поставить себе.`
    : `${fromOwner}Программа тренировок. Можно поставить себе.`;
}
