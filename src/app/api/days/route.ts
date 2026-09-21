import type { NextResponse } from "next/server";
import { z } from "zod";
import { reviewCtaReady } from "@/lib/ai/coverage";
import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { calendarDateInTimeZone, shiftIsoDate } from "@/lib/day/dates";
import { dayHasFood } from "@/lib/day/week";
import {
  createDayFromTemplate,
  DayConflictError,
  getDayByDate,
  getLastBodyWeight,
  getUserCalendarToday,
  isDayWritable,
  isIsoDate,
  listBodyWeightsInRange,
  listCopyDays,
  listDaysInRange,
  PastDayLockedError,
  recipeFromTemplate,
  writeStateFromDay,
  yesterdayCopyHint,
} from "@/lib/days";
import {
  PROTEIN_STREAK_WINDOW,
  priorProteinHits,
  STEADY_WEIGHT_DAYS,
  steadyWeightLine,
} from "@/lib/flavor";
import { getActiveMealTemplate } from "@/lib/meal-templates";
import { CHECK_FIELDS } from "@/lib/messages";
import { listNamedMealHints } from "@/lib/named-meal/store";
import { inRetentionTail, onboardingAgeDays } from "@/lib/retention";
import { getUserSettings } from "@/lib/settings";
import { DEFAULT_TIMEZONE } from "@/lib/telegram/reminder-clock";
import { countCompletedSessions } from "@/lib/workout/sessions";

const createSchema = z.object({
  date: z.string().optional(),
  dayType: z.enum(["rest", "training"]),
});

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!isIsoDate(date)) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const settings = await getUserSettings(auth.session.userId);
    const timeZone = settings?.timezone ?? DEFAULT_TIMEZONE;
    const today = calendarDateInTimeZone(timeZone);
    const ageDays = onboardingAgeDays(
      settings?.onboarding_completed_at,
      today,
      timeZone,
    );
    const streakStart = shiftIsoDate(date, 1 - PROTEIN_STREAK_WINDOW);
    const viewingToday = date === today;
    const [
      day,
      yesterday,
      lastBodyWeight,
      copyDays,
      namedMeals,
      rest,
      training,
      recentWeights,
      recentDays,
      gymCount,
    ] = await Promise.all([
      getDayByDate(auth.session.userId, date),
      yesterdayCopyHint(auth.session.userId, date),
      getLastBodyWeight(auth.session.userId, date),
      listCopyDays(auth.session.userId, date),
      listNamedMealHints(auth.session.userId),
      getActiveMealTemplate(auth.session.userId, "rest"),
      getActiveMealTemplate(auth.session.userId, "training"),
      listBodyWeightsInRange(
        auth.session.userId,
        shiftIsoDate(date, 1 - STEADY_WEIGHT_DAYS),
        date,
      ),
      listDaysInRange(auth.session.userId, streakStart, date),
      viewingToday
        ? countCompletedSessions(auth.session.userId, {
            start: streakStart,
            end: today,
          })
        : Promise.resolve(0),
    ]);

    return jsonOk({
      day,
      today,
      writable: isDayWritable(date, today, writeStateFromDay(day)),
      yesterdayExists: yesterday.exists,
      yesterdayMealTypes: yesterday.mealTypes,
      lastBodyWeight,
      weightSteady:
        steadyWeightLine(
          new Map(recentWeights.map((row) => [row.date, row.weight])),
          date,
        ) != null,
      priorProteinHits: priorProteinHits(recentDays, date),
      retentionTail: viewingToday && inRetentionTail(ageDays),
      reviewReady:
        viewingToday &&
        reviewCtaReady({
          loggedDays: recentDays.filter(dayHasFood).length,
          completedWorkouts: gymCount,
          ageDays,
        }),
      copyDays,
      namedMeals,
      recipes: {
        rest: recipeFromTemplate(rest),
        training: recipeFromTemplate(training),
      },
    });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(
    request,
    createSchema,
    (data) => data.date == null || isIsoDate(data.date),
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const today = await getUserCalendarToday(auth.session.userId);
    const date =
      parsed.data.date && isIsoDate(parsed.data.date)
        ? parsed.data.date
        : today;
    const day = await createDayFromTemplate(
      auth.session.userId,
      date,
      parsed.data.dayType,
    );
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      (err) =>
        err instanceof DayConflictError
          ? jsonError(err.message, 409, { code: err.code })
          : null,
    ]);
  }
}
