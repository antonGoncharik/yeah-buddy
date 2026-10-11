"use client";

import {
  BarbellDoodle,
  CoachDoodle,
  FriendsDoodle,
  LinkDoodle,
  QrDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { SectionHeading } from "@/components/layout/section-heading";
import { SettingsHomeScreenRow } from "@/components/settings/settings-home-screen-row";
import { SettingsHomeScreenTip } from "@/components/settings/settings-home-screen-tip";
import {
  BARBELL_GAME_HINT,
  BARBELL_GAME_HREF,
  BARBELL_GAME_TITLE,
} from "@/lib/share/barbell-daily";
import {
  BOT_INVITE_HINT,
  BOT_INVITE_LABEL,
  INVITE_HREF,
} from "@/lib/share/invite";
import { PACKS_LABEL } from "@/lib/workout/labels";

export function SettingsAccessSection({ gymEnabled }: { gymEnabled: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionHeading title="Доступ" />
      <SettingsHomeScreenTip />
      <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
        <NavRow
          href="/settings/coach"
          title="Тренер"
          hint="Смотрит дневник в реальном времени"
          icon={<CoachDoodle />}
        />
        <NavRow
          href="/settings/buddy"
          title="Пара"
          hint="Друг видит только экран сегодня: еда, белок, зал"
          icon={<FriendsDoodle />}
        />
        <NavRow
          href="/settings/packs"
          title={PACKS_LABEL}
          hint="Поделись едой на день, приёмом или программой"
          icon={<LinkDoodle />}
        />
        {gymEnabled ? (
          <NavRow
            href={BARBELL_GAME_HREF}
            title={BARBELL_GAME_TITLE}
            hint={BARBELL_GAME_HINT}
            icon={<BarbellDoodle />}
          />
        ) : null}
        <NavRow
          href={INVITE_HREF}
          title={BOT_INVITE_LABEL}
          hint={BOT_INVITE_HINT}
          icon={<QrDoodle />}
        />
        <SettingsHomeScreenRow />
      </div>
    </section>
  );
}
