"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { ApiError, mutateJson } from "@/lib/api-cache";
import { ensureTodayDay } from "@/lib/day/ensure-today";
import { LOAD_FAILED, PACK_NOT_FOUND } from "@/lib/messages";
import {
  DAY_TEMPLATE_TITLES,
  formatKcal,
  formatMacro,
  getMealLabel,
} from "@/lib/nutrition";
import { packShareText, shareOrCopyLink } from "@/lib/share/client";
import { readSharePackPayload } from "@/lib/share/map";
import {
  dismissPendingPackToken,
  packBackHref,
  packPath,
  parsePackBackFrom,
} from "@/lib/share/pending";
import type { SharePackDetail } from "@/lib/share/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function PackDetailScreen({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  const from = parsePackBackFrom(searchParams.get("from"));
  const [pack, setPack] = useState<SharePackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const savingCopy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mutateJson(`/api/packs/${token}`);
      const loaded = readSharePackPayload(data);
      if (!loaded) {
        throw new Error(LOAD_FAILED);
      }
      setPack(loaded);
      if (loaded.mine || loaded.saved) {
        dismissPendingPackToken(token);
      }
    } catch (caught) {
      setPack(null);
      if (caught instanceof ApiError && caught.status === 404) {
        dismissPendingPackToken(token);
        setError(PACK_NOT_FOUND);
        return;
      }
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pack || pack.mine || pack.saved || savingCopy.current) {
      return;
    }

    savingCopy.current = true;
    void (async () => {
      try {
        const data = await mutateJson(`/api/packs/${pack.token}/save`, {
          method: "POST",
        });
        const loaded = readSharePackPayload(data);
        if (!loaded) {
          savingCopy.current = false;
          return;
        }
        dismissPendingPackToken(token);
        setPack(loaded);
        if (loaded.token !== token) {
          router.replace(packPath(loaded.token, from ?? undefined));
        }
      } catch {
        savingCopy.current = false;
      }
    })();
  }, [from, pack, router, token]);

  async function onApply() {
    if (!pack) {
      return;
    }
    const ok = await confirm({
      message:
        pack.kind === "meals"
          ? "Шаблоны еды и цели белка, жира и углеводов станут как в ссылке. Уже записанные дни не тронем."
          : "Очередь и схема весов станут как в ссылке. Рабочие веса твои. Свои тренировки отложатся.",
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await mutateJson(`/api/packs/${pack.token}/apply`, { method: "POST" });
      dismissPendingPackToken(token);
      if (pack.kind === "meals") {
        try {
          await ensureTodayDay("rest");
        } catch {
          // still open today
        }
        router.replace("/today");
        return;
      }
      router.replace("/workouts");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (!pack) {
      return;
    }
    const url = pack.share_url ?? window.location.href;
    try {
      const result = await shareOrCopyLink(url, packShareText(pack.kind));
      setCopied(result === "copied");
    } catch {
      setError(LOAD_FAILED);
    }
  }

  async function onRevoke() {
    if (!pack) {
      return;
    }
    const ok = await confirm({
      message: "Убрать ссылку? У тебя копия останется, у друзей — нет.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = await mutateJson(`/api/packs/${pack.token}/revoke`, {
        method: "POST",
      });
      const loaded = readSharePackPayload(data);
      if (loaded) {
        setPack(loaded);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  const ownLive = Boolean(pack?.mine && !pack.revoked);

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
              <MealsPreview pack={pack} />
            ) : null}

            {pack.kind === "workouts" && pack.workouts ? (
              <WorkoutsPreview pack={pack} />
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
    return "Ссылка выключена. Поставить себе ещё можно.";
  }
  if (pack.mine) {
    return pack.kind === "meals"
      ? "Снимок еды на день и целей белка, жира и углеводов. Дневник не отдаём."
      : "Снимок очереди и схемы весов. Рабочие веса не отдаём.";
  }
  const fromOwner = pack.owner_name ? `От ${pack.owner_name}. ` : "";
  if (pack.saved) {
    return pack.kind === "meals"
      ? `${fromOwner}Сохранено. Можно поставить — шаблоны и цели станут как в ссылке.`
      : `${fromOwner}Сохранено. Можно поставить — очередь станет как в ссылке.`;
  }
  return pack.kind === "meals"
    ? `${fromOwner}Еда на день. Можно поставить себе.`
    : `${fromOwner}Тренировки по очереди. Можно поставить себе.`;
}

function MealsPreview({ pack }: { pack: SharePackDetail }) {
  const meals = pack.meals;
  if (!meals) {
    return null;
  }

  return (
    <>
      <section className="card-surface animate-rise flex flex-col gap-2 px-5 py-4">
        <h2 className="text-lg font-semibold">Цели</h2>
        <p className="text-sm text-muted-foreground">
          Отдых: белок {formatMacro(meals.goals.rest_protein)} · жир{" "}
          {formatMacro(meals.goals.rest_fat)} · углеводы{" "}
          {formatMacro(meals.goals.rest_carbs)}
        </p>
        <p className="text-sm text-muted-foreground">
          Зал: белок {formatMacro(meals.goals.training_protein)} · жир{" "}
          {formatMacro(meals.goals.training_fat)} · углеводы{" "}
          {formatMacro(meals.goals.training_carbs)}
        </p>
      </section>

      {meals.days.map((day) => (
        <section
          key={day.day_type}
          className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
        >
          <div>
            <h2 className="text-lg font-semibold">
              {DAY_TEMPLATE_TITLES[day.day_type]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatKcal(day.kcal)} ккал · белок {formatMacro(day.protein)} ·
              жир {formatMacro(day.fat)} · углеводы {formatMacro(day.carbs)}
            </p>
          </div>
          {day.meals.map((meal) => (
            <div key={meal.meal_type} className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {getMealLabel(meal.meal_type)}
              </p>
              {meal.items.map((item) => (
                <p
                  key={`${meal.meal_type}-${item.name}-${item.grams}`}
                  className="text-sm text-muted-foreground"
                >
                  {item.name} · {item.grams} г
                </p>
              ))}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

function WorkoutsPreview({ pack }: { pack: SharePackDetail }) {
  const workouts = pack.workouts;
  if (!workouts) {
    return null;
  }

  return (
    <>
      <p className="px-1 text-sm text-muted-foreground">
        Схема весов {workouts.formula_hint}
      </p>
      {workouts.days.map((day) => (
        <section
          key={day.name}
          className="card-surface animate-rise flex flex-col gap-2 px-5 py-4"
        >
          <h2 className="text-lg font-semibold">{day.name}</h2>
          <p className="text-sm text-muted-foreground">
            {WORKOUT_KIND_LABELS[day.kind]}
          </p>
          <p className="text-sm leading-relaxed">{day.exercises.join(" · ")}</p>
        </section>
      ))}
    </>
  );
}
