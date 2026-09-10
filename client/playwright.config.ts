import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45_000,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --hostname localhost --port 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
