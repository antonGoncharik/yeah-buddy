"use client";

import { usePathname } from "next/navigation";

import { WeekRouteLoading } from "@/components/day/week-loading-skeleton";
import { TodayRouteLoading } from "@/components/layout/today-loading-skeleton";
import { SettingsRouteLoading } from "@/components/settings/settings-loading-skeleton";
import { WorkoutsRouteLoading } from "@/components/workout/workouts-hub-skeleton";

export default function AppLoading() {
  const path = usePathname();
  if (path === "/workouts") {
    return <WorkoutsRouteLoading />;
  }
  if (path === "/settings") {
    return <SettingsRouteLoading />;
  }
  if (path === "/today/week") {
    return <WeekRouteLoading />;
  }
  if (path === "/today" || path === "") {
    return <TodayRouteLoading />;
  }
  return null;
}
