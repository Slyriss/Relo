import { test as base, type Page } from "@playwright/test";

/**
 * Extends the base Playwright test with an `authedPage` fixture that injects
 * a fake Supabase session cookie so middleware lets the browser into protected
 * routes (/dashboard, /settings, /org) without a real Supabase connection.
 */
export const test = base.extend<{ authedPage: typeof base.prototype.page }>({
  authedPage: async ({ page }: { page: Page }, use: (p: Page) => Promise<void>) => {
    await page.context().addCookies([
      {
        name: "sb-access-token",
        value: "demo-test-token",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false
      }
    ]);
    await use(page);
  }
});

export { expect } from "@playwright/test";
