import { Suspense } from "react";

import { WeekScreen } from "@/components/day/week-screen";

export default function WeekPage() {
  return (
    <Suspense>
      <WeekScreen />
    </Suspense>
  );
}
