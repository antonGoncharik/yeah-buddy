"use client";

import {
  CoachDoodle,
  FriendsDoodle,
  LinkDoodle,
  QrDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { SectionHeading } from "@/components/layout/section-heading";
import { SettingsHomeScreenRow } from "@/components/settings/settings-home-screen-row";
import {
  BOT_INVITE_HINT,
  BOT_INVITE_LABEL,
  INVITE_HREF,
} from "@/lib/share/invite";
import { PACKS_LABEL } from "@/lib/workout/labels";

export function SettingsAccessSection() {
  return (
    <section className="flex flex-col gap-2">
      <SectionHeading title="Доступ" />
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
