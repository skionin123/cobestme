import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir:'./tests/e2e',
  testMatch:'**/*.pw.ts',
  timeout:60_000,
  expect:{timeout:10_000},
  fullyParallel:false,
  workers:1,
  reporter:'line',
  use:{
    baseURL:'http://127.0.0.1:5174',
    headless:true,
    viewport:{width:1600,height:1000},
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure',
  },
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
  webServer:{
    command:'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    url:'http://127.0.0.1:5174/e2e.html',
    reuseExistingServer:false,
    timeout:120_000,
  },
})
