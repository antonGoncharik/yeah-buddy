import { expect, test } from "@playwright/test";

const enabled = process.env.E2E_SMOKE === "1";

test.describe("core diary smoke", () => {
  test.skip(!enabled, "Set E2E_SMOKE=1 with Supabase env and npm run e2e");

  test("dev auth, first food, session complete, outbox flush", async ({
    page,
  }) => {
    const request = page.request;
    const auth = await request.post("/api/auth/dev");
    expect(auth.ok()).toBeTruthy();

    const settingsRes = await request.get("/api/settings");
    expect(settingsRes.ok()).toBeTruthy();
    const settingsBody = (await settingsRes.json()) as {
      onboarding_completed_at?: string | null;
      gym_enabled?: boolean;
    };

    if (!settingsBody.onboarding_completed_at) {
      const onboard = await request.post("/api/onboarding", {
        data: {
          circle: "empty",
          gym_enabled: false,
          sex: "male",
          goal: "keep",
          body_weight: 80,
        },
      });
      expect(onboard.ok()).toBeTruthy();
    }

    const settingsAfter = (await (
      await request.get("/api/settings")
    ).json()) as { timezone?: string | null };
    const timeZone = settingsAfter.timezone ?? "UTC";
    const today = new Date().toLocaleDateString("en-CA", { timeZone });

    const dayCreate = await request.post("/api/days", {
      data: { dayType: "rest" },
    });
    expect(dayCreate.ok() || dayCreate.status() === 409).toBeTruthy();

    const daysRes = await request.get(`/api/days?date=${today}`);
    expect(daysRes.ok()).toBeTruthy();
    const daysBody = (await daysRes.json()) as {
      day?: { date: string; meals?: Array<{ id: string }> };
    };
    const mealId = daysBody.day?.meals?.[0]?.id;
    expect(mealId).toBeTruthy();

    const foodRes = await request.post(`/api/meals/${mealId}/items`, {
      data: {
        name: "e2e smoke",
        protein: 20,
        fat: 5,
        carbs: 30,
      },
    });
    expect(foodRes.ok()).toBeTruthy();

    if (settingsBody.gym_enabled) {
      const sessionsRes = await request.get(
        `/api/sessions?date=${daysBody.day?.date ?? ""}`,
      );
      if (sessionsRes.ok()) {
        const sessionsBody = (await sessionsRes.json()) as {
          session?: { id: string; status: string } | null;
        };
        const sessionId = sessionsBody.session?.id;
        if (sessionId && sessionsBody.session?.status !== "completed") {
          const complete = await request.post(
            `/api/sessions/${sessionId}/complete`,
            { data: { feel: "ok" } },
          );
          expect(complete.ok()).toBeTruthy();
        }
      }
    }

    await page.goto("/today");
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 30_000 });

    const daysCacheUrl = `/api/days?date=${today}`;
    await page.evaluate(
      ({ targetMealId, daysCacheUrl: cacheUrl }) => {
        const key = "yb.v1:outbox";
        localStorage.setItem(
          key,
          JSON.stringify([
            {
              id: "e2e-smoke",
              at: Date.now(),
              method: "POST",
              url: `/api/meals/${targetMealId}/items`,
              body: { name: "e2e offline", protein: 10, fat: 2, carbs: 12 },
              cacheUrls: [cacheUrl],
            },
          ]),
        );
      },
      { targetMealId: mealId, daysCacheUrl },
    );
    await page.reload();
    await expect
      .poll(
        async () => {
          const raw = await page.evaluate(() =>
            localStorage.getItem("yb.v1:outbox"),
          );
          return raw === null || raw === "[]";
        },
        { timeout: 20_000 },
      )
      .toBe(true);
  });
});
