import { redirect } from "next/navigation";

import { LumpMacrosCreate } from "@/components/day/lump-macros-screen";
import { AppHeader } from "@/components/layout/app-header";
import {
  isIsoDate,
  isWritableDayDate,
  todayHomeHref,
  withDateQuery,
} from "@/lib/day/dates";
import { resolveRequestToday } from "@/lib/day/writable";

export default async function AddLumpMealItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ mealId: string }>;
  searchParams: Promise<{ date?: string | string[]; name?: string | string[] }>;
}) {
  const { mealId } = await params;
  const query = await searchParams;
  const date = readDate(query.date);
  const name = readName(query.name);
  const today = await resolveRequestToday();
  const homeHref = todayHomeHref(date, today);
  const backHref = withDateQuery(`/today/meals/${mealId}/add`, date, today);

  if (date && !isWritableDayDate(date, today)) {
    redirect(homeHref);
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Записать" backHref={backHref} />
      <LumpMacrosCreate
        mealId={mealId}
        initialName={name}
        backHref={backHref}
        doneHref={homeHref}
      />
    </div>
  );
}

function readDate(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || !isIsoDate(value)) {
    return null;
  }
  return value;
}

function readName(value: string | string[] | undefined): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}
