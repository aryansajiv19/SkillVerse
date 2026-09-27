import { defineConfig, devices } from "@playwright/test";

const PORT = 8086;
const CI = !!process.env.CI;

// Needs a running Supabase (local: `npx supabase start`) and .env.local pointing at it.
// Playwright gives every test its own browser context, so every test is a brand-new guest.
export default defineConfig({
  testDir: "e2e",
  // Real backend round trips plus CPU-rendered WebGL on CI runners: give both room.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
  },
});
