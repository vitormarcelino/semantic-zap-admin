import { defineConfig, devices } from "@playwright/test"
import fs from "fs"
import path from "path"

// Carrega .env.test.local manualmente para garantir que os workers herdem as vars
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, "utf-8").split("\n")
  for (const line of lines) {
    const match = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, "")
      process.env[key] = value
    }
  }
}

loadEnvFile(path.resolve(__dirname, ".env.test.local"))
loadEnvFile(path.resolve(__dirname, ".env.test"))

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3300",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
