import { AppHeader } from "@/components/layout/app-header";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  NavRowSkeleton,
  SwitchRowSkeleton,
  TextBone,
} from "@/components/layout/skeleton";

export function SettingsGoalsSkeleton() {
  return (
    <div className="card-surface px-5 py-4">
      <p className="text-base font-medium">
        <TextBone text="Отдых: 1 975 / Б 140,0" />
      </p>
      <p className="text-base font-medium">
        <TextBone text="Тренировка: 2 175 / Б 160,0" />
      </p>
    </div>
  );
}

export function SettingsMenuSkeleton() {
  return (
    <div className="card-surface divide-y divide-border/70 px-5 py-2">
      <NavRowSkeleton title="Еда" hint="Шаблон и свои продукты" />
      <NavRowSkeleton title="Зал" hint="Вкладка тренировок" />
      <NavRowSkeleton title="Люди" hint="Тренер, пара, паки" />
      <NavRowSkeleton title="Вид и бот" hint="Тема и напоминания" />
      <NavRowSkeleton title="Данные" hint="Пауза, экспорт, удаление" />
    </div>
  );
}

export function SettingsGymSkeleton() {
  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">
        <TextBone text="Тренировки" />
      </h2>
      <p className="text-sm">
        <TextBone text="Вкладка «Тренировки», переключатель дня и разборы. Программы и история останутся, если включишь снова." />
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/80 p-1">
        <div className="flex min-h-11 items-center justify-center rounded-xl px-1.5 py-2">
          <TextBone text="Только еда" className="text-sm" />
        </div>
        <div className="flex min-h-11 items-center justify-center rounded-xl bg-card px-1.5 py-2 shadow-sm">
          <TextBone text="Еда и зал" className="text-sm" />
        </div>
      </div>
    </section>
  );
}

export function SettingsRemindersSkeleton() {
  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">
        <TextBone text="Напоминания" />
      </h2>
      <p className="text-sm">
        <TextBone text="В первые две недели, если день пустой, бот напомнит днём и вечером." />
      </p>
      <div className="flex flex-col gap-3">
        <SwitchRowSkeleton
          label="Вечернее напоминание"
          hint="21:00, если день ещё открыт"
        />
        <SwitchRowSkeleton
          label="Недельный дайджест"
          hint="Понедельник, 9:00"
        />
        <SwitchRowSkeleton label="Месячный отчёт" hint="1-е число, 9:00" />
        <SwitchRowSkeleton
          label="Рекорды в чат"
          hint="После тренировки, если подход сильнее прошлого"
        />
      </div>
    </section>
  );
}

export function SettingsPrivacySkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <SectionHeading title="Данные и приватность" />
      <div className="card-surface px-5 py-4">
        <p className="text-base">
          <TextBone text="Скачай копию дневника или удали всё с сервера" />
        </p>
      </div>
    </section>
  );
}

export function SettingsRouteLoading() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Настройки" />
      <div
        role="status"
        aria-label="Загрузка настроек"
        aria-busy="true"
        className="flex flex-col gap-6 px-4 pb-4"
      >
        <SettingsGoalsSkeleton />
        <SettingsMenuSkeleton />
        <p className="sr-only">Загрузка…</p>
      </div>
    </div>
  );
}
