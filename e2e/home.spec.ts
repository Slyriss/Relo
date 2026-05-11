import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders hero and feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /relationship roi/i })).toBeVisible();
    await expect(page.getByText("Recommended intros")).toBeVisible();
    await expect(page.getByText("QR meeting capture")).toBeVisible();
    await expect(page.getByText("Organizer analytics")).toBeVisible();
  });

  test("Launch demo CTA navigates to dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /launch demo/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/events/);
  });

  test("Attendee mode CTA navigates to event page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /attendee mode/i }).click();
    await expect(page).toHaveURL(/\/events\/relo-summit-2026/);
  });
});
