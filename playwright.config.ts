import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./support/global-setup.ts",
  globalTeardown: "./support/global-teardown.ts",
  fullyParallel: true,
  retries: 0,
  reporter: [
    ["./support/program-cleanup-reporter.ts"],
    ["html", { open: "never" }],
  ],
  timeout: 60_000,
  use: {
    baseURL: process.env.DIDAXIS_URL,
    headless: true,
    trace: "on",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
