import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders hero and feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /^Relo$/i })).toBeVisible();
    await expect(page.getByText("Workspace isolation")).toBeVisible();
    await expect(page.getByText("Event operations")).toBeVisible();
    await expect(page.getByText("Attendee outcomes")).toBeVisible();
  });

  test("public CTAs use enterprise access language", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /request access/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^sign in$/i }).first()).toBeVisible();
    await expect(page.getByText(/demo/i)).toHaveCount(0);
  });

  test("mobile landing has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /^Relo$/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
