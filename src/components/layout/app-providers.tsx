import { cookies } from "next/headers";

import { ConfirmProvider } from "@/components/layout/confirm-provider";
import { DayBackdrop, DayMoodProvider } from "@/components/layout/day-mood";
import { DiaryDensityProvider } from "@/components/layout/diary-density-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TodayOrderProvider } from "@/components/layout/today-order-provider";
import { UndoToastProvider } from "@/components/layout/undo-toast-provider";
import { DIARY_DENSITY_COOKIE, parseDiaryDensity } from "@/lib/diary-density";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import { parseTodayOrder, TODAY_ORDER_COOKIE } from "@/lib/today-order";

export async function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  const density = parseDiaryDensity(
    cookieStore.get(DIARY_DENSITY_COOKIE)?.value,
  );
  const todayOrder = parseTodayOrder(
    cookieStore.get(TODAY_ORDER_COOKIE)?.value,
  );

  return (
    <ThemeProvider initialTheme={theme}>
      <DiaryDensityProvider initialDensity={density}>
        <TodayOrderProvider initialOrder={todayOrder}>
          <ConfirmProvider>
            <UndoToastProvider>
              <DayMoodProvider>
                <DayBackdrop />
                {children}
              </DayMoodProvider>
            </UndoToastProvider>
          </ConfirmProvider>
        </TodayOrderProvider>
      </DiaryDensityProvider>
    </ThemeProvider>
  );
}
