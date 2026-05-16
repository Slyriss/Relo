import { expect, test as base, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@relo.demo";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
const participantEmail = process.env.E2E_PARTICIPANT_EMAIL ?? "participant@relo.demo";
const participantPassword = process.env.E2E_PARTICIPANT_PASSWORD ?? "participant123";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /^sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|events|setup)/, { timeout: 30_000 });
}

export const test = base.extend<{ authedPage: Page; participantPage: Page }>({
  authedPage: async ({ page }, use) => {
    await login(page, adminEmail, adminPassword);
    await use(page);
  },
  participantPage: async ({ page }, use) => {
    await login(page, participantEmail, participantPassword);
    await use(page);
  },
});

export { expect } from "@playwright/test";
