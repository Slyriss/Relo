import { expect, test } from "@playwright/test";

test.describe("login page", () => {
  test("renders sign-in form and auth options", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder("you@company.com")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /forgot password/i })).toBeVisible();
    await expect(page.getByText(/demo/i)).toHaveCount(0);
  });

  test("mobile layout is single-column and usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder("you@company.com")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("login error shows a clear banner", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill("admin@relo.demo");
    await page.getByPlaceholder("Password").fill("wrong-password");
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /could not sign in/i })).toBeVisible({ timeout: 15_000 });
  });

  test("link to signup page works", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("signup page", () => {
  test("renders sign-up form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /request/i })).toBeVisible();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test("shows inline errors for short and mismatched passwords", async ({ page }) => {
    await page.goto("/signup");
    await page.getByPlaceholder("Your name").fill("Test User");
    await page.getByPlaceholder("you@company.com").fill("test@example.com");
    await page.getByPlaceholder("Create a password").fill("12345678");
    await page.getByPlaceholder("Confirm password").fill("12345679");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i).first()).toBeVisible();
  });
});
