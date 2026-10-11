import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const runE2e = process.env.E2E_SMOKE === "1";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: 0,
  timeout: 120_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
  },
  webServer: runE2e
    ? {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          ...process.env,
          NODE_ENV: "development",
        },
      }
    : undefined,
});
