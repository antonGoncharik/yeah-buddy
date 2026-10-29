"use client";

import {
  BookDoodle,
  MealDayDoodle,
  ProductDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { GUIDE_HINT, GUIDE_HREF, GUIDE_LABEL } from "@/lib/guide";
import { MEAL_TEMPLATES_LABEL } from "@/lib/workout/labels";

export function SettingsGuideNavRow() {
  return (
    <section className="flex flex-col gap-2">
      <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
        <NavRow
          href={GUIDE_HREF}
          title={GUIDE_LABEL}
          hint={GUIDE_HINT}
          icon={<BookDoodle />}
        />
      </div>
    </section>
  );
}

export function SettingsFoodNavRows() {
  return (
    <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
      <NavRow
        href="/settings/meals"
        title={MEAL_TEMPLATES_LABEL}
        hint="Что подставлять в новый день"
        icon={<MealDayDoodle />}
      />
      <NavRow
        href="/foods"
        title="Продукты"
        hint="Из них собирается еда на день"
        icon={<ProductDoodle />}
      />
    </div>
  );
}
