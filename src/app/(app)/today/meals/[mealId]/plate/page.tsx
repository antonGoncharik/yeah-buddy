import { redirect } from "next/navigation";

import { PlateScreen } from "@/components/day/plate-screen";
import { AppHeader } from "@/components/layout/app-header";
import {
  isIsoDate,
  isPastDayDate,
  todayHomeHref,
  withDateQuery,
} from "@/lib/day/dates";

export default async function PlateMealPage({
  params,
  searchParams,
}: {
  params: Promise<{ mealId: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { mealId } = await params;
  const query = await searchParams;
  const date = readDate(query.date);
  const homeHref = todayHomeHref(date);

  if (date && isPastDayDate(date)) {
    redirect(homeHref);
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="С тарелки"
        backHref={withDateQuery(`/today/meals/${mealId}/add`, date)}
      />
      <PlateScreen mealId={mealId} doneHref={homeHref} />
    </div>
  );
}

function readDate(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || !isIsoDate(value)) {
    return null;
  }

  return value;
}
