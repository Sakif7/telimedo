import { defineConfig } from '@playwright/test';

/* Behaviour, accessibility and no-WebGL checks against a production build (npm test).
   No screenshot comparisons: the owner reviews the visuals by hand. The 3D runs on
   software WebGL (SwiftShader) here, which is slow, so each test waits for it. */

const PORT = Number(process.env.PORT || 3200);
const swiftshader = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const desktop = { width: 1440, height: 900 };
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 300_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || `http://localhost:${PORT}`,
    deviceScaleFactor: 1,
    launchOptions: { args: swiftshader },
  },
  projects: [
    { name: 'desktop-light', testIgnore: /fallback/, use: { viewport: desktop, colorScheme: 'light' } },
    { name: 'desktop-dark', testMatch: /a11y/, use: { viewport: desktop, colorScheme: 'dark' } },
    { name: 'phone-light', testMatch: /behaviour|a11y/, use: { ...phone, colorScheme: 'light' } },
    {
      name: 'no-webgl',
      testMatch: /fallback/,
      use: { viewport: desktop, colorScheme: 'light', launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] } },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: `npm run build && npm run start -- -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: !process.env.CI, timeout: 600_000 },
});
